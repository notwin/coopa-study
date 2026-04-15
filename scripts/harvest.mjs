import { chromium } from 'playwright';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const OUT_DIR = '/Users/notwin/Code/coopa_study/scripts/harvest';
const LOG = (m) => console.log(`[${new Date().toISOString()}] ${m}`);

await mkdir(OUT_DIR, { recursive: true });

const browser = await chromium.launch({
  headless: false,
  args: ['--start-maximized']
});
const context = await browser.newContext({ viewport: null });
const page = await context.newPage();

await page.goto('https://research.google/ai-quests/intl/en_gb', { waitUntil: 'domcontentloaded' });
LOG('opened home');

const harvested = new Map();
const stateHistory = [];

// 过滤掉全站通用导航/系统文本，避免污染 stuck 判定
const CHROME_TEXTS = new Set([
  'OK, got it',
  'Learn more',
  'English (UK)',
  'Resources & more',
  'Vote for us',
  'Accept mission',
  'We are super excited to be nominated for a Webby award!',
  'Back to quest selection',
  'Toggle audio',
  'Play/Pause',
  'Replay',
  'Skip',
  'research.google uses cookies from Google to deliver and enhance the quality of its services and to analyse traffic.',
  'AI Quests',
  'Google Research',
  'Loading...',
  'Start Quest',
  'Previous quest',
  'Next quest'
]);

function isChromeText(t) {
  if (CHROME_TEXTS.has(t)) return true;
  for (const x of CHROME_TEXTS) if (t.startsWith(x)) return true;
  return false;
}

function addText(type, text, meta = {}) {
  if (!text) return false;
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean || clean.length < 2) return false;
  const key = `${type}::${clean}`;
  if (harvested.has(key)) return false;
  const contentful = !isChromeText(clean);
  harvested.set(key, { type, text: clean, ...meta, firstSeen: new Date().toISOString(), contentful });
  LOG(`${contentful ? '+' : '·'}${type}: ${clean.slice(0, 140)}`);
  return contentful;
}

async function snapshot() {
  return await page.evaluate(() => {
    const visible = (el) => {
      if (!el) return false;
      if (el.offsetParent === null && el.tagName !== 'BODY') return false;
      const rect = el.getBoundingClientRect?.();
      if (rect && (rect.width === 0 || rect.height === 0)) return false;
      return true;
    };
    const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'PATH']);

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodeTexts = [];
    let n;
    while (n = walker.nextNode()) {
      const el = n.parentElement;
      if (!el || SKIP_TAGS.has(el.tagName)) continue;
      if (!visible(el)) continue;
      const raw = n.textContent || '';
      const t = raw.replace(/\s+/g, ' ').trim();
      if (!t || t.length < 2 || t.length > 2000) continue;
      nodeTexts.push({
        text: t,
        tag: el.tagName,
        cls: typeof el.className === 'string' ? el.className.slice(0, 120) : '',
        role: el.getAttribute?.('role') || ''
      });
    }

    const buttons = [...document.querySelectorAll('button')].filter(visible).map(b => ({
      text: (b.textContent || '').replace(/\s+/g, ' ').trim(),
      aria: b.getAttribute('aria-label') || '',
      cls: typeof b.className === 'string' ? b.className.slice(0, 120) : ''
    })).filter(b => b.text || b.aria);

    // Video 元素 + textTrack cues（cinematic 字幕可能在这里）
    const videos = [...document.querySelectorAll('video')].map(v => {
      const tracks = [...(v.textTracks || [])].map(tt => {
        const cues = [...(tt.cues || [])].map(c => ({
          start: c.startTime,
          end: c.endTime,
          text: (c.text || '').slice(0, 500)
        }));
        return {
          kind: tt.kind,
          label: tt.label || '',
          lang: tt.language || '',
          mode: tt.mode,
          cuesCount: cues.length,
          cues
        };
      });
      return {
        src: (v.currentSrc || v.src || '').slice(0, 200),
        paused: v.paused,
        duration: v.duration,
        currentTime: v.currentTime,
        readyState: v.readyState,
        textTracks: tracks
      };
    });

    // aria-live 区域（屏幕阅读器友好，可能字幕走这个）
    const ariaLive = [...document.querySelectorAll('[aria-live]')].filter(visible).map(el => ({
      live: el.getAttribute('aria-live'),
      text: (el.textContent || '').replace(/\s+/g, ' ').trim()
    })).filter(x => x.text);

    return {
      url: location.href,
      nodeTexts,
      buttons,
      videos,
      ariaLive,
      canvasCount: document.querySelectorAll('canvas').length,
      dialogOpen: !!document.querySelector('dialog:not([hidden]), [role=dialog]:not([hidden])')
    };
  });
}

async function save() {
  const items = [...harvested.values()];
  const out = {
    harvestedAt: new Date().toISOString(),
    total: items.length,
    contentfulCount: items.filter(i => i.contentful).length,
    stateHistory,
    items
  };
  await writeFile(path.join(OUT_DIR, 'harvest.json'), JSON.stringify(out, null, 2));
}

const ADVANCE_KEYWORDS = [
  'OK, got it',
  'Accept mission',
  'Start Quest',
  "Let's go",
  "Let's begin",
  "I'm ready",
  'Sounds good',
  'Sounds great',
  'Got it',
  'Continue',
  'Next',
  'Finish',
  'Confirm',
  'Begin',
  'Alright',
  'Sure',
  'Let me try',
  'Absolutely',
  'Yes',
  'OK'
];

const recentClicks = new Map(); // key -> ts ms

function canClick(key) {
  const last = recentClicks.get(key);
  if (!last) return true;
  return Date.now() - last > 6000;
}

async function forceClick(btn, label, key) {
  if (key && !canClick(key)) return false;
  if (key) recentClicks.set(key, Date.now());
  try {
    // Playwright 标准 click 先试（能过 actionability 最好）
    await btn.click({ timeout: 1500, force: true });
    LOG(`>click ${label}`);
    await page.waitForTimeout(1200);
    return true;
  } catch (e) {
    // fallback: 直接 JS 调 el.click()，绕过 actionability
    try {
      await btn.evaluate((el) => el.click());
      LOG(`>click(js) ${label}`);
      await page.waitForTimeout(1200);
      return true;
    } catch (e2) {
      LOG(`!click failed ${label}: ${(e2.message || e.message).slice(0, 100)}`);
      return false;
    }
  }
}

async function tryAdvance() {
  try {
    const skip = page.locator('button[aria-label="Skip"]:visible').first();
    if (await skip.count() > 0 && await skip.isVisible({ timeout: 200 })) {
      if (await forceClick(skip, 'Skip(aria)', 'Skip(aria)')) return true;
    }
  } catch (_) {}

  for (const kw of ADVANCE_KEYWORDS) {
    try {
      const btn = page.locator(`button:has-text("${kw}")`).first();
      if (await btn.count() > 0 && await btn.isVisible({ timeout: 200 })) {
        const text = (await btn.textContent())?.trim() || kw;
        if (await forceClick(btn, `advance "${text}"`, `adv::${text}`)) return true;
      }
    } catch (_) {}
  }
  return false;
}

async function tryFirstChoice() {
  try {
    const li = page.locator('li button').first();
    if (await li.count() > 0 && await li.isVisible({ timeout: 200 })) {
      const text = (await li.textContent())?.trim() || 'choice';
      if (await forceClick(li, `first-choice "${text}"`, `li::${text}`)) return true;
    }
  } catch (_) {}
  try {
    const dialogBtns = page.locator('[role=dialog] button, dialog button');
    const count = await dialogBtns.count();
    for (let i = 0; i < count; i++) {
      const b = dialogBtns.nth(i);
      const text = ((await b.textContent()) || '').trim();
      const aria = (await b.getAttribute('aria-label')) || '';
      const label = text || aria;
      if (!label) continue;
      if (['Skip', 'Play/Pause', 'Replay', 'Toggle audio'].includes(label)) continue;
      if (await b.isVisible({ timeout: 150 })) {
        if (await forceClick(b, `dialog-btn "${label}"`, `dbtn::${label}`)) return true;
      }
    }
  } catch (_) {}
  return false;
}

async function tryPlayPause() {
  try {
    const pp = page.locator('button[aria-label="Play/Pause"]:visible').first();
    if (await pp.count() > 0 && await pp.isVisible({ timeout: 200 })) {
      if (await forceClick(pp, 'Play/Pause (emergency)', 'pp-emergency')) return true;
    }
  } catch (_) {}
  return false;
}

// 兜底：cinematic 卡住时跳到 video 末尾
async function forceVideoPlay() {
  try {
    const result = await page.evaluate(() => {
      const vids = [...document.querySelectorAll('video')];
      const out = [];
      for (const v of vids) {
        if (v.duration && v.currentTime < v.duration - 1) {
          try {
            v.currentTime = Math.max(0, v.duration - 0.5);
            out.push({ src: (v.currentSrc||v.src).slice(-40), action: `skipTo=${v.currentTime.toFixed(1)}/${v.duration.toFixed(1)}` });
          } catch (e) {}
        }
        if (v.paused) {
          try { v.play(); out.push({ src: (v.currentSrc||v.src).slice(-40), action: 'play' }); } catch (e) {}
        }
      }
      return out;
    });
    if (result.length > 0) {
      LOG(`>force video: ${JSON.stringify(result)}`);
      return true;
    }
  } catch (e) {
    LOG(`!force video fail: ${e.message.slice(0, 80)}`);
  }
  return false;
}

let contentfulStuck = 0;
let lastContentfulCount = 0;
let lastUrl = page.url();
let iterations = 0;
const MAX_ITERATIONS = 1200;
const CONTENTFUL_STUCK_THRESHOLD = 20;

while (true) {
  iterations++;
  try {
    await page.waitForTimeout(1000);

    const snap = await snapshot();

    if (snap.url !== lastUrl) {
      LOG(`~URL: ${lastUrl} -> ${snap.url}`);
      stateHistory.push({ from: lastUrl, to: snap.url, ts: new Date().toISOString() });
      lastUrl = snap.url;
      contentfulStuck = 0;
    }

    for (const nt of snap.nodeTexts) {
      addText('text', nt.text, { url: snap.url, tag: nt.tag, cls: nt.cls, role: nt.role });
    }
    for (const b of snap.buttons) {
      if (b.text) addText('button', b.text, { url: snap.url, aria: b.aria, cls: b.cls });
      if (b.aria && b.aria !== b.text) addText('button-aria', b.aria, { url: snap.url });
    }
    for (const v of snap.videos) {
      for (const tt of v.textTracks) {
        for (const cue of tt.cues) {
          addText('cue', cue.text, { url: snap.url, videoSrc: v.src.slice(-60), start: cue.start, end: cue.end, trackLabel: tt.label });
        }
      }
    }
    for (const al of snap.ariaLive) {
      addText('aria-live', al.text, { url: snap.url, live: al.live });
    }
    if (snap.videos.length > 0 && iterations % 20 === 0) {
      const summary = snap.videos.map(v => `${v.paused?'P':'>'} t=${v.currentTime?.toFixed(1)}/${v.duration?.toFixed(1)} tracks=${v.textTracks.length} cues=${v.textTracks.reduce((a,t)=>a+t.cuesCount,0)}`).join(' | ');
      LOG(`#video: ${summary}`);
    }

    await save();

    const contentfulNow = [...harvested.values()].filter(i => i.contentful).length;
    if (contentfulNow > lastContentfulCount) {
      contentfulStuck = 0;
      lastContentfulCount = contentfulNow;
    }

    let advanced = await tryAdvance() || await tryFirstChoice();
    // 卡住时 emergency：点 Play/Pause / 强制 video 播放 + 快进
    if (!advanced && contentfulStuck >= 8 && contentfulStuck % 5 === 0) {
      advanced = await tryPlayPause() || await forceVideoPlay();
    }
    if (!advanced) contentfulStuck++;

    if (contentfulStuck > 0 && contentfulStuck % 5 === 0) {
      LOG(`stuck ${contentfulStuck}/${CONTENTFUL_STUCK_THRESHOLD} iter=${iterations} canvas=${snap.canvasCount} url=${snap.url}`);
    }

    if (contentfulStuck >= CONTENTFUL_STUCK_THRESHOLD) {
      const stuckPath = path.join(OUT_DIR, `stuck-${Date.now()}.png`);
      await page.screenshot({ path: stuckPath });
      LOG(`\n========================================`);
      LOG(`>>> STUCK at: ${lastUrl}`);
      LOG(`>>> 需要你在浏览器里操作（比如 Task 1 扫找 12 个数据物体）`);
      LOG(`>>> screenshot: ${stuckPath}`);
      LOG(`>>> 脚本会等 5 分钟并持续抓取新文本（你操作时它也在工作）`);
      LOG(`========================================\n`);
      // 5 分钟内每 3 秒继续抓取一次，检测到新 contentful 就提前跳出
      const waitStart = Date.now();
      const waitMs = 5 * 60 * 1000;
      const contentfulAtStart = [...harvested.values()].filter(i => i.contentful).length;
      while (Date.now() - waitStart < waitMs) {
        await page.waitForTimeout(3000);
        try {
          const snap2 = await snapshot();
          let addedNow = 0;
          for (const nt of snap2.nodeTexts) if (addText('text', nt.text, { url: snap2.url, tag: nt.tag, cls: nt.cls, role: nt.role })) addedNow++;
          for (const b of snap2.buttons) {
            if (b.text) addText('button', b.text, { url: snap2.url, aria: b.aria, cls: b.cls });
          }
          for (const v of snap2.videos) for (const tt of v.textTracks) for (const cue of tt.cues) {
            if (addText('cue', cue.text, { url: snap2.url, videoSrc: v.src.slice(-60), start: cue.start, end: cue.end, trackLabel: tt.label })) addedNow++;
          }
          if (snap2.url !== lastUrl) {
            LOG(`~URL (during wait): ${lastUrl} -> ${snap2.url}`);
            stateHistory.push({ from: lastUrl, to: snap2.url, ts: new Date().toISOString() });
            lastUrl = snap2.url;
          }
          await save();
          const now = [...harvested.values()].filter(i => i.contentful).length;
          if (now > contentfulAtStart + 3) {
            LOG(`>>> new contentful (+${now - contentfulAtStart}) detected, resuming main loop`);
            break;
          }
        } catch (_) {}
      }
      contentfulStuck = 0;
    }

    if (iterations > MAX_ITERATIONS) {
      LOG(`max iterations (${MAX_ITERATIONS}) reached, stopping`);
      break;
    }
  } catch (err) {
    LOG(`!error iter=${iterations}: ${err.message}`);
    await page.waitForTimeout(2000);
  }
}

await save();
await browser.close();
LOG(`DONE. harvested ${harvested.size} items (${[...harvested.values()].filter(i => i.contentful).length} contentful) -> ${path.join(OUT_DIR, 'harvest.json')}`);
