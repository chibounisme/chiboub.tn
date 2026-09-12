import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      include: ['tests/**/*.test.{ts,tsx}'],
      setupFiles: ['tests/setup.ts'],
      restoreMocks: true,
      clearMocks: true,
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/analytics.ts', 'src/**/*.d.ts'],
        reporter: ['text', 'html'],
        thresholds: { lines: 85, statements: 85, functions: 85, branches: 80 },
      },
    },
  }),
);
