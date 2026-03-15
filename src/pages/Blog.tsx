import { Link } from 'react-router-dom';
import { getAllPosts } from '../lib/posts';

export default function Blog() {
  const posts = getAllPosts();

  return (
    <div className="mx-auto w-full max-w-5xl">
      <h1 className="mb-2 text-[clamp(1.3rem,3vw,1.8rem)] font-bold text-site-accent">
        Blog
      </h1>
      <p className="mb-6 max-w-4xl text-sm leading-7 text-site-text-dim sm:mb-8 sm:text-base sm:leading-8">
        Notes on software, systems, and whatever else survives first contact with reality.
      </p>

      {posts.length === 0 ? (
        <p className="italic text-site-text-dim">No posts yet. Check back soon.</p>
      ) : (
        <ul className="space-y-3 sm:space-y-4">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link
                to={`/blog/${post.slug}`}
                className="group block rounded-sm border border-site-surface-border bg-site-surface p-4 text-site-text transition-colors duration-100 hover:border-site-accent hover:no-underline sm:p-5 lg:p-6"
              >
                <span className="text-xs text-site-text-dim">{post.date}</span>
                <h2 className="my-2 text-[1.02rem] font-semibold leading-6 text-site-text transition-colors duration-100 group-hover:text-site-accent sm:text-lg">
                  {post.title}
                </h2>
                <p className="mb-2 text-sm leading-7 text-site-text-dim sm:text-base">
                  {post.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span key={tag} className="text-xs text-site-accent-dim">
                      [{tag}]
                    </span>
                  ))}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
