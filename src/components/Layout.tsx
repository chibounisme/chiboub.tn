import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useReducedMotion } from '../hooks/useReducedMotion';
import PixelSky from './space/PixelSky';
import PixelMoon from './space/PixelMoon';
import PageErrorBoundary from './PageErrorBoundary';

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const siteRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const previousPath = useRef(location.pathname);
  const reducedMotion = useReducedMotion();
  const [motionOverride, setMotionOverride] = useState<boolean | null>(null);
  const playing = motionOverride ?? !reducedMotion;

  useLayoutEffect(() => {
    if (previousPath.current === location.pathname) return;
    previousPath.current = location.pathname;
    window.scrollTo({ top: 0, behavior: 'instant' });
    mainRef.current?.focus({ preventScroll: true });
  }, [location.pathname]);

  return (
    <div className="site" ref={siteRef}>
      <PixelSky
        containerRef={siteRef}
        playing={playing}
        routeKey={location.pathname}
      />
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <div className="site-shell">
        <header className="site-header">
          <Link className="wordmark" to="/" aria-label="Chiboub home">
            <PixelMoon />
            <span>chiboub.</span>
          </Link>
          <nav className="site-nav" aria-label="Main navigation">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                isActive || location.pathname.startsWith('/blog/')
                  ? 'is-active'
                  : undefined
              }
            >
              writing
            </NavLink>
            <NavLink to="/about">about</NavLink>
          </nav>
        </header>
        <main
          id="main-content"
          ref={mainRef}
          tabIndex={-1}
          className="site-main"
        >
          <div key={location.pathname} className="page-view">
            <PageErrorBoundary>{children}</PageErrorBoundary>
          </div>
        </main>
        <footer className="site-footer">
          <p>Mohamed Chiboub</p>
          <div className="footer-links">
            <button
              type="button"
              className="sky-control"
              aria-label={
                playing ? 'Pause sky animation' : 'Play sky animation'
              }
              onClick={() => setMotionOverride(!playing)}
            >
              {playing ? 'pause sky' : 'play sky'}
            </button>
            <a
              href="https://github.com/chibounisme"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
