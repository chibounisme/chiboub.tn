import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import { installBrowserMocks } from './browser';

beforeEach(installBrowserMocks);
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
