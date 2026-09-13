import { execFile } from 'node:child_process';
import {
  cp,
  mkdtemp,
  readFile,
  readdir,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { expect, it } from 'vitest';

it('builds readable pages with valid assets and removes deleted posts on rebuild', async () => {
  const project = resolve(import.meta.dirname, '..');
  const root = await mkdtemp(join(tmpdir(), 'chiboub-static-'));
  const run = () =>
    promisify(execFile)(process.execPath, ['scripts/build.ts'], {
      cwd: root,
      maxBuffer: 1024 * 1024,
    });
  try {
    for (const path of [
      'src',
      'scripts',
      'public',
      'vite.config.ts',
      'tsconfig.json',
      'package.json',
    ]) {
      await cp(join(project, path), join(root, path), { recursive: true });
    }
    await symlink(
      join(project, 'node_modules'),
      join(root, 'node_modules'),
      'dir',
    );
    const post = join(root, 'src/content/blog/integration-post.mdx');
    await cp(join(project, 'tests/fixtures/article.mdx'), post);
    await run();
    const pages = [
      { path: 'index.html', stylesheets: 1 },
      { path: 'blog/index.html', stylesheets: 1 },
      { path: 'blog/integration-post/index.html', stylesheets: 2 },
      { path: 'about/index.html', stylesheets: 0 },
      { path: '404.html', stylesheets: 1 },
    ];
    for (const { path, stylesheets } of pages) {
      const html = await readFile(join(root, 'dist', path), 'utf8');
      const doc = new DOMParser().parseFromString(html, 'text/html');
      expect(
        doc.querySelector('main')?.textContent?.trim().length,
      ).toBeGreaterThan(10);
      expect(doc.querySelector('#root, canvas')).toBeNull();
      expect(doc.scripts).toHaveLength(0);
      expect(
        doc.querySelector('link[rel="preconnect"], link[rel="preload"]'),
      ).toBeNull();
      for (const resource of doc.querySelectorAll('link[rel="stylesheet"]')) {
        expect(resource.getAttribute('href')).toMatch(/^\/assets\//);
      }
      expect(doc.querySelectorAll('link[rel="stylesheet"]')).toHaveLength(
        stylesheets,
      );
      expect(
        doc.querySelector('meta[name="description"]')?.getAttribute('content'),
      ).toBeTruthy();
      // Every local link, stylesheet, and favicon resolves without client routing.
      for (const element of doc.querySelectorAll('[href], script[src]')) {
        const url = element.getAttribute('href') ?? element.getAttribute('src');
        if (!url?.startsWith('/') || url.startsWith('//')) continue;
        const target = url.split('#')[0] ?? '';
        if (!target) continue;
        const file = target.endsWith('/') ? target + 'index.html' : target;
        const resolved = join(root, 'dist', decodeURIComponent(file.slice(1)));
        // MDX fixture's /about link intentionally tests the legacy alias.
        await expect(
          readFile(
            target === '/about' ? join(resolved, 'index.html') : resolved,
          ),
        ).resolves.toBeDefined();
      }
    }
    const article = new DOMParser().parseFromString(
      await readFile(
        join(root, 'dist/blog/integration-post/index.html'),
        'utf8',
      ),
      'text/html',
    );
    expect(article.querySelector('pre code')?.textContent).toContain(
      'const message',
    );
    expect(
      article.querySelector('meta[property="og:url"]')?.getAttribute('content'),
    ).toBe('https://chiboub.tn/blog/integration-post/');
    const assets = await readdir(join(root, 'dist/assets'));
    const scripts = assets.filter((name) => name.endsWith('.js'));
    expect(scripts).toHaveLength(0);
    for (const name of assets.filter((name) => name.endsWith('.css'))) {
      const css = await readFile(join(root, 'dist/assets', name), 'utf8');
      expect(css).not.toMatch(/@font-face|url\(\s*['"]?https?:\/\//);
    }
    expect(await readFile(join(root, 'dist/sitemap.xml'), 'utf8')).toContain(
      '/blog/integration-post/',
    );
    expect(await readFile(join(root, 'dist/CNAME'), 'utf8')).toContain(
      'chiboub.tn',
    );
    await rm(post);
    await run();
    await expect(
      readFile(join(root, 'dist/blog/integration-post/index.html')),
    ).rejects.toMatchObject({ code: 'ENOENT' });
    expect(
      await readFile(join(root, 'dist/sitemap.xml'), 'utf8'),
    ).not.toContain('integration-post');
    await writeFile(
      post,
      '---\ntitle: Broken\ndate: not-a-date\n---\nInvalid post',
    );
    await expect(run()).rejects.toThrow();
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 60000);
