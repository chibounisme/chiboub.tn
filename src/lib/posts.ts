import type { ComponentType } from 'react';

export interface PostMeta {
  title: string;
  date: string;
  description: string;
  tags: string[];
  slug: string;
}

interface PostModule {
  default: ComponentType;
  frontmatter: {
    title: string;
    date: string;
    description: string;
    tags?: string[];
  };
}

const modules = import.meta.glob<PostModule>('../content/blog/*.mdx', {
  eager: true,
});

function deriveSlug(path: string): string {
  const filename = path.split('/').pop() ?? '';
  return filename.replace(/\.mdx$/, '');
}

export function getAllPosts(): PostMeta[] {
  return Object.entries(modules)
    .map(([path, mod]) => ({
      ...mod.frontmatter,
      tags: mod.frontmatter.tags ?? [],
      slug: deriveSlug(path),
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostBySlug(slug: string) {
  const entry = Object.entries(modules).find(
    ([path]) => deriveSlug(path) === slug,
  );
  if (!entry) return undefined;
  const [, mod] = entry;
  return {
    meta: {
      ...mod.frontmatter,
      tags: mod.frontmatter.tags ?? [],
      slug,
    } satisfies PostMeta,
    Component: mod.default,
  };
}
