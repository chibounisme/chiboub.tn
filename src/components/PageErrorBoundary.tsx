import { Component, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';

function PageError() {
  usePageTitle('Page unavailable');
  return (
    <section className="about-page" role="alert">
      <h1>Couldn't open this page.</h1>
      <p>Please try again later.</p>
      <Link to="/" className="back-link">
        ← All posts
      </Link>
    </section>
  );
}

export default class PageErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? <PageError /> : this.props.children;
  }
}
