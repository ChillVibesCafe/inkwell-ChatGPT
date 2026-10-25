import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './browser-tests', workers: 1, retries: 0, timeout: 30000,
  use: { browserName: 'chromium', ...(process.platform === 'win32' ? { channel: 'msedge' } : {}),
    headless: true, viewport: { width: 1280, height: 900 } },
  reporter: 'list', outputDir: 'test-results/browser',
});
