import { MDXProvider } from '@mdx-js/react';
import type { PostEntry } from '../lib/postCatalog';
import { mdxComponents } from '../components/MDXComponents';
import { formatPostDate } from '../lib/dates';

export default function PostPage({ post }: { post: PostEntry }) {
  const { meta, Component } = post;
  return (
    <article>
      <a href="/blog/" className="back-link">
        ← All posts
      </a>
      <header className="article-header">
        <time dateTime={meta.date}>{formatPostDate(meta.date, true)}</time>
        <h1>{meta.title}</h1>
        {meta.description && (
          <p className="article-description">{meta.description}</p>
        )}
        {meta.tags.length > 0 && (
          <ul className="article-tags" aria-label="Topics">
            {meta.tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        )}
      </header>
      <div className="prose">
        <MDXProvider components={mdxComponents}>
          <Component />
        </MDXProvider>
      </div>
    </article>
  );
}
