import { readdir, stat } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';

export const maxImageBytes = 80 * 1024;
const imageExtensions = new Set([
  '.avif',
  '.webp',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.ico',
]);

export async function checkImageBudget(root: string) {
  for (const entry of await readdir(root, {
    recursive: true,
    withFileTypes: true,
  })) {
    if (
      !entry.isFile() ||
      !imageExtensions.has(extname(entry.name).toLowerCase())
    ) {
      continue;
    }
    const path = join(entry.parentPath, entry.name);
    const { size } = await stat(path);
    if (size > maxImageBytes) {
      throw new Error(
        `Image budget exceeded: ${relative(root, path)} is ${size} bytes; ` +
          `the limit is ${maxImageBytes} bytes (80 KiB). ` +
          'Resize to the rendered dimensions and compress before publishing.',
      );
    }
  }
}
