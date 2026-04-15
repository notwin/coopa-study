import { test as base, chromium, type BrowserContext } from '@playwright/test';

// Resolved at build/run time — fixtures.ts lives at tests/e2e/, dist is at project root/dist
const EXTENSION_PATH = new URL('../../dist', import.meta.url).pathname;

export const test = base.extend<{ context: BrowserContext; extensionId: string }>({
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,
      ],
    });
    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    let [sw] = context.serviceWorkers();
    if (!sw) sw = await context.waitForEvent('serviceworker', { timeout: 10_000 }).catch(() => null as any);
    const id = sw?.url().split('/')[2] ?? '';
    await use(id);
  },
  // Override page to use the persistent context
  page: async ({ context }, use) => {
    const page = await context.newPage();
    await use(page);
    await page.close();
  },
});

export { expect } from '@playwright/test';
