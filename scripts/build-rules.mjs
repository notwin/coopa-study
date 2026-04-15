import { readdir, writeFile, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const ZH = join(ROOT, 'content-zh');

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
const rules = files.map((f, i) => {
  const rel = relative(ZH, f);
  const extensionPath = '/content-zh/' + rel.replace(/\\/g, '/');
  const escaped = rel.replace(/\\/g, '/').replace(/\./g, '\\.');
  const regex = `^.*/content/api/snapshot/[^/]+/${escaped}(\\?.*)?$`;
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

await writeFile(join(ROOT, 'rules.json'), JSON.stringify(rules, null, 2));
console.log(`wrote ${rules.length} rules -> rules.json`);
