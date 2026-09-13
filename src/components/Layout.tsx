import type { ReactNode } from 'react';

export default function Layout({
  children,
  page,
}: {
  children: ReactNode;
  page: 'about' | 'blog' | 'not-found';
}) {
  const navLinkClassName =
    'inline-flex min-h-11 items-center no-underline aria-[current=page]:text-site-text aria-[current=page]:underline';

  return (
    <div className="min-h-svh px-7 py-16 mobile:px-6 mobile:py-8">
      <a
        className="absolute top-3 left-6 z-5 -translate-y-[200%] bg-site-bg px-2.5 py-1.25 underline focus:translate-y-0"
        href="#main-content"
      >
        Skip to content
      </a>
      <div className="mx-auto w-full max-w-[580px]">
        <header className="mb-12 mobile:mb-9">
          <nav
            className="flex flex-wrap items-center gap-6 text-sm leading-[1.8] text-site-text-dim"
            aria-label="Main navigation"
          >
            <a
              className={navLinkClassName}
              href="/"
              aria-current={page === 'about' ? 'page' : undefined}
            >
              About me
            </a>
            <a
              className={navLinkClassName}
              href="/blog/"
              aria-current={page === 'blog' ? 'page' : undefined}
            >
              Blog
            </a>
            <a
              className={navLinkClassName}
              href="https://github.com/chibounisme"
            >
              GitHub
            </a>
            <a
              className={navLinkClassName}
              href="https://www.linkedin.com/in/chiboub/"
            >
              LinkedIn
            </a>
          </nav>
        </header>
        <main id="main-content" tabIndex={-1} className="focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}
