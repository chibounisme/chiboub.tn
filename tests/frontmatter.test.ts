import { compile } from '@mdx-js/mdx';
import remarkFrontmatter from 'remark-frontmatter';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';
import { describe, expect, it } from 'vitest';
import {
  parseFrontmatter,
  remarkRequireFrontmatter,
} from '../scripts/frontmatter';

const compilePost = (source: string) =>
  compile(source, {
    remarkPlugins: [
      remarkFrontmatter,
      remarkRequireFrontmatter,
      [
        remarkMdxFrontmatter,
        { name: 'frontmatter', parsers: { yaml: parseFrontmatter } },
      ],
    ],
  });

describe('post frontmatter compilation', () => {
  it('accepts leap days and normalizes optional metadata', async () => {
    const header = 'title: First post\ndate: 2024-02-29\ntags: [notes, notes]';
    expect(parseFrontmatter(header)).toEqual({
      title: 'First post',
      date: '2024-02-29',
      description: '',
      tags: ['notes'],
    });
    expect(parseFrontmatter('title: Another\ndate: 2026-09-04').tags).toEqual(
      [],
    );
    expect(
      String(await compilePost(`---\n${header}\n---\n\nHello.`)),
    ).toContain('export const frontmatter');
  });

  it.each([
    ['# No metadata', 'must start with YAML'],
    ['---\n- not a mapping\n---', 'must be a YAML mapping'],
    ['---\ndate: 2026-09-04\n---', 'title must be a non-empty string'],
    ['---\ntitle: Post\ndate: tomorrow\n---', 'date must use YYYY-MM-DD'],
    ['---\ntitle: Post\ndate: 2025-02-29\n---', 'valid calendar date'],
    ['---\ntitle: Post\ndate: 2026-13-01\n---', 'valid calendar date'],
    [
      '---\ntitle: Post\ndate: 2026-09-04\ndescription: 123\n---',
      'description must be a string',
    ],
    [
      '---\ntitle: Post\ndate: 2026-09-04\ntags: notes\n---',
      'tags must be a list',
    ],
    [
      '---\ntitle: Post\ndate: 2026-09-04\ntags: [notes, 3]\n---',
      'tags must be a list',
    ],
  ])(
    'rejects invalid content before publishing: %s',
    async (source, message) => {
      await expect(compilePost(source)).rejects.toThrow(message);
    },
  );
});
