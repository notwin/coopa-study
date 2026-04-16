// Playwright + Chromium 的 DNR modifyHeaders 在某些 chromium 版本下不稳，
// content script 被页面 CSP 阻住，截不到 sidebar-in-the-wild。
// 真实 Chrome 里该功能正常（已用户侧验收）。为 Chrome Web Store 出一张
// "sidebar 样貌"demo 图，我们渲染一个静态 HTML，复刻 sidebar 样式 + 用真实截图 01 做底。
import { chromium } from 'playwright';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = `${ROOT}/docs/release/screenshots/04-sidebar-expanded.png`;
const styles = await readFile(`${ROOT}/src/sidebar/styles.css`, 'utf8');
const homeShot = await readFile(`${ROOT}/docs/release/screenshots/01-home-accept-mission.png`);
const homeB64 = homeShot.toString('base64');

const HTML = `<!doctype html>
<html><head><meta charset="utf-8"><style>
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: 1280px; height: 800px; overflow: hidden; font-family: system-ui, 'PingFang SC', sans-serif; }
.bg {
  position: fixed; inset: 0;
  background: url(data:image/png;base64,${homeB64}) center/cover no-repeat;
}
${styles}
/* 覆盖 sidebar 默认 fixed 行为在 light DOM 里还是 fixed，正好 */
</style></head>
<body>
<div class="bg"></div>
<aside class="coopa-sidebar">
  <header class="coopa-header">
    <h1>中文伴读 · 洪水预测</h1>
    <button class="coopa-collapse-btn" aria-label="收起伴读">×</button>
  </header>
  <nav class="coopa-chapter-tabs">
    <button class="coopa-chapter-tab is-current">开场：Skye 教授找到你了</button>
    <button class="coopa-chapter-tab">任务一：选对数据</button>
  </nav>
  <section class="coopa-chapter-view">
    <h2 class="coopa-chapter-title">开场：Skye 教授找到你了</h2>
    <p class="coopa-chapter-summary">Luna 的市场总被洪水淹。Skye 教授要你用 AI 做洪水预报系统。</p>
    <div class="coopa-blocks">
      <article class="coopa-block coopa-block--explainer">
        <h3>为什么要用 AI 预测洪水？</h3>
        <p>传统天气预报不够准。AI 能同时看降雨、温度、土壤、河流好多种数据，综合判断。</p>
      </article>
      <article class="coopa-block coopa-block--term">
        <button class="coopa-term-front">
          <strong>预测</strong>
          <span class="coopa-term-en">prediction</span>
        </button>
        <div class="coopa-term-back">
          <p>根据已知信息猜未来会发生什么。</p>
          <p class="coopa-term-analogy">就像看到乌云就准备收衣服——用已知判断未发生的事。</p>
        </div>
      </article>
      <aside class="coopa-block coopa-block--tip">
        <p>听完 Luna 讲完背景再选 Sounds good，别急着跳过。</p>
      </aside>
    </div>
  </section>
</aside>
</body></html>`;

await writeFile('/tmp/sidebar-preview.html', HTML);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();
await page.goto('file:///tmp/sidebar-preview.html');
await page.waitForTimeout(500);
await page.screenshot({ path: OUT });
await browser.close();
console.log('+ ' + OUT);
