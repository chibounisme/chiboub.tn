import { Link, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { GitHubIcon, LinkedInIcon } from './Icons';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navLinkClass = (isActive: boolean) =>
    [
      'text-[0.8rem] transition-colors duration-100 hover:no-underline sm:text-sm',
      isActive
        ? 'text-site-accent'
        : 'text-site-text-dim hover:text-site-accent',
    ].join(' ');

  return (
    <div className="relative z-10 flex min-h-screen flex-col">
      <nav className="sticky top-0 z-20 border-b border-site-surface-border bg-black/80 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-x-4 px-3 py-3 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="text-sm font-semibold tracking-[0.02em] text-site-accent transition-colors duration-100 hover:text-white hover:no-underline sm:text-[0.95rem]"
          >
            chiboub.tn
          </Link>
          <div className="flex items-center gap-3 sm:gap-5">
            <Link
              to="/"
              className={navLinkClass(location.pathname === '/')}
            >
              home
            </Link>
            <Link
              to="/blog"
              className={navLinkClass(location.pathname.startsWith('/blog'))}
            >
              blog
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto flex w-full max-w-6xl flex-1 px-3 pb-14 pt-6 sm:px-6 sm:pb-16 sm:pt-8 lg:px-8 lg:pt-10">
        {children}
      </main>

      <footer className="border-t border-site-surface-border bg-black/80 px-3 py-6 text-center sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-6xl">
        <div className="mb-3 flex justify-center gap-6 [&_svg]:size-4.5">
          <a
            href="https://github.com/chibounisme"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="flex items-center text-site-text-dim transition-colors duration-100 hover:text-site-accent hover:no-underline"
          >
            <GitHubIcon />
          </a>
          <a
            href="https://www.linkedin.com/in/chiboub/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="flex items-center text-site-text-dim transition-colors duration-100 hover:text-site-accent hover:no-underline"
          >
            <LinkedInIcon />
          </a>
        </div>
        <p className="text-xs text-site-text-dim">
          Built with React, Tailwind, and a pixelated WebGL night sky.
        </p>
        </div>
      </footer>
    </div>
  );
}
