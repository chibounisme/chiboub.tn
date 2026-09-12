import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build, type Manifest } from 'vite';
import type * as Renderer from '../src/render.tsx';

const root = process.cwd();
const rendererDir = resolve(root, '.build');
const output = resolve(root, 'dist');
try {
  await build({
    build: {
      ssr: 'src/render.tsx',
      outDir: rendererDir,
      copyPublicDir: false,
      rolldownOptions: { output: { entryFileNames: 'render.mjs' } },
    },
  });
  await build({
    build: {
      outDir: output,
      manifest: true,
      rolldownOptions: { input: ['src/index.css', 'src/analytics.ts'] },
    },
  });
  const renderer = (await import(
    pathToFileURL(join(rendererDir, 'render.mjs')).href
  )) as typeof Renderer;
  const manifest = JSON.parse(
    await readFile(join(output, '.vite/manifest.json'), 'utf8'),
  ) as Manifest;
  const css = manifest['src/index.css']?.file;
  const analytics = manifest['src/analytics.ts']?.file;
  if (!css || !analytics) throw new Error('Missing production assets.');
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
      renderer.renderPage(path, { css: '/' + css, analytics: '/' + analytics })
        .html,
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
  console.log(
    `Generated ${paths.length} content pages, About redirect, and 404 page.`,
  );
} finally {
  await rm(rendererDir, { recursive: true, force: true });
}
