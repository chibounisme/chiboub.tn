import { Link } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';

export default function NotFoundPage() {
  usePageTitle('Page not found');
  return (
    <section className="about-page">
      <h1>Nothing at this address.</h1>
      <Link className="back-link" to="/">
        ← Back to writing
      </Link>
    </section>
  );
}
