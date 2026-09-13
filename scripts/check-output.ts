import { readFile, readdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { parse, type DefaultTreeAdapterMap } from 'parse5';

const origin = 'https://chiboub.tn';
const maxCssBytes = 32 * 1024;
const maxHtmlGzipBytes = 64 * 1024;
const allowedExtensions = new Set([
  '.html', '.css', '.xml', '.txt', '.svg', '.webp', '.avif',
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf',
]);
const infrastructure = new Set(['CNAME', '.nojekyll', 'robots.txt', 'sitemap.xml']);

function* elements(node: DefaultTreeAdapterMap['node']): Generator<DefaultTreeAdapterMap['element']> {
  if ('tagName' in node) yield node;
  if ('childNodes' in node) {
    for (const child of node.childNodes) yield* elements(child);
  }
  if ('content' in node) yield* elements(node.content);
}

// Validate the actual artifact, including every real post and copied public file.
export async function checkOutput(root: string) {
  const files = new Set<string>();
  for (const entry of await readdir(root, { recursive: true, withFileTypes: true })) {
    if (entry.isSymbolicLink()) throw new Error(`Symlink in output: ${entry.name}`);
    if (entry.isFile()) {
      files.add(join(entry.parentPath, entry.name).slice(root.length + 1));
    }
  }
  const referenced = new Set<string>();
  let cssBytes = 0;

  function reference(raw: string, from: string, resource: boolean) {
    const url = new URL(raw, `${origin}/${from}`);
    if (url.origin !== origin) {
      if (resource) throw new Error(`External or inline asset in ${from}: ${raw}`);
      return;
    }
    const path = decodeURIComponent(url.pathname).slice(1);
    const target = files.has(path) ? path : join(path, 'index.html');
    if (!files.has(target)) throw new Error(`Missing local target in ${from}: ${raw}`);
    referenced.add(target);
  }

  function cssReferences(css: string, from: string) {
    if (/@font-face|@import\b/i.test(css)) {
      throw new Error(`Downloaded fonts or unresolved CSS imports in ${from}`);
    }
    for (const match of css.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/gi)) {
      const url = match[2]!.trim();
      if (url.startsWith('#')) continue;
      // Keep URLs inspectable; Vite normally emits plain, fingerprinted asset paths.
      if (url.includes('\\')) throw new Error(`Escaped asset URL in ${from}: ${url}`);
      reference(url, from, true);
    }
  }

  for (const file of files) {
    const extension = extname(file).toLowerCase();
    if (!infrastructure.has(file) && !allowedExtensions.has(extension)) {
      throw new Error(`Unexpected published file: ${file}`);
    }
    if (extension === '.css') {
      const css = await readFile(join(root, file), 'utf8');
      cssBytes += Buffer.byteLength(css);
      cssReferences(css, file);
    }
    if (extension !== '.html' && extension !== '.svg') continue;
    const html = await readFile(join(root, file), 'utf8');
    if (gzipSync(html).byteLength > maxHtmlGzipBytes) {
      throw new Error(`HTML budget exceeded: ${file} exceeds 64 KiB gzip`);
    }
    for (const element of elements(parse(html))) {
      const attrs = Object.fromEntries(element.attrs.map(({ name, value }) => [name, value]));
      const tag = element.tagName;
      if (['script', 'iframe', 'object', 'embed', 'base'].includes(tag) ||
        Object.keys(attrs).some((name) => /^on/i.test(name)) ||
        Object.values(attrs).some((value) => /^\s*javascript:/i.test(value))) {
        throw new Error(`Executable content or base URL in ${file}: <${tag}>`);
      }
      if (tag === 'style') {
        cssReferences(element.childNodes.map((node) => 'value' in node ? node.value : '').join(''), file);
      }
      if (attrs.style) cssReferences(attrs.style, file);
      if (tag === 'img') {
        if (!attrs.src || !('alt' in attrs) ||
          !['width', 'height'].every((name) => /^\d+$/.test(attrs[name] ?? '') && Number(attrs[name]) > 0)) {
          throw new Error(`Images need src, alt, and positive width/height in ${file}`);
        }
      }
      for (const attribute of ['src', 'poster']) {
        if (attrs[attribute]) reference(attrs[attribute], file, true);
      }
      for (const attribute of ['srcset', 'imagesrcset']) {
        const value = attrs[attribute];
        if (!value) continue;
        if (/(?:^|,)\s*data:/i.test(value)) throw new Error(`Inline image in ${file}`);
        if (/\s\d+w\b/.test(value) && !attrs[attribute === 'srcset' ? 'sizes' : 'imagesizes']) {
          throw new Error(`Responsive image needs sizes in ${file}`);
        }
        for (const candidate of value.split(',')) {
          reference(candidate.trim().split(/\s+/)[0]!, file, true);
        }
      }
      if (attrs.href) {
        const resource = ['image', 'use', 'feImage'].includes(tag) ||
          (tag === 'link' && (attrs.rel ?? '').split(/\s+/).some(
            (rel) => ['stylesheet', 'icon', 'preload', 'modulepreload', 'prefetch'].includes(rel),
          ));
        if (resource && attrs.href.startsWith('#')) continue;
        if (resource || tag === 'a') reference(attrs.href, file, resource);
      }
    }
  }
  if (cssBytes > maxCssBytes) throw new Error(`CSS budget exceeded: ${cssBytes} bytes; limit is ${maxCssBytes}`);
  for (const file of files) {
    if (!infrastructure.has(file) && extname(file) !== '.html' && !referenced.has(file)) {
      throw new Error(`Unreferenced published asset: ${file}`);
    }
  }
  console.log(`Validated ${files.size} output files; CSS ${(cssBytes / 1024).toFixed(1)} KiB / 32 KiB.`);
}
