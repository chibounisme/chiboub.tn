import { getAllPosts } from '../lib/posts';
import { formatPostDate } from '../lib/dates';

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <section aria-label="Blog">
      {posts.length
        ? (
            <ul className="mt-7 w-full max-w-full list-none p-0">
              {posts.map((post) => (
                <li
                  key={post.slug}
                  className="mb-5.5 grid grid-cols-[70px_minmax(0,1fr)] items-baseline gap-5 mobile:mb-5 mobile:grid-cols-[53px_minmax(0,1fr)] mobile:gap-3.5"
                >
                  <time
                    className="font-mono text-xs leading-[1.8] text-site-text-dim"
                    dateTime={post.date}
                    title={formatPostDate(post.date, true)}
                  >
                    {formatPostDate(post.date)}
                  </time>
                  <a
                    className="inline-block py-1.75 text-lg leading-normal wrap-anywhere no-underline hover:underline focus-visible:underline mobile:text-[1.0625rem]"
                    href={`/blog/${encodeURIComponent(post.slug)}/`}
                  >
                    {post.title}
                  </a>
                </li>
              ))}
            </ul>
          )
        : (
            <p className="my-10 text-sm text-site-text-dim">Nothing here yet.</p>
          )}
    </section>
  );
}
