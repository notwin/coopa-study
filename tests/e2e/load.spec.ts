import { test, expect } from './fixtures';

test('打开主页能看到"接受任务"中文按钮', async ({ page }) => {
  await page.goto('https://research.google/ai-quests/intl/en_gb');
  await expect(page.locator('button:has-text("接受任务")')).toBeVisible({ timeout: 15_000 });
});

test('进入地图页"开始任务"是中文', async ({ page }) => {
  await page.goto('https://research.google/ai-quests/intl/en_gb');
  try { await page.locator('button:has-text("OK, got it")').click({ timeout: 3000 }); } catch {}
  await page.locator('button:has-text("接受任务")').click();
  try { await page.locator('button[aria-label="Skip"]').click({ force: true, timeout: 5000 }); } catch {}
  await expect(page).toHaveURL(/\/map$/, { timeout: 15_000 });
  await expect(page.locator('button:has-text("开始任务")')).toBeVisible();
});
