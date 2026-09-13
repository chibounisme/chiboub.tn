import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

const cwd = resolve(import.meta.dirname, '..');
const linter = new ESLint({ cwd });
const formatter = new ESLint({ cwd, fix: true });

describe('centralized ESLint checks', () => {
  it('retains typed bug detection alongside code style', async () => {
    const [result] = await linter.lintText('Promise.resolve("unfinished")\n', {
      filePath: 'src/lib/dates.ts',
    });
    expect(result?.messages.map(({ ruleId }) => ruleId)).toEqual(
      expect.arrayContaining([
        '@typescript-eslint/no-floating-promises',
        '@stylistic/quotes',
        '@stylistic/semi',
      ]),
    );
  }, 20_000);

  it('fixes JSX style and Tailwind order and duplicates in a stable pass', async () => {
    const input = 'export default function Example(){\nreturn <div className="p-4 flex p-4"/>\n}\n';
    const [fixed] = await formatter.lintText(input, {
      filePath: 'src/components/Layout.tsx',
    });
    expect(fixed?.messages).toEqual([]);
    expect(fixed?.output).toContain('className="flex p-4"');
    const [checked] = await linter.lintText(fixed?.output ?? input, {
      filePath: 'src/components/Layout.tsx',
    });
    expect(checked?.messages).toEqual([]);
    const [second] = await formatter.lintText(fixed?.output ?? input, {
      filePath: 'src/components/Layout.tsx',
    });
    expect(second?.output).toBeUndefined();
  });

  it.each([
    ['package.json', '{"duplicate":1,"duplicate":2}', 'jsonc/no-dupe-keys'],
    ['example.jsonc', '{\n // comment\n "duplicate":1,"duplicate":2\n}', 'jsonc/no-dupe-keys'],
    ['example.yaml', 'key:\n value: true\n', 'yml/indent'],
    ['example.css', '.example { colro: red; }', 'css/no-invalid-properties'],
    ['example.md', '# Heading\n\n[broken][missing]\n', 'markdown/no-missing-label-refs'],
    ['example.svg', '<svg width="1" width="2"></svg>', 'html/no-duplicate-attrs'],
    ['example.html', '<div id="one" id="two"></div>', 'html/no-duplicate-attrs'],
  ])('checks %s through its language plugin', async (filePath, source, expectedRule) => {
    const [result] = await linter.lintText(source, { filePath });
    expect(result?.messages.map(({ ruleId }) => ruleId)).toContain(expectedRule);
  });

  it('accepts Tailwind syntax while still rejecting unknown CSS at-rules', async () => {
    const [valid] = await linter.lintText(
      '@import "tailwindcss" source(none);\n@source "./pages";\n@theme { --color-site-bg: #101310; }\n.example { color: var(--color-site-bg); }\n',
      { filePath: 'src/index.css' },
    );
    expect(valid?.messages).toEqual([]);
    const [invalid] = await linter.lintText('@misspelled "value";\n', {
      filePath: 'example.css',
    });
    expect(invalid?.messages.map(({ ruleId }) => ruleId)).toContain('css/no-invalid-at-rules');
  });

  it('checks MDX syntax and fixes classes without treating JSX as a statement', async () => {
    const input = '---\ntitle: Example\ndate: "2026-09-13"\n---\n\n# Heading\n\n<div className="p-4 flex p-4">Content</div>\n';
    const [fixed] = await formatter.lintText(input, { filePath: 'example.mdx' });
    expect(fixed?.messages).toEqual([]);
    expect(fixed?.output).toBe(input.replace('p-4 flex p-4', 'flex p-4'));
    const [checked] = await linter.lintText(fixed?.output ?? input, { filePath: 'example.mdx' });
    expect(checked?.messages).toEqual([]);
    const [invalid] = await linter.lintText('<div>\n', { filePath: 'example.mdx' });
    expect(invalid?.fatalErrorCount).toBeGreaterThan(0);
  });

  it('preserves article headings, lists, links, code blocks and inline JSX', async () => {
    const filePath = 'tests/fixtures/article.mdx';
    const input = await readFile(resolve(cwd, filePath), 'utf8');
    const [result] = await formatter.lintText(input, { filePath });
    expect(result?.messages).toEqual([]);
    expect(result?.output ?? input).toBe(input);
  });

  it.each([
    'pnpm-lock.yaml',
    'dist/index.html',
    'coverage/index.html',
    '.build/render.mjs',
    'lighthouse-reports/summary.json',
    'node_modules/example/index.js',
  ])('excludes generated file %s', async (filePath) => {
    expect(await linter.isPathIgnored(filePath)).toBe(true);
  });
});
