// 加载 dist/ 作为 MV3 插件，打开 ai-quests 首页，诊断伴读面板
import { chromium } from 'playwright';
import path from 'node:path';

const EXT = path.resolve('/Users/notwin/Code/coopa_study/dist');
const DBG = '/Users/notwin/Code/coopa_study/scripts/harvest';

const ctx = await chromium.launchPersistentContext('', {
  headless: false,
  viewport: { width: 1280, height: 800 },
  args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`]
});

const page = await ctx.newPage();
const log = (m) => console.log(`[dbg] ${m}`);

const console_msgs = [];
page.on('console', (m) => console_msgs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => console_msgs.push(`[ERROR] ${e.message}`));

log('goto ai-quests home');
await page.goto('https://research.google/ai-quests/intl/en_gb', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(5000);

log('checking DOM');
const diag = await page.evaluate(() => {
  const host = document.getElementById('coopa-study-host');
  if (!host) return { hostExists: false };
  const sr = host.shadowRoot;
  const btn = sr?.querySelector('button');
  const btnRect = btn?.getBoundingClientRect();
  const btnStyle = btn ? getComputedStyle(btn) : null;
  const hostStyle = getComputedStyle(host);
  return {
    hostExists: true,
    hostRect: host.getBoundingClientRect(),
    hostDisplay: hostStyle.display,
    hostPosition: hostStyle.position,
    hostZIndex: hostStyle.zIndex,
    hostVisibility: hostStyle.visibility,
    shadowExists: !!sr,
    shadowChildCount: sr?.children.length,
    shadowInnerHTML: sr?.innerHTML.slice(0, 400),
    buttonExists: !!btn,
    buttonRect: btnRect ? { x: btnRect.x, y: btnRect.y, w: btnRect.width, h: btnRect.height } : null,
    buttonDisplay: btnStyle?.display,
    buttonPosition: btnStyle?.position,
    buttonZIndex: btnStyle?.zIndex,
    buttonVisibility: btnStyle?.visibility,
    buttonText: btn?.textContent?.trim().slice(0, 40),
    pageUrl: location.href,
    bodyOverflow: getComputedStyle(document.body).overflow
  };
});

log(JSON.stringify(diag, null, 2));
log('console messages count: ' + console_msgs.length);
for (const m of console_msgs.slice(0, 20)) log('  ' + m);

await page.screenshot({ path: `${DBG}/ext-debug.png`, fullPage: false });
log('screenshot saved');

await ctx.close();
log('done');
