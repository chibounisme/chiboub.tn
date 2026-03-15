import { Link } from 'react-router-dom';
import { getAllPosts } from '../lib/posts';

export default function Home() {
  const posts = getAllPosts();
  const latestPosts = posts.slice(0, 3);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 sm:gap-8">
      <section className="rounded-sm border border-site-surface-border bg-site-surface/95 p-5 sm:p-6">
        <h1 className="mb-4 text-[clamp(1.1rem,3vw,1.75rem)] font-bold leading-[1.2] text-site-accent">
          Mohamed Chiboub
        </h1>
        <p className="max-w-4xl text-sm leading-7 text-site-text sm:text-base sm:leading-8">
          Hi. I'm Mohamed — a software engineer who builds things for the web
          and beyond. I like clean systems, weird experiments, and writing things
          down so I don't forget them.
        </p>
      </section>

      <section className="rounded-sm border border-site-surface-border bg-site-surface/95 p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-site-accent">
              Latest writing
            </h2>
          </div>
          <Link
            to="/blog"
            className="text-sm text-site-accent-dim transition-colors duration-100 hover:text-site-accent hover:no-underline"
          >
            see all posts -&gt;
          </Link>
        </div>

        {latestPosts.length === 0 ? (
          <p className="text-sm italic text-site-text-dim">Nothing so far (a.k.a ’tghidh’)</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {latestPosts.map((post) => (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}`}
                className="group rounded-sm border border-site-surface-border bg-black/20 p-4 transition-colors duration-100 hover:border-site-accent hover:no-underline"
              >
                <p className="text-xs text-site-text-dim">{post.date}</p>
                <h3 className="mt-2 text-base font-semibold leading-6 text-site-text transition-colors duration-100 group-hover:text-site-accent">
                  {post.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-site-text-dim">
                  {post.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span key={tag} className="text-[0.72rem] text-site-accent-dim">
                      [{tag}]
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
