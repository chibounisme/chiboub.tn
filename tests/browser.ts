import { vi } from 'vitest';

class MotionPreference extends EventTarget {
  matches = false;
  readonly media = '(prefers-reduced-motion: reduce)';
  onchange = null;
  addListener = vi.fn();
  removeListener = vi.fn();

  set(matches: boolean) {
    this.matches = matches;
    this.dispatchEvent(new Event('change'));
  }
}

export const motionPreference = new MotionPreference();
export const scrollTo = vi.fn<typeof window.scrollTo>();

export function installBrowserMocks() {
  motionPreference.matches = false;
  vi.stubGlobal('matchMedia', () => motionPreference);
  vi.spyOn(window, 'scrollTo').mockImplementation(scrollTo);
  // jsdom has no canvas renderer; engine tests supply a recording context.
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  Object.defineProperty(document, 'fonts', {
    configurable: true,
    value: { ready: Promise.resolve() },
  });
}
