import { cp, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build, type Manifest } from 'vite';
import type * as Renderer from '../src/render.tsx';
import { checkImageBudget } from './image-budget.ts';
import { checkOutput } from './check-output.ts';

const root = process.cwd();
const work = resolve(root, '.build');
const rendererDir = join(work, 'renderer');
const output = join(work, 'site');
await rm(work, { recursive: true, force: true });
try {
  await build({
    build: {
      ssr: 'src/render.tsx',
      outDir: rendererDir,
      copyPublicDir: false,
      emitAssets: true,
      rolldownOptions: { output: { entryFileNames: 'render.mjs' } },
    },
  });
  await build({
    build: {
      outDir: output,
      manifest: true,
      rolldownOptions: { input: ['src/index.css'] },
    },
  });
  // SSR templates can import assets too; the stylesheet build does not discover them.
  await cp(join(rendererDir, 'assets'), join(output, 'assets'), {
    recursive: true,
  }).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== 'ENOENT') throw error;
  });
  const renderer = (await import(
    pathToFileURL(join(rendererDir, 'render.mjs')).href,
  )) as typeof Renderer;
  const manifest = JSON.parse(
    await readFile(join(output, '.vite/manifest.json'), 'utf8'),
  ) as Manifest;
  const css = manifest['src/index.css']?.file;
  if (!css) throw new Error('Missing production stylesheet.');
  const paths = renderer.pagePaths();
  for (const path of [...paths, '/about/', '/404.html']) {
    // Decode only the generated filename; the URL remains encoded in links and metadata.
    const file =
      path === '/404.html'
        ? '404.html'
        : join(decodeURIComponent(path.slice(1)), 'index.html');
    const target = join(output, file);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(
      target,
      renderer.renderPage(path, {
        css: '/' + css,
      }).html,
    );
  }
  await writeFile(
    join(output, 'sitemap.xml'),
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
    paths
      .map((path) => `<url><loc>${renderer.siteUrl}${path}</loc></url>`)
      .join('') +
      '</urlset>\n',
  );
  await writeFile(
    join(output, 'robots.txt'),
    `User-agent: *\nAllow: /\nSitemap: ${renderer.siteUrl}/sitemap.xml\n`,
  );
  await writeFile(join(output, '.nojekyll'), '');
  await rm(join(output, '.vite'), { recursive: true, force: true });
  await checkImageBudget(output);
  await checkOutput(output);
  // Publish only validated output. Failed builds preserve the last successful site.
  await rm(resolve(root, 'dist'), { recursive: true, force: true });
  await rename(output, resolve(root, 'dist'));
  console.log(
    `Generated ${paths.length} content pages, About redirect, and 404 page.`,
  );
} finally {
  await rm(work, { recursive: true, force: true });
}
