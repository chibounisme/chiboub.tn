import { parse } from 'yaml';
import type { PostFrontmatter } from '../src/lib/postCatalog.ts';

export function remarkRequireFrontmatter() {
  return (tree: { children: readonly { type: string }[] }) => {
    if (tree.children[0]?.type !== 'yaml') {
      throw new Error(
        'Posts must start with YAML frontmatter containing a title and date.',
      );
    }
  };
}

export function parseFrontmatter(source: string): PostFrontmatter {
  const value: unknown = parse(source);
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('Post frontmatter must be a YAML mapping.');
  }
  const data = value as Record<string, unknown>;
  if (typeof data.title !== 'string' || !data.title.trim()) {
    throw new Error('Post title must be a non-empty string.');
  }
  if (typeof data.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    throw new Error('Post date must use YYYY-MM-DD.');
  }
  const date = new Date(data.date);
  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== data.date
  ) {
    throw new Error('Post date must be a valid calendar date.');
  }
  if (data.description !== undefined && typeof data.description !== 'string') {
    throw new Error('Post description must be a string.');
  }
  const tags: string[] = [];
  if (data.tags !== undefined) {
    if (!Array.isArray(data.tags))
      throw new Error('Post tags must be a list of non-empty strings.');
    const authoredTags: unknown[] = data.tags;
    for (const tag of authoredTags) {
      if (typeof tag !== 'string' || !tag.trim())
        throw new Error('Post tags must be a list of non-empty strings.');
      tags.push(tag.trim());
    }
  }
  return {
    title: data.title.trim(),
    date: data.date,
    description: data.description ?? '',
    tags: [...new Set(tags)],
  };
}
