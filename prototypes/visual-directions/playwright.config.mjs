import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: 'prototype.test.mjs',
  workers: 1,
  reporter: 'list',
  outputDir: '../../test-results/visual-directions',
  use: { baseURL: 'http://127.0.0.1:4178', headless: true },
  webServer: {
    command: 'node serve.mjs --port 4178',
    url: 'http://127.0.0.1:4178',
    reuseExistingServer: false,
  },
});
