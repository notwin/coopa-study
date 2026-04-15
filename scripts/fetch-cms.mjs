// 从 Google AI Quests CMS 拉取最新英文 JSON 源文件
// 用法：node scripts/fetch-cms.mjs
// 输出：/Users/notwin/Code/coopa_study/content-source/
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const ROOT = '/Users/notwin/Code/coopa_study/content-source';
const API = 'https://research.google/ai-quests/content/api';
const LOG = (m) => console.log(`[${new Date().toISOString()}] ${m}`);

const SNAPSHOT_FILES = ['site_config'];
const LOCALE_FILES = [
  'sitewide',
  'home_page',
  'planet_page',
  'flood_prediction',
  'blindness_prevention'
];

async function fetchJson(url) {
  const r = await fetch(url, { redirect: 'follow' });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}

async function fetchText(url) {
  const r = await fetch(url, { redirect: 'follow' });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.text();
}

LOG('1. resolve current snapshot');
const snapRaw = await fetchText(`${API}/current_snapshot_id`);
let snapshotId;
try {
  const parsed = JSON.parse(snapRaw);
  snapshotId = parsed.snapshot_id || parsed.id || parsed;
} catch {
  snapshotId = snapRaw.trim();
}
LOG(`   snapshot=${snapshotId}`);

const base = `${API}/snapshot/${snapshotId}`;
await mkdir(path.join(ROOT, 'en_gb'), { recursive: true });

LOG('2. fetch snapshot-level files');
for (const name of SNAPSHOT_FILES) {
  const url = `${base}/${name}.json`;
  const data = await fetchJson(url);
  await writeFile(path.join(ROOT, `${name}.json`), JSON.stringify(data, null, 2));
  LOG(`   + ${name}.json`);
}

LOG('3. fetch en_gb files');
for (const name of LOCALE_FILES) {
  const url = `${base}/en_gb/${name}.json`;
  try {
    const data = await fetchJson(url);
    await writeFile(path.join(ROOT, 'en_gb', `${name}.json`), JSON.stringify(data, null, 2));
    LOG(`   + en_gb/${name}.json`);
  } catch (e) {
    LOG(`   - en_gb/${name}.json: ${e.message}`);
  }
}

await writeFile(path.join(ROOT, 'SNAPSHOT.txt'), `${snapshotId}\n${new Date().toISOString()}\n`);
LOG(`done. snapshot ${snapshotId} saved to ${ROOT}`);
