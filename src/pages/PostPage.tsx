import { useParams, Link } from 'react-router-dom';
import { MDXProvider } from '@mdx-js/react';
import { getPostBySlug } from '../lib/posts';
import { mdxComponents } from '../components/MDXComponents';
import { formatPostDate } from '../lib/dates';
import { usePageTitle } from '../hooks/usePageTitle';

export default function PostPage() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getPostBySlug(slug) : undefined;
  usePageTitle(post?.meta.title ?? 'Post not found');
  if (!post) {
    return (
      <section className="about-page">
        <h1>This post isn't here.</h1>
        <Link to="/" className="back-link">
          ← All posts
        </Link>
      </section>
    );
  }
  const { meta, Component } = post;
  return (
    <article>
      <Link to="/" className="back-link">
        ← All posts
      </Link>
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
