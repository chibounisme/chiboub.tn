import type { ComponentType } from 'react';

export interface PostFrontmatter {
  title: string;
  date: string;
  description: string;
  tags?: string[];
}

interface PostMeta extends PostFrontmatter {
  tags: string[];
  slug: string;
}

export interface PostModule {
  default: ComponentType;
  frontmatter: PostFrontmatter;
}

export function createPostCatalog(modules: Record<string, PostModule>) {
  const entries = Object.entries(modules).map(([path, module]) => ({
    meta: {
      ...module.frontmatter,
      tags: module.frontmatter.tags ?? [],
      slug:
        path
          .split('/')
          .at(-1)
          ?.replace(/\.mdx$/, '') ?? '',
    } satisfies PostMeta,
    Component: module.default,
  }));

  entries.sort(
    (a, b) =>
      Date.parse(b.meta.date) - Date.parse(a.meta.date) ||
      a.meta.slug.localeCompare(b.meta.slug),
  );
  const posts = entries.map((entry) => entry.meta);
  const bySlug = new Map(entries.map((entry) => [entry.meta.slug, entry]));

  return {
    getAllPosts: () => posts,
    getPostBySlug: (slug: string) => bySlug.get(slug),
  };
}
