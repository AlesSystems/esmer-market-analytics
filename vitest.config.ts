import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/*.test.ts'],
    exclude: ['node_modules/**', 'tests/desktop/**'],
    maxWorkers: process.platform === 'win32' ? 2 : undefined,
  },
});
