import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { expect, it } from 'vitest';
import { checkOutput } from '../scripts/check-output';

const page = (body = '<img src="/image.svg" alt="" width="100" height="100">') =>
  `<!doctype html><html><head><link rel="stylesheet" href="/assets/site.css"></head><body>${body}</body></html>`;
const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"></svg>';

async function fixture(run: (root: string) => Promise<void>) {
  const root = await mkdtemp(join(tmpdir(), 'chiboub-output-'));
  try {
    await mkdir(join(root, 'assets'));
    await writeFile(join(root, 'index.html'), page());
    await writeFile(join(root, 'assets/site.css'), 'body{color:red}');
    await writeFile(join(root, 'image.svg'), svg);
    await run(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

it('accepts local resources, relative URLs, query strings, and native links', () => fixture(async (root) => {
  await mkdir(join(root, 'about'));
  await writeFile(join(root, 'about/index.html'), page('<img src="../image.svg?v=1" alt="" width="100" height="100"><a href="/?v=2#main">Home</a><a href="https://example.com">Elsewhere</a><a href="mailto:hello@example.com">Email</a>'));
  await writeFile(join(root, 'assets/site.css'), 'body{background:url(../image.svg)}');
  await expect(checkOutput(root)).resolves.toBeUndefined();
}));

it.each([
  ['missing asset', 'index.html', page('<img src="/missing.webp" alt="" width="100" height="100">'), 'Missing local target'],
  ['missing page', 'index.html', page('<a href="/missing/">Missing</a>'), 'Missing local target'],
  ['missing responsive variant', 'index.html', page('<img src="/image.svg" srcset="/image.svg 100w, /missing.svg 200w" sizes="100px" alt="" width="100" height="100">'), 'Missing local target'],
  ['missing responsive sizes', 'index.html', page('<img src="/image.svg" srcset="/image.svg 100w" alt="" width="100" height="100">'), 'needs sizes'],
  ['missing dimensions', 'index.html', page('<img src="/image.svg" alt="">'), 'positive width/height'],
  ['zero dimensions', 'index.html', page('<img src="/image.svg" alt="" width="0" height="100">'), 'positive width/height'],
  ['missing alternative text', 'index.html', page('<img src="/image.svg" width="100" height="100">'), 'Images need'],
  ['remote asset', 'index.html', page('<img src="https://example.com/image.webp" alt="" width="100" height="100">'), 'External or inline asset'],
  ['inline asset', 'index.html', page('<img src="data:image/svg+xml,test" alt="" width="100" height="100">'), 'External or inline asset'],
  ['script element', 'index.html', page('<script>alert(1)</script>'), 'Executable content'],
  ['event handler', 'index.html', page('<button onclick="alert(1)">Click</button>'), 'Executable content'],
  ['script URL', 'index.html', page('<a href="javascript:alert(1)">Click</a>'), 'Executable content'],
  ['SVG script', 'image.svg', '<svg><script>alert(1)</script></svg>', 'Executable content'],
  ['published script', 'app.js', 'alert(1)', 'Unexpected published file'],
  ['source map', 'site.css.map', '{}', 'Unexpected published file'],
  ['unused asset', 'unused.svg', svg, 'Unreferenced published asset'],
  ['CSS growth', 'assets/site.css', '/*' + 'x'.repeat(32 * 1024) + '*/', 'CSS budget exceeded'],
  ['web font', 'assets/site.css', '@font-face{font-family:test;src:url(/font.woff2)}', 'Downloaded fonts'],
  ['CSS import', 'assets/site.css', '@import "https://example.com/style.css";', 'unresolved CSS imports'],
  ['missing CSS image', 'assets/site.css', 'body{background:url(../missing.webp)}', 'Missing local target'],
])('rejects %s before publication', async (_name, file, content, error) => {
  await fixture(async (root) => {
    await writeFile(join(root, file), content);
    await expect(checkOutput(root)).rejects.toThrow(error);
  });
});

it('limits compressed HTML size', () => fixture(async (root) => {
  await writeFile(join(root, 'index.html'), page(randomBytes(100 * 1024).toString('hex')));
  await expect(checkOutput(root)).rejects.toThrow('HTML budget exceeded');
}));
