declare module '*.mdx' {
  import type { ComponentType } from 'react';

  export const frontmatter: import('./lib/postCatalog').PostFrontmatter;

  const MDXComponent: ComponentType;
  export default MDXComponent;
}
