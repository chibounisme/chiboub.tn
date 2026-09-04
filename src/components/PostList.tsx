import { Link } from 'react-router-dom';
import { getAllPosts } from '../lib/posts';
import { formatPostDate } from '../lib/dates';

export default function PostList() {
  const posts = getAllPosts();
  if (!posts.length) return <p className="posts-empty">Nothing here yet.</p>;
  return (
    <ul className="post-list">
      {posts.map((post) => (
        <li key={post.slug}>
          <time dateTime={post.date} title={formatPostDate(post.date, true)}>
            {formatPostDate(post.date)}
          </time>
          <Link to={`/blog/${encodeURIComponent(post.slug)}`}>
            {post.title}
          </Link>
        </li>
      ))}
    </ul>
  );
}
