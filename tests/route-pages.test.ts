import { execFile } from 'node:child_process';
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { expect, it } from 'vitest';

it('emits static entry points for known routes and a fallback for unknown routes', async () => {
  const root = await mkdtemp(join(tmpdir(), 'chiboub-pages-'));
  const html = '<!doctype html><title>Blog</title>';
  try {
    await mkdir(join(root, 'dist'), { recursive: true });
    await mkdir(join(root, 'scripts'));
    await mkdir(join(root, 'src/content/blog/draft.mdx'), { recursive: true });
    await writeFile(join(root, 'dist/index.html'), html);
    await writeFile(join(root, 'src/content/blog/.gitkeep'), '');
    await copyFile(
      join(import.meta.dirname, '../scripts/create-route-pages.ts'),
      join(root, 'scripts/create-route-pages.ts'),
    );
    const run = () =>
      promisify(execFile)(process.execPath, ['scripts/create-route-pages.ts'], {
        cwd: root,
      });
    await run();
    for (const route of ['about/index.html', 'blog/index.html', '404.html']) {
      expect(await readFile(join(root, 'dist', route), 'utf8')).toBe(html);
    }
    await writeFile(
      join(root, 'src/content/blog/orbital-notes.mdx'),
      '# A post',
    );
    await run();
    expect(
      await readFile(join(root, 'dist/blog/orbital-notes/index.html'), 'utf8'),
    ).toBe(html);
    await expect(
      readFile(join(root, 'dist/blog/draft/index.html')),
    ).rejects.toMatchObject({ code: 'ENOENT' });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
