import { readFile, readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const SRC = join(ROOT, 'content-source');
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

function leafPaths(obj, prefix = '', out = []) {
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    for (const k of Object.keys(obj)) leafPaths(obj[k], prefix + '/' + k, out);
  } else if (Array.isArray(obj)) {
    obj.forEach((v, i) => leafPaths(v, prefix + `[${i}]`, out));
  } else {
    out.push(prefix);
  }
  return out;
}

function countArrows(s) { return (String(s ?? '').match(/-->/g) || []).length; }

async function verify() {
  const srcFiles = await walkJson(SRC);
  let errors = 0;
  for (const srcFile of srcFiles) {
    const rel = relative(SRC, srcFile);
    const zhFile = join(ZH, rel);
    try {
      await stat(zhFile);
    } catch {
      console.error(`MISSING zh file for ${rel}`);
      errors++;
      continue;
    }
    const src = JSON.parse(await readFile(srcFile, 'utf8'));
    const zh = JSON.parse(await readFile(zhFile, 'utf8'));
    const sp = new Set(leafPaths(src));
    const zp = new Set(leafPaths(zh));
    const missing = [...sp].filter(p => !zp.has(p));
    const extra = [...zp].filter(p => !sp.has(p));
    if (missing.length || extra.length) {
      console.error(`SHAPE MISMATCH ${rel}: missing=${missing.length} extra=${extra.length}`);
      if (missing.length) console.error('  missing:', missing.slice(0, 5));
      if (extra.length) console.error('  extra:', extra.slice(0, 5));
      errors++;
    }
    function checkSubs(a, b, path = '') {
      if (a && typeof a === 'object' && !Array.isArray(a)) {
        for (const k of Object.keys(a)) {
          if (k === 'subtitles' && typeof a[k] === 'string' && typeof b?.[k] === 'string') {
            const sa = countArrows(a[k]);
            const sb = countArrows(b[k]);
            if (sa !== sb) {
              console.error(`SUBS MISMATCH ${rel}${path}/${k}: src=${sa} zh=${sb}`);
              errors++;
            }
          } else {
            checkSubs(a[k], b?.[k], path + '/' + k);
          }
        }
      }
    }
    checkSubs(src, zh);
  }
  if (errors > 0) {
    console.error(`\n${errors} error(s)`);
    process.exit(1);
  }
  console.log('shape OK');
}

verify();
