import { test, expect } from './fixtures';

test('Skye 开场字幕首条是中文', async ({ page }) => {
  await page.goto('https://research.google/ai-quests/intl/en_us');
  try { await page.locator('button:has-text("OK, got it")').click({ timeout: 3000 }); } catch {}
  await page.locator('button:has-text("接受任务")').click();
  const cue = await page.waitForFunction(() => {
    const v = document.querySelector('video');
    if (!v) return null;
    const tt = v.textTracks?.[0];
    if (!tt || !tt.cues || tt.cues.length === 0) return null;
    return (tt.cues[0] as VTTCue).text;
  }, { timeout: 30_000 });
  const text = await cue.jsonValue();
  expect(text).toContain('欢迎');
});
