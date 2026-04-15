import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  use: {
    headless: false,
    viewport: { width: 1280, height: 800 },
  },
  workers: 1,
});
