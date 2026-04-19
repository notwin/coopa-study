// Chrome Web Store 要求 1280×800 截图，最多 5 张。
// 加载插件 + 真实访问 research.google，拍 4 张关键画面。
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJECT = join(dirname(fileURLToPath(import.meta.url)), '..');
const EXT = join(PROJECT, 'dist');
const OUT = join(PROJECT, 'docs/release/screenshots');
await mkdir(OUT, { recursive: true });

const ctx = await chromium.launchPersistentContext('', {
  headless: false,
  viewport: { width: 1280, height: 800 },
  args: [
    `--disable-extensions-except=${EXT}`,
    `--load-extension=${EXT}`,
    '--window-size=1280,900'
  ]
});
const page = await ctx.newPage();
const log = (m) => console.log(`[shot] ${m}`);

page.on('console', (m) => {
  if (m.type() === 'error') log(`  [console.error] ${m.text().slice(0, 150)}`);
});

await page.goto('about:blank');
await page.waitForTimeout(3500);

// ———— 01 主页 ————
log('01 home');
await page.goto('https://research.google/ai-quests/intl/en_us', { waitUntil: 'networkidle' });
try { await page.locator('button:has-text("OK, got it")').click({ timeout: 3000, force: true }); } catch {}
await page.waitForTimeout(7000); // 等 3D 场景 + DOM overlay 完全就位

// 诊断：看伴读面板挂载状态
const diag = await page.evaluate(() => {
  const host = document.getElementById('coopa-study-host');
  return {
    hostExists: !!host,
    shadowChildren: host?.shadowRoot?.children.length ?? -1,
    btnText: host?.shadowRoot?.querySelector('button')?.textContent?.trim() ?? null,
    btnRect: (() => {
      const b = host?.shadowRoot?.querySelector('button');
      if (!b) return null;
      const r = b.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    })(),
    acceptBtn: [...document.querySelectorAll('button')].some(b => /接受任务|Accept mission/.test(b.textContent || '')),
    bodyTextSample: document.body.innerText.replace(/\s+/g, ' ').slice(0, 200)
  };
});
log('  diag: ' + JSON.stringify(diag));

await page.screenshot({ path: join(OUT, '01-home-accept-mission.png'), fullPage: false });

// ———— 02 地图页 ————
log('02 map');
await page.locator('button:has-text("接受任务")').click({ timeout: 10_000 });
try { await page.locator('button[aria-label="Skip"]').click({ timeout: 8000, force: true }); } catch {}
await page.waitForURL(/\/map$/, { timeout: 15_000 });
await page.waitForTimeout(6000);
await page.screenshot({ path: join(OUT, '02-map-start-quest.png'), fullPage: false });

// ———— 03 cinematic 中文字幕 ————
log('03 cinematic');
await page.locator('button:has-text("开始任务")').click();
for (let i = 0; i < 40; i++) {
  await page.waitForTimeout(1000);
  const cueCount = await page.evaluate(() => {
    const v = document.querySelector('video');
    return v?.textTracks?.[0]?.cues?.length ?? 0;
  });
  if (cueCount > 0) { log(`  cues loaded after ${i + 1}s`); break; }
}
// 让字幕 overlay 真正显示
await page.waitForTimeout(6000);
await page.screenshot({ path: join(OUT, '03-cinematic-subtitles.png'), fullPage: false });

// ———— 04 伴读面板展开 ————
log('04 sidebar');
await page.goto('https://research.google/ai-quests/intl/en_us');
await page.waitForTimeout(6000);
const beforeSide = await page.evaluate(() => {
  const host = document.getElementById('coopa-study-host');
  const btn = host?.shadowRoot?.querySelector('button');
  return { hostExists: !!host, btnExists: !!btn, btnText: btn?.textContent?.trim() ?? null };
});
log('  before-expand: ' + JSON.stringify(beforeSide));
if (beforeSide.btnExists) {
  // Playwright 的 shadow-piercing locator
  try {
    await page.locator('#coopa-study-host button[aria-label="展开伴读"]').click({ timeout: 5000, force: true });
    await page.waitForTimeout(2000);
  } catch (e) {
    log('  shadow click failed, try evaluate: ' + e.message.slice(0, 80));
    await page.evaluate(() => {
      document.getElementById('coopa-study-host')?.shadowRoot?.querySelector('button')?.click();
    });
    await page.waitForTimeout(2000);
  }
}
await page.screenshot({ path: join(OUT, '04-sidebar-expanded.png'), fullPage: false });

await ctx.close();
log('done -> ' + OUT);
