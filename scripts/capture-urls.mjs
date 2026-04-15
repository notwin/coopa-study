// 短期打开浏览器，拦截所有网络请求，专找 .vtt / track / subtitle 类 URL
import { chromium } from 'playwright';
import { writeFile, readFile } from 'node:fs/promises';

const OUT = '/Users/notwin/Code/coopa_study/scripts/harvest';
const LOG = (m) => console.log(`[${new Date().toISOString()}] ${m}`);

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext();
const page = await context.newPage();

const urls = new Set();
const interesting = [];
page.on('request', (req) => {
  const u = req.url();
  urls.add(u);
  const l = u.toLowerCase();
  if (l.includes('.vtt') || l.includes('subtitle') || l.includes('caption') || l.includes('track') || l.includes('.srt') || l.includes('.webm')) {
    interesting.push({ method: req.method(), url: u, resourceType: req.resourceType() });
    LOG(`INTERESTING: ${req.resourceType()} ${u}`);
  }
});
page.on('response', async (resp) => {
  const u = resp.url();
  const ct = resp.headers()['content-type'] || '';
  if (ct.includes('vtt') || ct.includes('subtitle') || ct.includes('caption')) {
    LOG(`VTT-like response: ${u} ct=${ct}`);
    try {
      const body = await resp.text();
      LOG(`  body first 200: ${body.slice(0, 200)}`);
    } catch {}
  }
});

LOG('goto homepage');
await page.goto('https://research.google/ai-quests/intl/en_gb', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2000);

// 点 OK, got it
try { await page.locator('button:has-text("OK, got it")').click({ timeout: 3000, force: true }); } catch {}
await page.waitForTimeout(1000);
// 点 Accept mission
try { await page.locator('button:has-text("Accept mission")').click({ timeout: 3000, force: true }); } catch {}
await page.waitForTimeout(2000);
// Skip cinematic
try { await page.locator('button[aria-label="Skip"]').click({ timeout: 3000, force: true }); } catch {}
await page.waitForTimeout(2000);
// Start Quest
try { await page.locator('button:has-text("Start Quest")').click({ timeout: 3000, force: true }); } catch {}
await page.waitForTimeout(15000); // 让 cinematic 加载并开始播

// 触发 video 加载所有 track 信息
const videoInfo = await page.evaluate(() => {
  const vids = [...document.querySelectorAll('video')];
  return vids.map(v => ({
    src: v.currentSrc || v.src,
    tracks: [...v.querySelectorAll('track')].map(t => ({
      kind: t.kind,
      src: t.src,
      label: t.label,
      srclang: t.srclang
    })),
    textTracksCount: v.textTracks?.length || 0,
    textTrackMode: [...(v.textTracks || [])].map(tt => ({ kind: tt.kind, label: tt.label, lang: tt.language, mode: tt.mode, cuesCount: tt.cues?.length || 0 }))
  }));
});
LOG(`video info: ${JSON.stringify(videoInfo, null, 2)}`);

// 跳到 video 末尾让更多资源加载（可能连锁触发后续）
await page.evaluate(() => {
  const vids = [...document.querySelectorAll('video')];
  for (const v of vids) {
    if (v.duration) v.currentTime = Math.max(0, v.duration - 0.5);
  }
});
await page.waitForTimeout(10000);

await writeFile(`${OUT}/captured-urls.json`, JSON.stringify({
  scannedAt: new Date().toISOString(),
  totalUrls: urls.size,
  interesting,
  videoInfo,
  allUrls: [...urls]
}, null, 2));

LOG(`total URLs: ${urls.size}, interesting: ${interesting.length}`);
LOG(`saved -> ${OUT}/captured-urls.json`);

await browser.close();
