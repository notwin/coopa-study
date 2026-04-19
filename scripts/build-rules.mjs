import { readdir, writeFile, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const ZH = join(ROOT, 'public', 'content-zh');

async function walkJson(dir, out = []) {
  for (const name of await readdir(dir)) {
    const p = join(dir, name);
    const s = await stat(p);
    if (s.isDirectory()) await walkJson(p, out);
    else if (name.endsWith('.json')) out.push(p);
  }
  return out;
}

const files = await walkJson(ZH);
const redirectRules = files.map((f, i) => {
  const rel = relative(ZH, f).replace(/\\/g, '/');
  const extensionPath = '/content-zh/' + rel;
  // Google 会按页面 locale 切换 URL 里的语言段（曾经 en_gb，现在 en_us）。
  // 我们只维护一套中文翻译，让 locale 段通配到任何语言上——用户无论落到哪条语言路径都命中同一份中文。
  const parts = rel.split('/');
  const escapedTail = parts.slice(1).join('/').replace(/\./g, '\\.');
  const middle = parts.length > 1 ? `[^/]+/${escapedTail}` : rel.replace(/\./g, '\\.');
  const regex = `^.*/content/api/snapshot/[^/]+/${middle}(\\?.*)?$`;
  return {
    id: i + 1,
    priority: 1,
    action: { type: 'redirect', redirect: { extensionPath } },
    condition: {
      regexFilter: regex,
      resourceTypes: ['xmlhttprequest', 'other']
    }
  };
});

// research.google 的 ai-quests 页面用严格 `script-src 'self'` CSP，拦住了
// content script 对插件内 JS 的 dynamic import（伴读面板无法挂载）。
// 只针对 ai-quests 路径的 main_frame/sub_frame 去掉 CSP header，影响面局限。
const cspStrip = {
  id: redirectRules.length + 1,
  priority: 1,
  action: {
    type: 'modifyHeaders',
    responseHeaders: [
      { header: 'content-security-policy', operation: 'remove' },
      { header: 'content-security-policy-report-only', operation: 'remove' }
    ]
  },
  condition: {
    regexFilter: '^https://research\\.google/ai-quests(/.*)?$',
    resourceTypes: ['main_frame', 'sub_frame']
  }
};

const rules = [...redirectRules, cspStrip];
await writeFile(join(ROOT, 'rules.json'), JSON.stringify(rules, null, 2));
console.log(`wrote ${rules.length} rules (${redirectRules.length} redirects + 1 CSP strip) -> rules.json`);
