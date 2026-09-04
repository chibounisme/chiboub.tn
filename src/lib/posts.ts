import { createPostCatalog, type PostModule } from './postCatalog';

const modules = import.meta.glob<PostModule>('../content/blog/*.mdx', {
  eager: true,
});

export const { getAllPosts, getPostBySlug } = createPostCatalog(modules);
