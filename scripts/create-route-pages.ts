import { copyFile, mkdir, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const output = join(root, 'dist');
const posts = await readdir(join(root, 'src/content/blog'), {
  withFileTypes: true,
});
const routes = [
  'about',
  'blog',
  ...posts
    .filter((post) => post.isFile() && post.name.endsWith('.mdx'))
    .map((post) => `blog/${post.name.slice(0, -4)}`),
];

await copyFile(join(output, 'index.html'), join(output, '404.html'));
for (const route of routes) {
  const directory = join(output, route);
  await mkdir(directory, { recursive: true });
  await copyFile(join(output, 'index.html'), join(directory, 'index.html'));
}
