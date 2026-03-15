import { useParams, Link } from 'react-router-dom';
import { MDXProvider } from '@mdx-js/react';
import { getPostBySlug } from '../lib/posts';
import { mdxComponents } from '../components/MDXComponents';

const backLinkClass =
  'inline-block text-sm text-site-accent-dim transition-colors duration-100 hover:text-site-accent hover:no-underline';

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getPostBySlug(slug) : undefined;

  if (!post) {
    return (
      <div className="w-full space-y-4">
        <p className="text-base text-red-500">
          {'>'} ERROR: post not found.
        </p>
        <Link to="/blog" className={backLinkClass}>
          {'<'}- back to blog
        </Link>
      </div>
    );
  }

  const { meta, Component } = post;

  return (
    <div className="mx-auto w-full max-w-5xl">
      <Link to="/blog" className={`${backLinkClass} mb-6 block`}>
        {'<'}- back to blog
      </Link>

      <article className="rounded-sm border border-site-surface-border bg-site-surface px-4 py-5 sm:px-8 sm:py-8 md:px-10 md:py-9 lg:px-12 lg:py-10">
        <header className="mb-8 border-b border-dashed border-site-surface-border pb-6">
          <span className="text-xs text-site-text-dim">{meta.date}</span>
          <h1 className="my-2 text-[clamp(1.1rem,3vw,1.5rem)] font-bold leading-normal text-site-accent">
            {meta.title}
          </h1>
          <p className="mb-3 text-site-text-dim">{meta.description}</p>
          <div className="flex flex-wrap gap-2">
            {meta.tags.map((tag) => (
              <span key={tag} className="text-xs text-site-accent-dim">
                [{tag}]
              </span>
            ))}
          </div>
        </header>

        <div className="min-w-0 wrap-break-word">
          <MDXProvider components={mdxComponents}>
            <Component />
          </MDXProvider>
        </div>
      </article>
    </div>
  );
}
