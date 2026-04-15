// 不用浏览器直接扒 JS bundle 和资源 manifest，挖出所有 cinematic .webm + .vtt
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const OUT = '/Users/notwin/Code/coopa_study/scripts/harvest';
await mkdir(OUT, { recursive: true });

const LOG = (m) => console.log(`[${new Date().toISOString()}] ${m}`);

const HOMES = [
  'https://research.google/ai-quests/intl/en_gb',
  'https://research.google/ai-quests/intl/en_gb/map',
  'https://research.google/ai-quests/intl/en_gb/quest/market-marshes'
];

async function fetchText(url) {
  const r = await fetch(url, { redirect: 'follow' });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.text();
}

async function fetchBuffer(url) {
  const r = await fetch(url, { redirect: 'follow' });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return new Uint8Array(await r.arrayBuffer());
}

// Step 1: 抓主页 HTML，取所有 JS 文件列表
LOG('step 1: fetch homepages, collect script srcs');
const homeScripts = new Set();
for (const home of HOMES) {
  try {
    const html = await fetchText(home);
    // 抓 <base href> 如果有
    const baseMatch = html.match(/<base[^>]+href=["']([^"']+)["']/);
    const baseUrl = baseMatch ? new URL(baseMatch[1], home).href : home;
    for (const m of html.matchAll(/<script[^>]+src=["']([^"']+\.js[^"']*)["']/g)) {
      try {
        const abs = new URL(m[1], baseUrl).href;
        homeScripts.add(abs);
      } catch {}
    }
    // 也抓 rel=modulepreload 和 link rel=preload 之类
    for (const m of html.matchAll(/<link[^>]+href=["']([^"']+\.(?:js|vtt|webm|json))[^"']*["']/g)) {
      try {
        const abs = new URL(m[1], baseUrl).href;
        homeScripts.add(abs);
      } catch {}
    }
  } catch (e) {
    LOG(`! fetch home failed ${home}: ${e.message}`);
  }
}
LOG(`collected ${homeScripts.size} script URLs`);
for (const s of [...homeScripts].slice(0, 10)) LOG(`  ${s}`);

// Step 2: fetch 每个 JS，正则扫所有 .webm / .vtt / .mp4 / .json 资源
LOG('step 2: fetch JS bundles, extract asset paths');
const assetPaths = new Set();
const ASSET_RE = /["'`]([^"'`\s]+\.(?:webm|vtt|mp4|mp3|wav|ogg|json)(?:\?[^"'`]*)?)["'`]/g;
const WEBM_BARE_RE = /[a-zA-Z0-9_\-/]+\.webm/g;
const scriptBodies = new Map();
for (const js of homeScripts) {
  try {
    const body = await fetchText(js);
    scriptBodies.set(js, body);
    for (const m of body.matchAll(ASSET_RE)) assetPaths.add(m[1]);
    for (const m of body.matchAll(WEBM_BARE_RE)) assetPaths.add(m[0]);
  } catch (e) {
    LOG(`! fetch js failed ${js}: ${e.message}`);
  }
}
LOG(`found ${assetPaths.size} asset path strings in JS bundles`);

// Step 3: 筛选 .webm / .vtt，推断绝对 URL
const BASE = 'https://research.google/ai-quests';
const webms = new Set();
const vtts = new Set();
for (const p of assetPaths) {
  let clean = p.replace(/[`'"].*/, '');
  if (!clean.includes('.')) continue;
  let url;
  if (clean.startsWith('http')) url = clean;
  else if (clean.startsWith('//')) url = 'https:' + clean;
  else if (clean.startsWith('/')) url = 'https://research.google' + clean;
  else url = `${BASE}/${clean.replace(/^\.?\/?/, '')}`;
  const lower = url.toLowerCase();
  if (lower.includes('.webm')) webms.add(url.split('?')[0]);
  if (lower.includes('.vtt')) vtts.add(url.split('?')[0]);
}
LOG(`webms: ${webms.size}, vtts: ${vtts.size}`);

// Step 4: 对每个 .webm 推断可能的 .vtt（同名/同目录）
const candidateVtts = new Set(vtts);
for (const webm of webms) {
  // 同目录同名的 .vtt
  candidateVtts.add(webm.replace(/\.webm$/i, '.vtt'));
  // 同目录同名的 .en_gb.vtt
  candidateVtts.add(webm.replace(/\.webm$/i, '.en_gb.vtt'));
  candidateVtts.add(webm.replace(/\.webm$/i, '.en.vtt'));
  // 子目录 captions/<name>.vtt
  const basename = webm.split('/').pop().replace(/\.webm$/i, '');
  const dir = webm.substring(0, webm.lastIndexOf('/'));
  candidateVtts.add(`${dir}/captions/${basename}.vtt`);
  candidateVtts.add(`${dir}/${basename}.vtt`);
}
LOG(`candidate vtts to try: ${candidateVtts.size}`);

// Step 5: 尝试每个候选 VTT
function parseVtt(text) {
  const lines = text.split(/\r?\n/);
  const cues = [];
  let current = null;
  for (const line of lines) {
    const m = line.match(/^(\d+:\d+:\d+\.\d+|\d+:\d+\.\d+)\s+-->\s+(\d+:\d+:\d+\.\d+|\d+:\d+\.\d+)/);
    if (m) {
      if (current) cues.push(current);
      const toSec = (s) => {
        const parts = s.split(':').map(Number);
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
        return parts[0] * 60 + parts[1];
      };
      current = { start: toSec(m[1]), end: toSec(m[2]), text: '' };
    } else if (current) {
      if (line.trim() === '') {
        cues.push(current);
        current = null;
      } else {
        current.text = (current.text + ' ' + line).trim();
      }
    }
  }
  if (current) cues.push(current);
  return cues;
}

const vttResults = {};
let ok = 0, fail = 0;
for (const url of candidateVtts) {
  try {
    const r = await fetch(url, { redirect: 'follow' });
    if (!r.ok) { fail++; continue; }
    const ct = r.headers.get('content-type') || '';
    const text = await r.text();
    if (!text.includes('WEBVTT') && !text.match(/-->/)) { fail++; continue; }
    const cues = parseVtt(text);
    if (cues.length === 0) { fail++; continue; }
    vttResults[url] = { cues, contentType: ct, bytes: text.length };
    ok++;
    LOG(`+ VTT ok: ${url} (${cues.length} cues)`);
  } catch (e) {
    fail++;
  }
}
LOG(`VTT fetched: ${ok} ok / ${fail} fail`);

// Step 6: 保存
const out = {
  scannedAt: new Date().toISOString(),
  homeScripts: [...homeScripts],
  webms: [...webms],
  candidateVtts: [...candidateVtts],
  vttResults
};
await writeFile(path.join(OUT, 'assets-scan.json'), JSON.stringify(out, null, 2));

// Step 7: 合并 cues 到单独文件便于查看
const allCues = [];
for (const [url, r] of Object.entries(vttResults)) {
  for (const c of r.cues) {
    allCues.push({ vtt: url, start: c.start, end: c.end, text: c.text });
  }
}
await writeFile(path.join(OUT, 'all-cues.json'), JSON.stringify({
  total: allCues.length,
  vttCount: Object.keys(vttResults).length,
  cues: allCues
}, null, 2));

LOG(`DONE. ${ok} VTT files, ${allCues.length} cues -> ${OUT}/assets-scan.json and all-cues.json`);
