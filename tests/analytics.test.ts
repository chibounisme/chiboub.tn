import { afterEach, expect, it, vi } from 'vitest';
import { initializeAnalytics } from '../src/lib/analytics';

afterEach(() => {
  document.getElementById('google-tag')?.remove();
  vi.unstubAllEnvs();
});

it.each([
  [false, 'chiboub.tn'],
  [true, '127.0.0.1'],
  [true, 'localhost'],
])(
  'does not load analytics with production=%s on %s',
  (production, hostname) => {
    vi.stubEnv('PROD', production);
    vi.stubGlobal('window', { location: { hostname } });
    initializeAnalytics();
    expect(document.getElementById('google-tag')).toBeNull();
    expect(window.dataLayer).toBeUndefined();
  },
);

it.each([undefined, [['config', 'existing-id']]])(
  'initializes the production tag once and preserves the queue (%s)',
  (dataLayer) => {
    vi.stubEnv('PROD', true);
    vi.stubGlobal('window', {
      location: { hostname: 'chiboub.tn' },
      dataLayer,
    });
    initializeAnalytics();
    initializeAnalytics();
    const script = document.querySelector<HTMLScriptElement>('#google-tag');
    expect(script?.async).toBe(true);
    expect(script?.src).toBe(
      'https://www.googletagmanager.com/gtag/js?id=G-R5JHHHYRKE',
    );
    expect(
      window.dataLayer
        ?.slice(-2)
        .map((command) => Array.from<unknown>(command)),
    ).toEqual([
      ['js', expect.any(Date)],
      ['config', 'G-R5JHHHYRKE'],
    ]);
    expect(window.dataLayer).toHaveLength(dataLayer ? 3 : 2);
    if (dataLayer) expect(window.dataLayer).toBe(dataLayer);
  },
);
