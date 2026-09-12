import type { ReactNode } from 'react';

export default function Layout({
  children,
  page,
}: {
  children: ReactNode;
  page: 'about' | 'blog' | 'not-found';
}) {
  return (
    <div className="site">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <div className="site-shell">
        <header className="site-header">
          <nav className="site-nav" aria-label="Main navigation">
            <a href="/" aria-current={page === 'about' ? 'page' : undefined}>
              About me
            </a>
            <a
              href="/blog/"
              aria-current={page === 'blog' ? 'page' : undefined}
            >
              Blog
            </a>
            <a href="https://github.com/chibounisme">GitHub</a>
            <a href="https://www.linkedin.com/in/chiboub/">LinkedIn</a>
          </nav>
        </header>
        <main id="main-content" tabIndex={-1} className="site-main">
          {children}
        </main>
      </div>
    </div>
  );
}
