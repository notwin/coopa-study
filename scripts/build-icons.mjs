// 把 public/icons/icon.svg 渲染成插件需要的各尺寸 PNG + Chrome Web Store 素材。
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SVG_ICON = await readFile(join(ROOT, 'public/icons/icon.svg'));

// 1. 插件运行时图标 16/48/128 px
for (const size of [16, 48, 128]) {
  const out = join(ROOT, `public/icons/icon${size}.png`);
  await sharp(SVG_ICON).resize(size, size).png({ compressionLevel: 9 }).toFile(out);
  console.log(`+ public/icons/icon${size}.png`);
}

// 2. Chrome Web Store 图标（128×128，商店专用，可以同 icon128）—— 复用
// 3. 宣传小图 Promotional Tile（440×280 推荐）
const PROMO = `
<svg xmlns="http://www.w3.org/2000/svg" width="440" height="280" viewBox="0 0 440 280">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="440" y2="280" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#6D80FF"/>
      <stop offset="1" stop-color="#3F52D6"/>
    </linearGradient>
  </defs>
  <rect width="440" height="280" fill="url(#bg)"/>
  <!-- 左侧：伴 图标 -->
  <rect x="32" y="72" width="136" height="136" rx="28" fill="#FFFFFF" fill-opacity="0.14"/>
  <text x="100" y="140"
        dominant-baseline="central" text-anchor="middle"
        font-family="PingFang SC, Noto Sans CJK SC, sans-serif"
        font-size="92" font-weight="700" fill="#FFFFFF">伴</text>
  <!-- 右侧文案 -->
  <text x="200" y="108" font-family="PingFang SC, Noto Sans CJK SC, sans-serif"
        font-size="32" font-weight="700" fill="#FFFFFF">Coopa Study</text>
  <text x="200" y="148" font-family="PingFang SC, Noto Sans CJK SC, sans-serif"
        font-size="20" font-weight="500" fill="#E4E8FF">AI Quests 中文伴读</text>
  <text x="200" y="184" font-family="PingFang SC, Noto Sans CJK SC, sans-serif"
        font-size="14" font-weight="400" fill="#C8D0F5">给 11-14 岁孩子的中文 AI 探索之旅</text>
</svg>
`;
await sharp(Buffer.from(PROMO)).png({ compressionLevel: 9 }).toFile(join(ROOT, 'public/icons/promo-tile-440x280.png'));
console.log('+ public/icons/promo-tile-440x280.png');

// 4. Marquee（1400×560 可选大图）
const MARQUEE = `
<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="560" viewBox="0 0 1400 560">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1400" y2="560" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#6D80FF"/>
      <stop offset="1" stop-color="#2F3FB0"/>
    </linearGradient>
  </defs>
  <rect width="1400" height="560" fill="url(#bg)"/>
  <rect x="140" y="160" width="240" height="240" rx="48" fill="#FFFFFF" fill-opacity="0.14"/>
  <text x="260" y="290" dominant-baseline="central" text-anchor="middle"
        font-family="PingFang SC, Noto Sans CJK SC, sans-serif"
        font-size="164" font-weight="700" fill="#FFFFFF">伴</text>
  <text x="440" y="220" font-family="PingFang SC, Noto Sans CJK SC, sans-serif"
        font-size="64" font-weight="700" fill="#FFFFFF">Coopa Study</text>
  <text x="440" y="290" font-family="PingFang SC, Noto Sans CJK SC, sans-serif"
        font-size="36" font-weight="500" fill="#E4E8FF">Google AI Quests 中文伴读</text>
  <text x="440" y="360" font-family="PingFang SC, Noto Sans CJK SC, sans-serif"
        font-size="22" font-weight="400" fill="#C8D0F5">界面·对话·字幕全中文 · 11-14 岁孩子友好</text>
</svg>
`;
await sharp(Buffer.from(MARQUEE)).png({ compressionLevel: 9 }).toFile(join(ROOT, 'public/icons/marquee-1400x560.png'));
console.log('+ public/icons/marquee-1400x560.png');

console.log('icons built');
