# Coopa Study MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 交付 MVP Chrome/Edge MV3 插件，原位汉化 AI Quests 的 CMS JSON（覆盖 Flood Forecasting 主线）+ 右侧伴读面板（术语卡/讲解/提示）。

**Architecture:** `declarativeNetRequest` 把 `content/api/snapshot/<id>/en_gb/*.json` 重定向到插件内 `content-zh/en_gb/*.json`；content script 注入 Shadow DOM + Preact 伴读面板，不改原站 JS、不侵入 Angular。

**Tech Stack:** Vite 5 + `@crxjs/vite-plugin` + Preact 10 + TypeScript 严格模式 + zod + Vitest + Playwright。

---

## 前置假设

- 已有内容：
  - `content-source/` — Google CMS 英文源（由 `scripts/fetch-cms.mjs` 拉取）
  - `scripts/fetch-cms.mjs`（保留不动）
  - `docs/superpowers/specs/2026-04-15-coopa-study-design.md`（spec）
- 工作目录：`/Users/notwin/Code/coopa_study`
- Node 24+，npm 11+（已验证）

## 文件结构（全量）

插件根（Vite 项目）：
```
coopa_study/
├── package.json                     # Task 1
├── tsconfig.json                    # Task 1
├── tsconfig.node.json               # Task 1
├── vite.config.ts                   # Task 2
├── manifest.config.ts               # Task 3（@crxjs manifest TS 源）
├── .gitignore                       # Task 1
├── src/
│   ├── content/
│   │   └── index.ts                 # Task 7
│   ├── sidebar/
│   │   ├── App.tsx                  # Task 8
│   │   ├── CollapseHandle.tsx       # Task 8
│   │   ├── Header.tsx               # Task 8
│   │   ├── ChapterTabs.tsx          # Task 9
│   │   ├── ChapterView.tsx          # Task 10
│   │   ├── blocks/
│   │   │   ├── ExplainerBlock.tsx   # Task 11
│   │   │   ├── TermBlock.tsx        # Task 12
│   │   │   └── TipBlock.tsx         # Task 13
│   │   ├── styles.css               # Task 16
│   │   └── storage.ts               # Task 14
│   ├── companion-packs/
│   │   └── flood-forecasting.json   # Task 6
│   ├── schema/
│   │   ├── companion-pack.ts        # Task 5
│   │   └── cms-pack.ts              # Task 22
│   └── types.ts                     # Task 5
├── content-zh/
│   ├── site_config.json             # Task 21
│   └── en_gb/
│       ├── sitewide.json            # Task 17
│       ├── home_page.json           # Task 19
│       ├── planet_page.json         # Task 18
│       └── flood_prediction.json    # Task 20
├── scripts/
│   ├── fetch-cms.mjs                # 已存在，不动
│   ├── verify-shape.mjs             # Task 22
│   └── build-rules.mjs              # Task 23
├── tests/
│   ├── schema/
│   │   └── companion-pack.test.ts   # Task 5
│   ├── sidebar/
│   │   ├── App.test.tsx             # Task 8
│   │   ├── ChapterTabs.test.tsx     # Task 9
│   │   ├── ChapterView.test.tsx     # Task 10
│   │   └── blocks/
│   │       ├── ExplainerBlock.test.tsx  # Task 11
│   │       ├── TermBlock.test.tsx       # Task 12
│   │       └── TipBlock.test.tsx        # Task 13
│   ├── storage.test.ts              # Task 14
│   ├── scripts/
│   │   └── verify-shape.test.mjs    # Task 22
│   └── e2e/
│       ├── load.spec.ts             # Task 25
│       └── translation.spec.ts      # Task 26
├── public/
│   └── icons/
│       ├── icon16.png               # Task 3
│       ├── icon48.png               # Task 3
│       └── icon128.png              # Task 3
└── vitest.config.ts                 # Task 5
```

---

## Phase 1 · 脚手架

### Task 1: 初始化根 package.json + tsconfig + gitignore

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `.gitignore`

- [ ] **Step 1: 初始化 npm**

Run:
```bash
cd /Users/notwin/Code/coopa_study && npm init -y
```

- [ ] **Step 2: 写 package.json**

替换 `package.json` 内容为：
```json
{
  "name": "coopa-study",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build && node scripts/build-rules.mjs",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "verify:shape": "node scripts/verify-shape.mjs",
    "lint:types": "tsc --noEmit"
  }
}
```

- [ ] **Step 3: 装依赖**

Run:
```bash
npm install -D typescript@5 vite@5 @crxjs/vite-plugin@2.0.0-beta.25 \
  @preact/preset-vite preact@10 \
  zod@3 vitest@2 happy-dom@15 @testing-library/preact@3 @testing-library/jest-dom@6 \
  @playwright/test@1.48 \
  @types/chrome
```
Expected: `added N packages`, 无 error。

- [ ] **Step 4: 写 tsconfig.json**

Create `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "jsxImportSource": "preact",
    "types": ["chrome", "vitest/globals"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "allowJs": false,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "paths": { "react": ["./node_modules/preact/compat"] }
  },
  "include": ["src/**/*", "tests/**/*"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 5: 写 tsconfig.node.json**

Create `tsconfig.node.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "skipLibCheck": true,
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts", "manifest.config.ts", "vitest.config.ts", "scripts/**/*.mjs"]
}
```

- [ ] **Step 6: 写 .gitignore**

Create `.gitignore`:
```
node_modules/
dist/
build/
.vite/
.playwright-cli/
.playwright/
playwright-report/
test-results/
*.log
.DS_Store
scripts/harvest/stuck-*.png
scripts/harvest/*.png
```

- [ ] **Step 7: 提交**

```bash
git add package.json package-lock.json tsconfig.json tsconfig.node.json .gitignore
git commit -m "chore: init npm + typescript + gitignore"
```

---

### Task 2: 配置 Vite + crxjs

**Files:**
- Create: `vite.config.ts`

- [ ] **Step 1: 写 vite.config.ts**

Create `vite.config.ts`:
```ts
import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.config';

export default defineConfig({
  plugins: [preact(), crx({ manifest })],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: { /* manifest drives input */ }
    }
  },
  server: { port: 5173, strictPort: true }
});
```

- [ ] **Step 2: 验证语法**

Run:
```bash
npx tsc --noEmit vite.config.ts 2>&1 | head -20
```
Expected: 无输出或只提示 `Cannot find module './manifest.config'`（下一任务补）。

- [ ] **Step 3: 提交**

```bash
git add vite.config.ts
git commit -m "chore: add vite config with crxjs + preact"
```

---

### Task 3: 生成 manifest + placeholder icons + content script 骨架

**Files:**
- Create: `manifest.config.ts`
- Create: `public/icons/icon16.png` / `icon48.png` / `icon128.png`（占位 PNG）
- Create: `src/content/index.ts`（临时 console.log）

- [ ] **Step 1: 写 manifest.config.ts**

Create `manifest.config.ts`:
```ts
import { defineManifest } from '@crxjs/vite-plugin';

export default defineManifest({
  manifest_version: 3,
  name: 'Coopa Study · AI Quests 中文伴读',
  description: '把 Google AI Quests 的 UI 和字幕原位汉化，并提供中文伴读面板。',
  version: '0.1.0',
  icons: {
    '16': 'icons/icon16.png',
    '48': 'icons/icon48.png',
    '128': 'icons/icon128.png'
  },
  content_scripts: [
    {
      matches: ['https://research.google/ai-quests/*'],
      js: ['src/content/index.ts'],
      run_at: 'document_idle'
    }
  ],
  permissions: ['declarativeNetRequest', 'storage'],
  host_permissions: ['https://research.google/*'],
  declarative_net_request: {
    rule_resources: [
      {
        id: 'coopa_rules',
        enabled: true,
        path: 'rules.json'
      }
    ]
  },
  web_accessible_resources: [
    {
      resources: ['content-zh/*'],
      matches: ['https://research.google/*']
    }
  ]
});
```

- [ ] **Step 2: 生成占位 icon PNG**

Run:
```bash
mkdir -p public/icons
for size in 16 48 128; do
  # 用 macOS sips 或 imagemagick 都没装，用 node 画个单色 PNG 占位
  node -e "
    const fs = require('fs');
    const size = $size;
    const header = Buffer.from([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A]);
    // 最小 1x1 透明 PNG 占位，然后浏览器按 size 缩放
    const data = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
    fs.writeFileSync('public/icons/icon'+size+'.png', data);
  "
done
ls -la public/icons/
```
Expected: 3 个 PNG 文件。

- [ ] **Step 3: 写 placeholder content script**

Create `src/content/index.ts`:
```ts
console.log('[coopa-study] content script loaded on', location.href);
```

- [ ] **Step 4: 创建空 rules.json（Task 23 会自动生成内容）**

Create `rules.json`:
```json
[]
```

- [ ] **Step 5: 构建测试**

Run:
```bash
npm run build
```
Expected: `dist/` 目录创建成功，无 error。

- [ ] **Step 6: 提交**

```bash
git add manifest.config.ts src/content/index.ts public/icons/ rules.json
git commit -m "chore: add MV3 manifest + placeholder icons + content stub"
```

---

### Task 4: 加载 unpacked 冒烟测试

**Files:** 无（手工验证）

- [ ] **Step 1: 构建产物**

Run:
```bash
npm run build
```
Expected: 成功，`dist/manifest.json` 存在。

- [ ] **Step 2: 手工验证加载**

1. 打开 Chrome，访问 `chrome://extensions`
2. 开发者模式 ON
3. 点击"加载已解压的扩展程序"，选 `/Users/notwin/Code/coopa_study/dist`
4. 访问 `https://research.google/ai-quests/intl/en_gb`
5. 打开 DevTools Console，应看到：`[coopa-study] content script loaded on https://research.google/ai-quests/intl/en_gb`

- [ ] **Step 3: 提交 README 记录加载步骤**

Create `README.md`:
```markdown
# Coopa Study

Chrome/Edge 浏览器插件，把 Google AI Quests 汉化。

## 本地开发

```bash
npm install
npm run build   # 产物在 dist/
```

Chrome `chrome://extensions` → 开发者模式 → 加载已解压的扩展程序 → 选 `dist/`。

## 更新 CMS 英文源

```bash
node scripts/fetch-cms.mjs
```
```

Run:
```bash
git add README.md
git commit -m "docs: add load-unpacked instructions"
```

---

## Phase 2 · 伴读面板

### Task 5: Zod schema 和类型 + vitest 配置

**Files:**
- Create: `src/types.ts`
- Create: `src/schema/companion-pack.ts`
- Create: `tests/schema/companion-pack.test.ts`
- Create: `vitest.config.ts`

- [ ] **Step 1: 写 vitest.config.ts**

Create `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';

export default defineConfig({
  plugins: [preact()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}']
  }
});
```

- [ ] **Step 2: 写测试 setup**

Create `tests/setup.ts`:
```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 3: 写失败测试**

Create `tests/schema/companion-pack.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { companionPackSchema } from '../../src/schema/companion-pack';

describe('companionPackSchema', () => {
  it('接受最小合法 pack', () => {
    const pack = {
      questId: 'flood-forecasting',
      questTitle: '洪水预测',
      version: '0.1.0',
      chapters: [
        {
          id: 'ch1',
          title: '第一关',
          summary: '测试摘要',
          blocks: [{ type: 'tip', body: '加油' }]
        }
      ]
    };
    expect(companionPackSchema.parse(pack)).toEqual(pack);
  });

  it('拒绝未知 block type', () => {
    const bad = {
      questId: 'x',
      questTitle: 'x',
      version: '0.1.0',
      chapters: [{ id: 'c', title: 't', summary: 's', blocks: [{ type: 'unknown' }] }]
    };
    expect(() => companionPackSchema.parse(bad)).toThrow();
  });

  it('接受 explainer / term / tip', () => {
    const pack = {
      questId: 'x',
      questTitle: 'x',
      version: '0.1.0',
      chapters: [
        {
          id: 'c', title: 't', summary: 's',
          blocks: [
            { type: 'explainer', title: 'T', body: 'B' },
            { type: 'term', term: '术语', en: 'term', definition: 'D', analogy: 'A' },
            { type: 'tip', body: '提示' }
          ]
        }
      ]
    };
    expect(companionPackSchema.parse(pack).chapters[0]!.blocks.length).toBe(3);
  });
});
```

- [ ] **Step 4: 跑测试确认失败**

Run:
```bash
npx vitest run tests/schema/companion-pack.test.ts 2>&1 | tail -20
```
Expected: FAIL，提示 `Cannot find module '../../src/schema/companion-pack'`。

- [ ] **Step 5: 实现 schema**

Create `src/schema/companion-pack.ts`:
```ts
import { z } from 'zod';

const explainerBlock = z.object({
  type: z.literal('explainer'),
  title: z.string(),
  body: z.string()
});

const termBlock = z.object({
  type: z.literal('term'),
  term: z.string(),
  en: z.string(),
  definition: z.string(),
  analogy: z.string()
});

const tipBlock = z.object({
  type: z.literal('tip'),
  body: z.string()
});

export const blockSchema = z.discriminatedUnion('type', [explainerBlock, termBlock, tipBlock]);

export const chapterSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  summary: z.string(),
  blocks: z.array(blockSchema).min(1)
});

export const companionPackSchema = z.object({
  questId: z.string().min(1),
  questTitle: z.string().min(1),
  version: z.string(),
  chapters: z.array(chapterSchema).min(1)
});
```

- [ ] **Step 6: 写 types.ts 派生类型**

Create `src/types.ts`:
```ts
import { z } from 'zod';
import { companionPackSchema, chapterSchema, blockSchema } from './schema/companion-pack';

export type CompanionPack = z.infer<typeof companionPackSchema>;
export type Chapter = z.infer<typeof chapterSchema>;
export type Block = z.infer<typeof blockSchema>;
export type ExplainerBlock = Extract<Block, { type: 'explainer' }>;
export type TermBlock = Extract<Block, { type: 'term' }>;
export type TipBlock = Extract<Block, { type: 'tip' }>;
```

- [ ] **Step 7: 跑测试确认通过**

Run:
```bash
npx vitest run tests/schema/companion-pack.test.ts
```
Expected: 3 tests passed.

- [ ] **Step 8: 提交**

```bash
git add vitest.config.ts tests/setup.ts tests/schema/ src/schema/ src/types.ts
git commit -m "feat(schema): add companion pack zod schema + types"
```

---

### Task 6: Seed flood-forecasting.json（占位内容，≥1 章 ≥1 块）

**Files:**
- Create: `src/companion-packs/flood-forecasting.json`

- [ ] **Step 1: 写内容**

Create `src/companion-packs/flood-forecasting.json`:
```json
{
  "questId": "flood-forecasting",
  "questTitle": "洪水预测",
  "version": "0.1.0",
  "chapters": [
    {
      "id": "intro",
      "title": "开场：Skye 教授找到你了",
      "summary": "Luna 的市场总被洪水淹。Skye 教授要你用 AI 做洪水预报系统。",
      "blocks": [
        {
          "type": "explainer",
          "title": "为什么要用 AI 预测洪水？",
          "body": "传统天气预报不够准。AI 能同时看降雨、温度、土壤、河流好多种数据，综合判断。"
        },
        {
          "type": "term",
          "term": "预测",
          "en": "prediction",
          "definition": "根据已知信息猜未来会发生什么。",
          "analogy": "就像看到乌云就准备收衣服——用已知判断未发生的事。"
        },
        {
          "type": "tip",
          "body": "听完 Luna 讲完背景再选 Sounds good，别急着跳过。"
        }
      ]
    },
    {
      "id": "collect",
      "title": "任务一：选对数据",
      "summary": "Skye 给你 14 种数据，只有一部分对预测洪水真的有用。",
      "blocks": [
        {
          "type": "explainer",
          "title": "数据质量决定 AI 聪不聪明",
          "body": "AI 就像一个学生，给他什么教材他就学什么。教材里塞无用的信息他会越学越糊涂。"
        },
        {
          "type": "term",
          "term": "相关性",
          "en": "correlation",
          "definition": "两件事一起发生的规律。",
          "analogy": "冰淇淋销量和下雨概率一起变化，但冰淇淋不会导致下雨——它们都是被「夏天」影响。"
        },
        {
          "type": "tip",
          "body": "选数据时先问：这件事真会影响洪水吗？"
        }
      ]
    }
  ]
}
```

- [ ] **Step 2: 写校验测试**

Create `tests/schema/seed-pack.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { companionPackSchema } from '../../src/schema/companion-pack';
import pack from '../../src/companion-packs/flood-forecasting.json';

describe('flood-forecasting companion pack', () => {
  it('符合 schema', () => {
    expect(() => companionPackSchema.parse(pack)).not.toThrow();
  });

  it('有至少 2 章', () => {
    expect(companionPackSchema.parse(pack).chapters.length).toBeGreaterThanOrEqual(2);
  });
});
```

- [ ] **Step 3: 跑测试**

Run: `npx vitest run tests/schema/seed-pack.test.ts`
Expected: PASS。

- [ ] **Step 4: 提交**

```bash
git add src/companion-packs/flood-forecasting.json tests/schema/seed-pack.test.ts
git commit -m "feat(content): seed flood-forecasting companion pack (2 chapters)"
```

---

### Task 7: Content script 挂载 Shadow DOM host

**Files:**
- Modify: `src/content/index.ts`
- Create: `tests/e2e/mount.spec.ts`（暂不写，Playwright 留到 Phase 4）

- [ ] **Step 1: 实现 mount 逻辑**

Replace `src/content/index.ts`:
```ts
declare global {
  interface Window {
    __coopaStudyMounted?: boolean;
  }
}

function mount(): void {
  if (window.__coopaStudyMounted) return;
  window.__coopaStudyMounted = true;

  const host = document.createElement('div');
  host.id = 'coopa-study-host';
  host.style.all = 'initial';
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });
  const root = document.createElement('div');
  root.id = 'coopa-study-root';
  shadow.appendChild(root);

  import('../sidebar/App').then(({ mountApp }) => mountApp(root));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount, { once: true });
} else {
  mount();
}
```

- [ ] **Step 2: 提交（App 占位会在 Task 8 补）**

```bash
git add src/content/index.ts
git commit -m "feat(content): mount shadow DOM host for sidebar"
```

---

### Task 8: App + Header + CollapseHandle + mountApp

**Files:**
- Create: `src/sidebar/App.tsx`
- Create: `src/sidebar/CollapseHandle.tsx`
- Create: `src/sidebar/Header.tsx`
- Create: `tests/sidebar/App.test.tsx`

- [ ] **Step 1: 写失败测试**

Create `tests/sidebar/App.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/preact';
import { App } from '../../src/sidebar/App';
import pack from '../../src/companion-packs/flood-forecasting.json';
import type { CompanionPack } from '../../src/types';

describe('<App/>', () => {
  it('默认折叠态只显示细条', () => {
    render(<App pack={pack as CompanionPack} initialCollapsed={true}/>);
    expect(screen.getByRole('button', { name: /展开伴读/ })).toBeInTheDocument();
    expect(screen.queryByText('洪水预测')).not.toBeInTheDocument();
  });

  it('点细条展开显示标题', () => {
    render(<App pack={pack as CompanionPack} initialCollapsed={true}/>);
    fireEvent.click(screen.getByRole('button', { name: /展开伴读/ }));
    expect(screen.getByText('中文伴读 · 洪水预测')).toBeInTheDocument();
  });

  it('点收起按钮变回折叠态', () => {
    render(<App pack={pack as CompanionPack} initialCollapsed={false}/>);
    fireEvent.click(screen.getByRole('button', { name: /收起伴读/ }));
    expect(screen.getByRole('button', { name: /展开伴读/ })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 跑确认失败**

Run: `npx vitest run tests/sidebar/App.test.tsx`
Expected: FAIL（模块未定义）。

- [ ] **Step 3: 写 CollapseHandle**

Create `src/sidebar/CollapseHandle.tsx`:
```tsx
interface Props {
  onExpand: () => void;
}

export function CollapseHandle({ onExpand }: Props) {
  return (
    <button
      class="coopa-collapse-handle"
      aria-label="展开伴读"
      onClick={onExpand}
    >
      <span aria-hidden="true">伴</span>
    </button>
  );
}
```

- [ ] **Step 4: 写 Header**

Create `src/sidebar/Header.tsx`:
```tsx
interface Props {
  title: string;
  onCollapse: () => void;
}

export function Header({ title, onCollapse }: Props) {
  return (
    <header class="coopa-header">
      <h1>中文伴读 · {title}</h1>
      <button
        class="coopa-collapse-btn"
        aria-label="收起伴读"
        onClick={onCollapse}
      >×</button>
    </header>
  );
}
```

- [ ] **Step 5: 写 App**

Create `src/sidebar/App.tsx`:
```tsx
import { useState } from 'preact/hooks';
import { render } from 'preact';
import type { CompanionPack } from '../types';
import { CollapseHandle } from './CollapseHandle';
import { Header } from './Header';

interface Props {
  pack: CompanionPack;
  initialCollapsed?: boolean;
}

export function App({ pack, initialCollapsed = true }: Props) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  if (collapsed) {
    return <CollapseHandle onExpand={() => setCollapsed(false)}/>;
  }
  return (
    <aside class="coopa-sidebar">
      <Header title={pack.questTitle} onCollapse={() => setCollapsed(true)}/>
      {/* ChapterTabs + ChapterView 由后续 task 补 */}
    </aside>
  );
}

export async function mountApp(root: Element) {
  const pack = (await import('../companion-packs/flood-forecasting.json')).default;
  render(<App pack={pack as CompanionPack}/>, root);
}
```

- [ ] **Step 6: 跑测试**

Run: `npx vitest run tests/sidebar/App.test.tsx`
Expected: 3 passed。

- [ ] **Step 7: 提交**

```bash
git add src/sidebar/App.tsx src/sidebar/CollapseHandle.tsx src/sidebar/Header.tsx tests/sidebar/App.test.tsx
git commit -m "feat(sidebar): App with CollapseHandle and Header"
```

---

### Task 9: ChapterTabs

**Files:**
- Create: `src/sidebar/ChapterTabs.tsx`
- Create: `tests/sidebar/ChapterTabs.test.tsx`
- Modify: `src/sidebar/App.tsx`

- [ ] **Step 1: 写失败测试**

Create `tests/sidebar/ChapterTabs.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/preact';
import { ChapterTabs } from '../../src/sidebar/ChapterTabs';

const chapters = [
  { id: 'a', title: '第一关', summary: '', blocks: [] as any },
  { id: 'b', title: '第二关', summary: '', blocks: [] as any }
];

describe('<ChapterTabs/>', () => {
  it('渲染所有章节按钮', () => {
    const onChange = vi.fn();
    render(<ChapterTabs chapters={chapters as any} currentId="a" onChange={onChange}/>);
    expect(screen.getByRole('tab', { name: '第一关' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '第二关' })).toBeInTheDocument();
  });

  it('currentId 对应章节标记 aria-selected', () => {
    const onChange = vi.fn();
    render(<ChapterTabs chapters={chapters as any} currentId="b" onChange={onChange}/>);
    expect(screen.getByRole('tab', { name: '第二关' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: '第一关' })).toHaveAttribute('aria-selected', 'false');
  });

  it('点击章节按钮触发 onChange', () => {
    const onChange = vi.fn();
    render(<ChapterTabs chapters={chapters as any} currentId="a" onChange={onChange}/>);
    fireEvent.click(screen.getByRole('tab', { name: '第二关' }));
    expect(onChange).toHaveBeenCalledWith('b');
  });
});
```

- [ ] **Step 2: 跑确认失败**

Run: `npx vitest run tests/sidebar/ChapterTabs.test.tsx`
Expected: FAIL。

- [ ] **Step 3: 实现**

Create `src/sidebar/ChapterTabs.tsx`:
```tsx
import type { Chapter } from '../types';

interface Props {
  chapters: Chapter[];
  currentId: string;
  onChange: (id: string) => void;
}

export function ChapterTabs({ chapters, currentId, onChange }: Props) {
  return (
    <nav class="coopa-chapter-tabs" role="tablist">
      {chapters.map(c => (
        <button
          key={c.id}
          role="tab"
          aria-selected={c.id === currentId}
          class={`coopa-chapter-tab${c.id === currentId ? ' is-current' : ''}`}
          onClick={() => onChange(c.id)}
        >
          {c.title}
        </button>
      ))}
    </nav>
  );
}
```

- [ ] **Step 4: 跑测试**

Run: `npx vitest run tests/sidebar/ChapterTabs.test.tsx`
Expected: 3 passed。

- [ ] **Step 5: 在 App 里用上（先不加渲染当前章节，Task 10 补）**

Modify `src/sidebar/App.tsx`（替换整个文件）:
```tsx
import { useState } from 'preact/hooks';
import { render } from 'preact';
import type { CompanionPack } from '../types';
import { CollapseHandle } from './CollapseHandle';
import { Header } from './Header';
import { ChapterTabs } from './ChapterTabs';

interface Props {
  pack: CompanionPack;
  initialCollapsed?: boolean;
}

export function App({ pack, initialCollapsed = true }: Props) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [currentChapterId, setCurrentChapterId] = useState(pack.chapters[0]!.id);

  if (collapsed) {
    return <CollapseHandle onExpand={() => setCollapsed(false)}/>;
  }
  return (
    <aside class="coopa-sidebar">
      <Header title={pack.questTitle} onCollapse={() => setCollapsed(true)}/>
      <ChapterTabs
        chapters={pack.chapters}
        currentId={currentChapterId}
        onChange={setCurrentChapterId}
      />
    </aside>
  );
}

export async function mountApp(root: Element) {
  const pack = (await import('../companion-packs/flood-forecasting.json')).default;
  render(<App pack={pack as CompanionPack}/>, root);
}
```

- [ ] **Step 6: 跑所有 sidebar 测试**

Run: `npx vitest run tests/sidebar/`
Expected: 全部 PASS。

- [ ] **Step 7: 提交**

```bash
git add src/sidebar/ChapterTabs.tsx tests/sidebar/ChapterTabs.test.tsx src/sidebar/App.tsx
git commit -m "feat(sidebar): ChapterTabs"
```

---

### Task 10: ChapterView

**Files:**
- Create: `src/sidebar/ChapterView.tsx`
- Create: `tests/sidebar/ChapterView.test.tsx`
- Modify: `src/sidebar/App.tsx`

- [ ] **Step 1: 写失败测试**

Create `tests/sidebar/ChapterView.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/preact';
import { ChapterView } from '../../src/sidebar/ChapterView';
import type { Chapter } from '../../src/types';

const chapter: Chapter = {
  id: 'intro',
  title: '开场',
  summary: '这是摘要',
  blocks: [
    { type: 'tip', body: '小提示' },
    { type: 'explainer', title: '概念', body: '正文' }
  ]
};

describe('<ChapterView/>', () => {
  it('渲染标题和摘要', () => {
    render(<ChapterView chapter={chapter}/>);
    expect(screen.getByRole('heading', { name: '开场' })).toBeInTheDocument();
    expect(screen.getByText('这是摘要')).toBeInTheDocument();
  });

  it('按 blocks 顺序渲染内容', () => {
    render(<ChapterView chapter={chapter}/>);
    expect(screen.getByText('小提示')).toBeInTheDocument();
    expect(screen.getByText('概念')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 跑确认失败**

Run: `npx vitest run tests/sidebar/ChapterView.test.tsx`
Expected: FAIL。

- [ ] **Step 3: 实现 ChapterView（Block 组件会在后续 task 补，先写占位）**

Create `src/sidebar/ChapterView.tsx`:
```tsx
import type { Chapter, Block } from '../types';
import { ExplainerBlock } from './blocks/ExplainerBlock';
import { TermBlock } from './blocks/TermBlock';
import { TipBlock } from './blocks/TipBlock';

interface Props {
  chapter: Chapter;
}

function renderBlock(block: Block, idx: number) {
  switch (block.type) {
    case 'explainer': return <ExplainerBlock key={idx} block={block}/>;
    case 'term': return <TermBlock key={idx} block={block}/>;
    case 'tip': return <TipBlock key={idx} block={block}/>;
  }
}

export function ChapterView({ chapter }: Props) {
  return (
    <section class="coopa-chapter-view" role="tabpanel">
      <h2 class="coopa-chapter-title">{chapter.title}</h2>
      <p class="coopa-chapter-summary">{chapter.summary}</p>
      <div class="coopa-blocks">
        {chapter.blocks.map(renderBlock)}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: 写三个 Block 组件骨架（内容会在 Task 11-13 细化）**

Create `src/sidebar/blocks/ExplainerBlock.tsx`:
```tsx
import type { ExplainerBlock as Block } from '../../types';

interface Props { block: Block; }

export function ExplainerBlock({ block }: Props) {
  return (
    <article class="coopa-block coopa-block--explainer">
      <h3>{block.title}</h3>
      <p>{block.body}</p>
    </article>
  );
}
```

Create `src/sidebar/blocks/TermBlock.tsx`:
```tsx
import { useState } from 'preact/hooks';
import type { TermBlock as Block } from '../../types';

interface Props { block: Block; }

export function TermBlock({ block }: Props) {
  const [flipped, setFlipped] = useState(false);
  return (
    <article class={`coopa-block coopa-block--term${flipped ? ' is-flipped' : ''}`}>
      <button class="coopa-term-front" onClick={() => setFlipped(true)} aria-expanded={flipped}>
        <strong>{block.term}</strong>
        <span class="coopa-term-en">{block.en}</span>
      </button>
      {flipped && (
        <div class="coopa-term-back" onClick={() => setFlipped(false)}>
          <p>{block.definition}</p>
          <p class="coopa-term-analogy">{block.analogy}</p>
        </div>
      )}
    </article>
  );
}
```

Create `src/sidebar/blocks/TipBlock.tsx`:
```tsx
import type { TipBlock as Block } from '../../types';

interface Props { block: Block; }

export function TipBlock({ block }: Props) {
  return (
    <aside class="coopa-block coopa-block--tip">
      <p>{block.body}</p>
    </aside>
  );
}
```

- [ ] **Step 5: 把 ChapterView 接入 App**

Modify `src/sidebar/App.tsx`：在 `<ChapterTabs/>` 后加：
```tsx
        <ChapterTabs
          chapters={pack.chapters}
          currentId={currentChapterId}
          onChange={setCurrentChapterId}
        />
        <ChapterView
          chapter={pack.chapters.find(c => c.id === currentChapterId) ?? pack.chapters[0]!}
        />
```

并在文件顶部加 import：
```tsx
import { ChapterView } from './ChapterView';
```

- [ ] **Step 6: 跑测试**

Run: `npx vitest run tests/sidebar/`
Expected: 全部 PASS。

- [ ] **Step 7: 提交**

```bash
git add src/sidebar/ChapterView.tsx src/sidebar/blocks/ tests/sidebar/ChapterView.test.tsx src/sidebar/App.tsx
git commit -m "feat(sidebar): ChapterView + block skeletons"
```

---

### Task 11: ExplainerBlock 细化 + 测试

**Files:**
- Create: `tests/sidebar/blocks/ExplainerBlock.test.tsx`

- [ ] **Step 1: 写测试**

Create `tests/sidebar/blocks/ExplainerBlock.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/preact';
import { ExplainerBlock } from '../../../src/sidebar/blocks/ExplainerBlock';

describe('<ExplainerBlock/>', () => {
  it('渲染 title 和 body', () => {
    render(<ExplainerBlock block={{ type: 'explainer', title: '什么是 AI', body: 'AI 是...' }}/>);
    expect(screen.getByRole('heading', { name: '什么是 AI' })).toBeInTheDocument();
    expect(screen.getByText('AI 是...')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 跑确认通过**

Run: `npx vitest run tests/sidebar/blocks/ExplainerBlock.test.tsx`
Expected: PASS（实现已在 Task 10 给出）。

- [ ] **Step 3: 提交**

```bash
git add tests/sidebar/blocks/ExplainerBlock.test.tsx
git commit -m "test(sidebar): ExplainerBlock renders title and body"
```

---

### Task 12: TermBlock 翻面交互测试

**Files:**
- Create: `tests/sidebar/blocks/TermBlock.test.tsx`

- [ ] **Step 1: 写测试**

Create `tests/sidebar/blocks/TermBlock.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/preact';
import { TermBlock } from '../../../src/sidebar/blocks/TermBlock';

const block = {
  type: 'term' as const,
  term: '数据集',
  en: 'dataset',
  definition: '一批数据的集合',
  analogy: '像一摞笔记本'
};

describe('<TermBlock/>', () => {
  it('默认只显示正面（term + en）', () => {
    render(<TermBlock block={block}/>);
    expect(screen.getByText('数据集')).toBeInTheDocument();
    expect(screen.getByText('dataset')).toBeInTheDocument();
    expect(screen.queryByText('一批数据的集合')).not.toBeInTheDocument();
  });

  it('点正面翻到背面显示 definition 和 analogy', () => {
    render(<TermBlock block={block}/>);
    fireEvent.click(screen.getByRole('button', { name: /数据集/ }));
    expect(screen.getByText('一批数据的集合')).toBeInTheDocument();
    expect(screen.getByText('像一摞笔记本')).toBeInTheDocument();
  });

  it('点背面翻回正面', () => {
    render(<TermBlock block={block}/>);
    fireEvent.click(screen.getByRole('button', { name: /数据集/ }));
    fireEvent.click(screen.getByText('一批数据的集合').parentElement!);
    expect(screen.queryByText('一批数据的集合')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 跑测试**

Run: `npx vitest run tests/sidebar/blocks/TermBlock.test.tsx`
Expected: PASS（实现已在 Task 10 给出）。

- [ ] **Step 3: 提交**

```bash
git add tests/sidebar/blocks/TermBlock.test.tsx
git commit -m "test(sidebar): TermBlock flip interaction"
```

---

### Task 13: TipBlock 测试

**Files:**
- Create: `tests/sidebar/blocks/TipBlock.test.tsx`

- [ ] **Step 1: 写测试**

Create `tests/sidebar/blocks/TipBlock.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/preact';
import { TipBlock } from '../../../src/sidebar/blocks/TipBlock';

describe('<TipBlock/>', () => {
  it('渲染 body', () => {
    render(<TipBlock block={{ type: 'tip', body: '别跳过开场' }}/>);
    expect(screen.getByText('别跳过开场')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 跑测试**

Run: `npx vitest run tests/sidebar/blocks/TipBlock.test.tsx`
Expected: PASS。

- [ ] **Step 3: 提交**

```bash
git add tests/sidebar/blocks/TipBlock.test.tsx
git commit -m "test(sidebar): TipBlock renders body"
```

---

### Task 14: localStorage 折叠偏好持久化

**Files:**
- Create: `src/sidebar/storage.ts`
- Create: `tests/storage.test.ts`
- Modify: `src/sidebar/App.tsx`

- [ ] **Step 1: 写失败测试**

Create `tests/storage.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { readCollapsed, writeCollapsed } from '../src/sidebar/storage';

beforeEach(() => { localStorage.clear(); });

describe('storage', () => {
  it('空 localStorage 读到 true（默认折叠）', () => {
    expect(readCollapsed()).toBe(true);
  });

  it('写 false 后读到 false', () => {
    writeCollapsed(false);
    expect(readCollapsed()).toBe(false);
  });

  it('localStorage 抛错时 fallback 返回 true 不炸', () => {
    const orig = Storage.prototype.getItem;
    Storage.prototype.getItem = () => { throw new Error('no'); };
    try {
      expect(readCollapsed()).toBe(true);
    } finally {
      Storage.prototype.getItem = orig;
    }
  });
});
```

- [ ] **Step 2: 跑确认失败**

Run: `npx vitest run tests/storage.test.ts`
Expected: FAIL（模块不存在）。

- [ ] **Step 3: 实现**

Create `src/sidebar/storage.ts`:
```ts
const KEY = 'coopa-study.collapsed';

export function readCollapsed(): boolean {
  try {
    const v = localStorage.getItem(KEY);
    if (v === null) return true;
    return v === '1';
  } catch {
    return true;
  }
}

export function writeCollapsed(collapsed: boolean): void {
  try {
    localStorage.setItem(KEY, collapsed ? '1' : '0');
  } catch {
    // 无痕模式等场景静默降级
  }
}
```

- [ ] **Step 4: 跑测试**

Run: `npx vitest run tests/storage.test.ts`
Expected: 3 passed。

- [ ] **Step 5: 把 storage 接到 App**

Modify `src/sidebar/App.tsx`：把 `initialCollapsed` 默认值换成从 storage 读，且在切换时写入。替换 `App` 函数为：
```tsx
import { useEffect, useState } from 'preact/hooks';
import { render } from 'preact';
import type { CompanionPack } from '../types';
import { CollapseHandle } from './CollapseHandle';
import { Header } from './Header';
import { ChapterTabs } from './ChapterTabs';
import { ChapterView } from './ChapterView';
import { readCollapsed, writeCollapsed } from './storage';

interface Props {
  pack: CompanionPack;
  initialCollapsed?: boolean;
}

export function App({ pack, initialCollapsed }: Props) {
  const [collapsed, setCollapsed] = useState(
    initialCollapsed !== undefined ? initialCollapsed : readCollapsed()
  );
  const [currentChapterId, setCurrentChapterId] = useState(pack.chapters[0]!.id);

  useEffect(() => {
    if (initialCollapsed === undefined) writeCollapsed(collapsed);
  }, [collapsed, initialCollapsed]);

  if (collapsed) {
    return <CollapseHandle onExpand={() => setCollapsed(false)}/>;
  }
  return (
    <aside class="coopa-sidebar">
      <Header title={pack.questTitle} onCollapse={() => setCollapsed(true)}/>
      <ChapterTabs
        chapters={pack.chapters}
        currentId={currentChapterId}
        onChange={setCurrentChapterId}
      />
      <ChapterView
        chapter={pack.chapters.find(c => c.id === currentChapterId) ?? pack.chapters[0]!}
      />
    </aside>
  );
}

export async function mountApp(root: Element) {
  const pack = (await import('../companion-packs/flood-forecasting.json')).default;
  render(<App pack={pack as CompanionPack}/>, root);
}
```

- [ ] **Step 6: 跑所有 sidebar 测试确认未回归**

Run: `npx vitest run tests/sidebar/ tests/storage.test.ts`
Expected: 全部 PASS。

- [ ] **Step 7: 提交**

```bash
git add src/sidebar/storage.ts tests/storage.test.ts src/sidebar/App.tsx
git commit -m "feat(sidebar): persist collapsed preference to localStorage"
```

---

### Task 15: SPA 路由 URL 变化时自动隐藏/显示

**Files:**
- Modify: `src/content/index.ts`

- [ ] **Step 1: 实现 URL 匹配 + 显隐**

Replace `src/content/index.ts`:
```ts
declare global {
  interface Window {
    __coopaStudyMounted?: boolean;
  }
}

const MATCH = /^https:\/\/research\.google\/ai-quests(\/|$)/;

function setHostVisibility(host: HTMLElement, visible: boolean): void {
  host.style.display = visible ? '' : 'none';
}

function mount(): void {
  if (window.__coopaStudyMounted) return;
  window.__coopaStudyMounted = true;

  const host = document.createElement('div');
  host.id = 'coopa-study-host';
  host.style.all = 'initial';
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });
  const root = document.createElement('div');
  root.id = 'coopa-study-root';
  shadow.appendChild(root);

  import('../sidebar/App').then(({ mountApp }) => mountApp(root));

  const syncVisibility = () => setHostVisibility(host, MATCH.test(location.href));
  syncVisibility();

  // 监听 SPA 路由
  const origPush = history.pushState;
  const origReplace = history.replaceState;
  history.pushState = function (...args) {
    const r = origPush.apply(this, args);
    syncVisibility();
    return r;
  };
  history.replaceState = function (...args) {
    const r = origReplace.apply(this, args);
    syncVisibility();
    return r;
  };
  window.addEventListener('popstate', syncVisibility);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount, { once: true });
} else {
  mount();
}
```

- [ ] **Step 2: 构建确认不崩**

Run: `npm run build`
Expected: 成功。

- [ ] **Step 3: 提交**

```bash
git add src/content/index.ts
git commit -m "feat(content): track SPA route changes and toggle visibility"
```

---

### Task 16: 伴读面板 CSS

**Files:**
- Create: `src/sidebar/styles.css`
- Modify: `src/sidebar/App.tsx`（import CSS 并注入 Shadow DOM）

- [ ] **Step 1: 写 styles.css**

Create `src/sidebar/styles.css`:
```css
:host { all: initial; }

.coopa-collapse-handle {
  position: fixed;
  top: 50%;
  right: 0;
  transform: translateY(-50%);
  width: 32px;
  height: 120px;
  background: #5A6FFF;
  color: white;
  border: none;
  border-radius: 8px 0 0 8px;
  cursor: pointer;
  font-family: system-ui, -apple-system, 'PingFang SC', sans-serif;
  font-size: 18px;
  font-weight: 600;
  box-shadow: -2px 0 8px rgba(0,0,0,.15);
  z-index: 2147483647;
}

.coopa-sidebar {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 360px;
  background: #FFFEF9;
  color: #1A1A2E;
  font-family: system-ui, -apple-system, 'PingFang SC', sans-serif;
  font-size: 16px;
  line-height: 1.6;
  box-shadow: -4px 0 16px rgba(0,0,0,.2);
  overflow-y: auto;
  z-index: 2147483647;
  display: flex;
  flex-direction: column;
}

.coopa-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: #5A6FFF;
  color: white;
}
.coopa-header h1 { margin: 0; font-size: 18px; }
.coopa-collapse-btn {
  background: transparent;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  line-height: 1;
}

.coopa-chapter-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 12px 16px;
  border-bottom: 1px solid #EEE;
  background: #F5F5FA;
}
.coopa-chapter-tab {
  padding: 6px 12px;
  border: 1px solid #D0D0E0;
  border-radius: 999px;
  background: white;
  font-size: 14px;
  cursor: pointer;
}
.coopa-chapter-tab.is-current {
  background: #5A6FFF;
  color: white;
  border-color: #5A6FFF;
}

.coopa-chapter-view { padding: 16px 20px; }
.coopa-chapter-title { margin: 0 0 8px; font-size: 20px; }
.coopa-chapter-summary { margin: 0 0 16px; color: #4A4A6A; }

.coopa-blocks { display: flex; flex-direction: column; gap: 12px; }

.coopa-block {
  padding: 14px 16px;
  border-radius: 12px;
  margin: 0;
}
.coopa-block h3 { margin: 0 0 8px; font-size: 16px; }
.coopa-block p { margin: 0; }

.coopa-block--explainer { background: #E8F0FF; }
.coopa-block--tip { background: #FFF7D6; border-left: 4px solid #FFC940; }

.coopa-block--term {
  background: white;
  border: 2px solid #5A6FFF;
  cursor: pointer;
}
.coopa-term-front {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  background: transparent;
  border: none;
  padding: 0;
  width: 100%;
  text-align: left;
  font: inherit;
  color: inherit;
  cursor: pointer;
}
.coopa-term-front strong { font-size: 18px; color: #5A6FFF; }
.coopa-term-en { color: #8A8AA6; font-style: italic; }
.coopa-term-back { margin-top: 8px; color: #4A4A6A; }
.coopa-term-analogy { font-style: italic; margin-top: 6px; }
```

- [ ] **Step 2: 在 App 注入样式到 Shadow DOM**

Modify `src/sidebar/App.tsx`: 在 `mountApp` 里注入样式。替换 `mountApp`：
```tsx
import stylesUrl from './styles.css?url';
import stylesRaw from './styles.css?raw';

export async function mountApp(root: Element) {
  const shadow = root.getRootNode();
  if (shadow instanceof ShadowRoot) {
    const style = document.createElement('style');
    style.textContent = stylesRaw;
    shadow.prepend(style);
  }
  const pack = (await import('../companion-packs/flood-forecasting.json')).default;
  render(<App pack={pack as CompanionPack}/>, root);
}
```
（`stylesUrl` 保留不用的 import 会被 Vite 清理；若 TS 警告，删掉 `stylesUrl` 这行。）

实际只留 `import stylesRaw from './styles.css?raw';`。

- [ ] **Step 3: 构建确认**

Run: `npm run build`
Expected: 成功。

- [ ] **Step 4: 提交**

```bash
git add src/sidebar/styles.css src/sidebar/App.tsx
git commit -m "feat(sidebar): add scoped stylesheet inside shadow DOM"
```

---

## Phase 3 · CMS 拦截 + 翻译

### Task 17: 翻译 `content-zh/en_gb/sitewide.json`（仅 MVP 必需字段）

**Files:**
- Create: `content-zh/en_gb/sitewide.json`

- [ ] **Step 1: 拷贝英文源作为骨架**

Run:
```bash
mkdir -p content-zh/en_gb
cp content-source/en_gb/sitewide.json content-zh/en_gb/sitewide.json
```

- [ ] **Step 2: 手工翻译字符串字段**

Edit `content-zh/en_gb/sitewide.json`：按以下替换翻译（保留 key 结构，只改 value）：

- `seo.title`: `"AI Quests"` → `"AI Quests · 中文伴读"`
- `seo.description`: → `"Google AI Quests 面向 11-14 岁儿童的 AI 教育游戏的中文汉化。"`
- `site_name`: `"AI Quests"` → `"AI Quests"`（保留，品牌不译）
- `modal_leave_quest.title`: `"You are about to leave this quest"` → `"确定要离开这个任务吗？"`
- `modal_leave_quest.primary_cta_label`: `"Leave quest"` → `"离开任务"`
- `modal_leave_quest.secondary_cta_label`: `"Stay here"` → `"留在这里"`
- `modal_clear_progress.title`: `"Looks like you've been here before"` → `"你之前来过这里"`
- `modal_clear_progress.subtitle`: `"Would you like to continue with your saved progress?"` → `"要继续之前的进度吗？"`
- `modal_clear_progress.primary_cta_label`: `"Continue"` → `"继续"`
- `modal_clear_progress.secondary_cta_label`: `"Start over"` → `"重新开始"`
- `modal_clear_progress.tertiary_cta_label`: `"Resume"` → `"继续"`
- `social.title`: `"Follow us"` → `"关注我们"`
- `social.twitter_cta_label`: `"X"` → `"X"`
- `social.youtube_cta_label`: `"YouTube"` → `"YouTube"`
- `footer.links[*].text`: `"About Google"` → `"关于 Google"`、`"Google products"` → `"Google 产品"`、`"Privacy"` → `"隐私政策"`、`"Terms"` → `"条款"`
- `footer.help_link.text`: `"Help"` → `"帮助"`
- `footer.locale_dropdown_aria_label`: `"Language"` → `"语言"`
- URL 字段不动

- [ ] **Step 3: 校验 JSON 合法**

Run: `node -e "JSON.parse(require('fs').readFileSync('content-zh/en_gb/sitewide.json', 'utf8'))"`
Expected: 无输出（即合法）。

- [ ] **Step 4: 提交**

```bash
git add content-zh/en_gb/sitewide.json
git commit -m "content(zh): translate sitewide.json for MVP"
```

---

### Task 18: 翻译 `content-zh/en_gb/planet_page.json`

**Files:**
- Create: `content-zh/en_gb/planet_page.json`

- [ ] **Step 1: 拷贝并翻译**

Run:
```bash
cp content-source/en_gb/planet_page.json content-zh/en_gb/planet_page.json
```

Edit `content-zh/en_gb/planet_page.json` 按下列替换：

- `left_aria_label`: `"Previous quest"` → `"上一个任务"`
- `right_aria_label`: `"Next quest"` → `"下一个任务"`
- `quest_locked.eyebrow`: `"Coming Soon"` → `"即将推出"`
- `quest_locked.cta_label`: `"Coming Soon"` → `"敬请期待"`
- `quest_not_started.cta_label`: `"Start Quest"` → `"开始任务"`
- `quest_in_progress.eyebrow`: `"In Progress"` → `"进行中"`
- `quest_in_progress.cta_label`: `"Resume Quest"` → `"继续任务"`
- `quest_complete.eyebrow`: `"Complete"` → `"已完成"`
- `quest_complete.cta_label`: `"Replay Quest"` → `"重玩任务"`
- `quest_complete_badge`: `"Quest complete"` → `"任务完成"`
- `about_cta_label`: `"About"` → `"关于"`

- [ ] **Step 2: 校验 JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('content-zh/en_gb/planet_page.json', 'utf8'))"`
Expected: 无输出。

- [ ] **Step 3: 提交**

```bash
git add content-zh/en_gb/planet_page.json
git commit -m "content(zh): translate planet_page.json"
```

---

### Task 19: 翻译 `content-zh/en_gb/home_page.json`

**Files:**
- Create: `content-zh/en_gb/home_page.json`

- [ ] **Step 1: 拷贝并翻译**

Run:
```bash
cp content-source/en_gb/home_page.json content-zh/en_gb/home_page.json
```

Edit `content-zh/en_gb/home_page.json`：

- `menu_label`: `"Resources &amp; more"` → `"资源和更多"`
- `menu_close_label`: `"Close"` → `"关闭"`
- `text_above_title`: 保留不动（包含 `{{ google_logo }}` 模板变量）
- `accept_mission_cta_label`: `"Accept mission"` → `"接受任务"`
- `about_cta_label`: `"About"` → `"关于"`
- `faq_cta_label`: `"FAQ"` → `"常见问题"`
- `main_title_svg.url`: 保留
- `teacher_resources_cta_label`: `"Teacher resources"` → `"教师资源"`
- `privacy_policy_cta_label`: `"Privacy notice"` → `"隐私声明"`
- `video.webm.url`: 保留
- `video.mp4.url`: 保留
- `video.poster.url`: 保留
- `video.subtitles`: 翻译每行字幕文本，**保留 WEBVTT 头、保留所有 `-->` 时间戳行、保留空行**。按下列对照：

原 20 条字幕 → 翻译后（保留时间戳）：
```
00:00:02.000 --> 00:00:04.210  Welcome to AI Quests  →  欢迎来到 AI 探索之旅
00:00:04.210 --> 00:00:07.000  My name is Professor Skye  →  我是斯凯教授
00:00:07.000 --> 00:00:10.000  An AI expert and your mentor  →  一名 AI 专家，也是你的导师
00:00:10.000 --> 00:00:12.000  throughout this learning experience.  →  在这次学习旅程中陪你一起闯关。
00:00:12.000 --> 00:00:14.080  We've been waiting for someone like you!  →  我们一直在等像你这样的人！
00:00:14.080 --> 00:00:18.000  You're about to begin a journey through our world.  →  你即将踏上穿越我们世界的旅程。
00:00:18.000 --> 00:00:21.040  As you travel, you'll meet different inhabitants  →  路上你会遇到不同星球的居民
00:00:21.040 --> 00:00:24.000  and learn about the challenges in their communities.  →  了解他们家园遇到的难题。
00:00:24.000 --> 00:00:27.000  Your mission is to help them by applying  →  你的任务是用 AI 帮他们
00:00:27.000 --> 00:00:30.250  powerful AI responsibly to their problems.  →  负责任地解决这些问题。
00:00:30.250 --> 00:00:34.120  Each quest will teach you about a real-life AI research project  →  每个任务都对应着 Google 真实的 AI 研究项目
00:00:34.120 --> 00:00:38.000  that's making an impact back on Earth.  →  它们正在地球上产生真正的影响。
00:00:38.000 --> 00:00:41.000  The AI technology you'll experience is amazing!  →  你将体验的 AI 技术非常神奇！
00:00:41.000 --> 00:00:43.000  But it's not magic  →  但它不是魔法——
00:00:43.000 --> 00:00:46.000  success depends on the decisions you make.  →  成功与否取决于你做出的选择。
00:00:46.000 --> 00:00:49.000  You'll need to collect good data,  →  你需要收集高质量的数据，
00:00:49.000 --> 00:00:52.000  train your AI to make smart choices,  →  训练 AI 做出聪明的判断，
00:00:52.000 --> 00:00:54.200  and test it to make sure it's reliable.  →  然后测试它是否可靠。
00:00:54.200 --> 00:00:56.100  The universe is counting on you!  →  整个宇宙都在等你！
00:00:56.100 --> 00:00:58.000  Are you ready?  →  准备好了吗？
```

最终 `video.subtitles` 字段字符串形如：
```
WEBVTT

00:00:02.000 --> 00:00:04.210
欢迎来到 AI 探索之旅

00:00:04.210 --> 00:00:07.000
我是斯凯教授

... (共 20 条，保持空行分隔)
```

- [ ] **Step 2: 校验 JSON 合法 + WebVTT 时间戳数量**

Run:
```bash
node -e "
const d = JSON.parse(require('fs').readFileSync('content-zh/en_gb/home_page.json', 'utf8'));
const src = JSON.parse(require('fs').readFileSync('content-source/en_gb/home_page.json', 'utf8'));
const srcArrows = (src.video.subtitles.match(/-->/g) || []).length;
const zhArrows = (d.video.subtitles.match(/-->/g) || []).length;
if (srcArrows !== zhArrows) { console.error('arrow mismatch', srcArrows, zhArrows); process.exit(1); }
console.log('ok', srcArrows, 'cues');
"
```
Expected: `ok 20 cues`。

- [ ] **Step 3: 提交**

```bash
git add content-zh/en_gb/home_page.json
git commit -m "content(zh): translate home_page.json incl. Skye intro subtitles"
```

---

### Task 20: 翻译 `content-zh/en_gb/flood_prediction.json`（仅 intro 阶段必需字段 + intro 字幕）

**Files:**
- Create: `content-zh/en_gb/flood_prediction.json`

- [ ] **Step 1: 拷贝源**

Run:
```bash
cp content-source/en_gb/flood_prediction.json content-zh/en_gb/flood_prediction.json
```

- [ ] **Step 2: 翻译 intro 阶段字幕 + 通用 UI 标签**

Edit `content-zh/en_gb/flood_prediction.json`：

重点优先覆盖：
- `general` 子对象：所有 button / modal / UI 标签（按值的自然含义译；如 `"Continue"` → `"继续"`、`"Close"` → `"关闭"`、`"Data"` → `"数据"` 等）
- `inventory_bar`：`"Inventory"` → `"物品栏"` 等
- `intro.video.subtitles`：按 11 条字幕译（Luna 开场：`"Argh no..."` → `"糟糕……我们麻烦大了。"`、`"Hi I'm Luna..."` → `"嗨我是露娜，市场摊位的管理员。"`、`"Our lives revolve around the Sasa River."` → `"我们的生活围绕着萨萨河。"`、`"But, as you can see, the river can flood our market without warning."` → `"但河水说涨就涨，没有预警。"`、`"We didn't even have enough time to take the stalls down."` → `"我们连收摊的时间都没有。"`、`"We've been trying to predict flooding, but this weather forecast isn't reliable enough."` → `"我们想预测洪水，可惜天气预报不够准。"`、`"We've heard that AI can help to predict extreme weather events... like floods."` → `"听说 AI 可以预测洪水这种极端天气。"`、`"With accurate early warning,"` → `"有了准确的预警，"`、`"we could protect our market and avoid all this mess."` → `"我们就能保护市场，不用这么狼狈。"`、`"So, can you do it?"` → `"所以，你能帮我们吗？"`）
- `intro.dialog` 或相关对话（如存在）：译成对应中文
- 其他阶段 key（collect_tokens / select_tokens / data_cleaning / testing_training / stalls_game / complete / tokens）：**至少保留所有 key 和结构**，value 可以先填英文原值（后续 V1.0.1 补译）；但 `tokens` 里 14 个数据项名字要翻译：
  - `SATELLITE_IMAGERY` → `卫星图像`（只在 display name，不动 enum key）
  - `UV` → `紫外线`
  - `VEGETATION` → `植被`
  - `RAINFALL` → `降雨量`
  - `TEMPERATURE` → `温度`
  - `SOIL_ANALYSIS` → `土壤分析`
  - `NEWT` → `蝾螈`
  - `HUMIDITY` → `湿度`
  - `EVAPORATION` → `蒸发`
  - `TOWN_GOSSIP` → `街头八卦`
  - `ELEVATION` → `海拔`
  - `SORBET_SALES` → `冰淇淋销量`
  - `ROCKY` → `岩块`
  - `RIVER_FLOW` → `河流流量`

> 注：具体 JSON 结构参考 `content-source/en_gb/flood_prediction.json`。优先保证 intro + general 阶段译完，其他保留英文不影响拦截。

- [ ] **Step 3: 校验字段对齐 + 时间戳**

Run:
```bash
node -e "
const src = JSON.parse(require('fs').readFileSync('content-source/en_gb/flood_prediction.json', 'utf8'));
const zh = JSON.parse(require('fs').readFileSync('content-zh/en_gb/flood_prediction.json', 'utf8'));
function keys(o, p='', out=[]) {
  if (o && typeof o === 'object' && !Array.isArray(o)) {
    for (const k of Object.keys(o)) keys(o[k], p+'/'+k, out);
  } else {
    out.push(p);
  }
  return out;
}
const sk = new Set(keys(src));
const zk = new Set(keys(zh));
const missing = [...sk].filter(k => !zk.has(k));
const extra = [...zk].filter(k => !sk.has(k));
console.log('missing in zh:', missing.length, 'extra in zh:', extra.length);
if (missing.length || extra.length) process.exit(1);
"
```
Expected: `missing in zh: 0 extra in zh: 0`。

- [ ] **Step 4: 提交**

```bash
git add content-zh/en_gb/flood_prediction.json
git commit -m "content(zh): translate flood_prediction intro + tokens"
```

---

### Task 21: `content-zh/site_config.json`（结构镜像，不翻译业务值）

**Files:**
- Create: `content-zh/site_config.json`

- [ ] **Step 1: 直接拷贝**

Run:
```bash
cp content-source/site_config.json content-zh/site_config.json
```

（`site_config` 里都是 locale/enum 代码标识，没可翻内容，但需要镜像以便拦截规则命中。）

- [ ] **Step 2: 提交**

```bash
git add content-zh/site_config.json
git commit -m "content(zh): mirror site_config.json"
```

---

### Task 22: `verify-shape.mjs` 校验脚本 + cms-pack schema + 单元测试

**Files:**
- Create: `scripts/verify-shape.mjs`
- Create: `src/schema/cms-pack.ts`
- Create: `tests/scripts/verify-shape.test.mjs`

- [ ] **Step 1: 写 `scripts/verify-shape.mjs`**

Create `scripts/verify-shape.mjs`:
```js
import { readFile, readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const SRC = join(ROOT, 'content-source');
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
    // WebVTT 时间戳数量对齐
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
```

- [ ] **Step 2: 写 cms-pack schema（基础用 zod，细节字段 V1.0.1 补）**

Create `src/schema/cms-pack.ts`:
```ts
import { z } from 'zod';

export const cmsVideoSchema = z.object({
  webm: z.object({ url: z.string() }).passthrough().optional(),
  mp4: z.object({ url: z.string() }).passthrough().optional(),
  poster: z.object({ url: z.string() }).passthrough().optional(),
  subtitles: z.string().optional()
}).passthrough();

// 宽松 schema：只约束关键字段，剩下用 passthrough 保留
export const sitewideSchema = z.object({
  collection_id: z.literal('Sitewide'),
  seo: z.object({ title: z.string(), description: z.string() }).passthrough(),
  site_name: z.string(),
  footer: z.object({ links: z.array(z.object({ text: z.string(), url: z.string() })) }).passthrough()
}).passthrough();
```

- [ ] **Step 3: 运行 verify 脚本 + 确认通过**

Run: `node scripts/verify-shape.mjs`
Expected: `shape OK`。

- [ ] **Step 4: 写测试用例（负面场景）**

Create `tests/scripts/verify-shape.test.mjs`:
```js
import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';

describe('verify-shape', () => {
  it('当前 content-zh 与 content-source 对齐', () => {
    const out = execSync('node scripts/verify-shape.mjs', { encoding: 'utf8' });
    expect(out).toMatch(/shape OK/);
  });
});
```

Run: `npx vitest run tests/scripts/verify-shape.test.mjs`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add scripts/verify-shape.mjs src/schema/cms-pack.ts tests/scripts/verify-shape.test.mjs
git commit -m "feat(scripts): verify-shape script for content-zh parity"
```

---

### Task 23: `build-rules.mjs` 自动生成 declarativeNetRequest 规则

**Files:**
- Create: `scripts/build-rules.mjs`
- Modify: `rules.json`（由脚本生成）

- [ ] **Step 1: 写 build-rules.mjs**

Create `scripts/build-rules.mjs`:
```js
import { readdir, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { stat } from 'node:fs/promises';

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
  const rel = relative(ZH, f);                 // e.g. "en_gb/flood_prediction.json" or "site_config.json"
  const extensionPath = '/content-zh/' + rel.replace(/\\/g, '/');
  // 拦截 pattern：匹配 snapshot 后任何 <id> 和 locale/<name>.json 或 snapshot/<id>/<name>.json
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
```

- [ ] **Step 2: 跑一遍**

Run: `node scripts/build-rules.mjs`
Expected: `wrote 5 rules -> rules.json`。

- [ ] **Step 3: 确认 rules.json 内容**

Run: `cat rules.json`
Expected: JSON 数组 5 条规则，每条 redirect 到 `/content-zh/...`，condition.regexFilter 含 `content/api/snapshot/[^/]+/`。

- [ ] **Step 4: 修 package.json 让 `build` 在 vite build 后运行 build-rules（Task 1 已写但确认一下）**

Read `package.json`: `"build": "tsc -b && vite build && node scripts/build-rules.mjs"` 已存在 — OK。

- [ ] **Step 5: 测试端到端构建**

Run: `npm run build`
Expected: 成功；`dist/manifest.json` 和 `dist/rules.json` 都存在；`dist/content-zh/` 存在。

- [ ] **Step 6: 提交**

```bash
git add scripts/build-rules.mjs rules.json
git commit -m "feat(scripts): auto-generate declarativeNetRequest rules from content-zh"
```

---

### Task 24: 补全 manifest 让构建产物包含 content-zh 和 rules.json

**Files:**
- Modify: `vite.config.ts`（加 public 目录拷贝）
- Modify: `manifest.config.ts`（确认 rules 和 resources 正确）

- [ ] **Step 1: 让 Vite 把 content-zh 拷到 dist**

@crxjs 已经把 manifest 里列出的 `web_accessible_resources` 自动打包。但 `content-zh/` 不在 public 下。有两个办法：
1. 把 `content-zh/` 挪到 `public/content-zh/`
2. 在 `vite.config.ts` 加 plugin 拷贝

选 1（简单）。

Run:
```bash
mkdir -p public
mv content-zh public/content-zh
```

- [ ] **Step 2: 同步更新 build-rules.mjs 和 verify-shape.mjs 的路径**

Modify `scripts/build-rules.mjs`：把 `join(ROOT, 'content-zh')` 改为 `join(ROOT, 'public/content-zh')`。

Modify `scripts/verify-shape.mjs`：同上。

- [ ] **Step 3: 跑 verify + build-rules 确认能找到新路径**

Run: `node scripts/verify-shape.mjs && node scripts/build-rules.mjs`
Expected: 两个脚本都成功。

- [ ] **Step 4: 跑 build**

Run: `npm run build`
Expected: `dist/content-zh/` 存在、`dist/rules.json` 存在。

- [ ] **Step 5: 验证 rules.json 里 extensionPath 是否正确**

Run: `head -30 rules.json`
Expected: `extensionPath: "/content-zh/en_gb/..."`（不包含 `public/`，因为 `public/` 在 Vite 里是 dist 根）。

如果路径带 `public/`，改 build-rules.mjs 的 extensionPath 生成逻辑剥掉 `public/` 前缀。

- [ ] **Step 6: 提交**

```bash
git add public/content-zh scripts/build-rules.mjs scripts/verify-shape.mjs
git rm -r content-zh 2>/dev/null || true
git commit -m "chore: move content-zh into public/ for vite pickup"
```

---

## Phase 4 · 端到端验证

### Task 25: Playwright E2E — 加载 + 地图页中文

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/load.spec.ts`

- [ ] **Step 1: 初始化 playwright**

Run:
```bash
npx playwright install chromium
```
Expected: 安装完成（如已装则跳过）。

- [ ] **Step 2: 写 playwright.config.ts**

Create `playwright.config.ts`:
```ts
import { defineConfig } from '@playwright/test';
import { resolve } from 'node:path';

const EXTENSION_PATH = resolve(import.meta.dirname, 'dist');

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  use: {
    headless: false,        // MV3 插件必须带 GUI
    viewport: { width: 1280, height: 800 },
    launchOptions: {
      args: [
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`
      ]
    }
  },
  workers: 1
});
```

- [ ] **Step 3: 写加载冒烟测试**

Create `tests/e2e/load.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test('打开主页能看到"接受任务"中文按钮', async ({ page }) => {
  await page.goto('https://research.google/ai-quests/intl/en_gb');
  await expect(page.locator('button:has-text("接受任务")')).toBeVisible({ timeout: 15_000 });
});

test('进入地图页"开始任务"是中文', async ({ page }) => {
  await page.goto('https://research.google/ai-quests/intl/en_gb');
  // cookie banner
  try { await page.locator('button:has-text("OK, got it")').click({ timeout: 3000 }); } catch {}
  await page.locator('button:has-text("接受任务")').click();
  // skip cinematic
  try { await page.locator('button[aria-label="Skip"]').click({ force: true, timeout: 5000 }); } catch {}
  await expect(page).toHaveURL(/\/map$/, { timeout: 15_000 });
  await expect(page.locator('button:has-text("开始任务")')).toBeVisible();
});
```

- [ ] **Step 4: 确保 dist 是最新**

Run: `npm run build`
Expected: 成功。

- [ ] **Step 5: 跑 E2E**

Run: `npx playwright test tests/e2e/load.spec.ts`
Expected: 2 passed。

若失败，检查 `chrome://extensions` 手工验证 rule 是否加载、`rules.json` 是否在 `dist/`。

- [ ] **Step 6: 提交**

```bash
git add playwright.config.ts tests/e2e/load.spec.ts
git commit -m "test(e2e): load extension + verify Chinese UI on home and map"
```

---

### Task 26: E2E — cinematic 字幕中文化

**Files:**
- Create: `tests/e2e/translation.spec.ts`

- [ ] **Step 1: 写测试**

Create `tests/e2e/translation.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test('Skye 开场字幕首条是中文', async ({ page }) => {
  await page.goto('https://research.google/ai-quests/intl/en_gb');
  try { await page.locator('button:has-text("OK, got it")').click({ timeout: 3000 }); } catch {}
  await page.locator('button:has-text("接受任务")').click();
  // 等 cinematic 视频加载 + textTracks 生效
  const cue = await page.waitForFunction(() => {
    const v = document.querySelector('video');
    if (!v) return null;
    const tt = v.textTracks?.[0];
    if (!tt || !tt.cues || tt.cues.length === 0) return null;
    return (tt.cues[0] as VTTCue).text;
  }, { timeout: 30_000 });
  const text = await cue.jsonValue();
  expect(text).toContain('欢迎');
});
```

- [ ] **Step 2: 跑测试**

Run: `npx playwright test tests/e2e/translation.spec.ts`
Expected: PASS。

- [ ] **Step 3: 提交**

```bash
git add tests/e2e/translation.spec.ts
git commit -m "test(e2e): cinematic first cue is Chinese"
```

---

### Task 27: E2E — 伴读边栏可展开/收起

**Files:**
- Modify: `tests/e2e/load.spec.ts`（追加用例）

- [ ] **Step 1: 在 load.spec.ts 追加用例**

Append to `tests/e2e/load.spec.ts`:
```ts
test('伴读边栏默认折叠态，点击能展开并看到"中文伴读"', async ({ page }) => {
  await page.goto('https://research.google/ai-quests/intl/en_gb');
  // Shadow root 里的 button（aria-label "展开伴读"）
  const handle = page.locator('#coopa-study-host').locator('button[aria-label="展开伴读"]');
  await expect(handle).toBeVisible({ timeout: 10_000 });
  await handle.click();
  await expect(page.locator('#coopa-study-host').locator('text=中文伴读')).toBeVisible();
});
```

- [ ] **Step 2: 跑**

Run: `npx playwright test tests/e2e/load.spec.ts`
Expected: 3 passed。

- [ ] **Step 3: 提交**

```bash
git add tests/e2e/load.spec.ts
git commit -m "test(e2e): sidebar collapse handle toggles sidebar"
```

---

### Task 28: 打包 zip 并写加载指南

**Files:**
- Modify: `package.json`
- Modify: `README.md`

- [ ] **Step 1: 加 package.json 脚本**

Modify `package.json` scripts，新增：
```json
    "package": "npm run build && cd dist && zip -rq ../coopa-study-0.1.0.zip ./"
```

- [ ] **Step 2: 跑一次验证**

Run: `npm run package`
Expected: 根目录生成 `coopa-study-0.1.0.zip`。

- [ ] **Step 3: 更新 README**

Replace `README.md`:
```markdown
# Coopa Study

Chrome / Edge 浏览器插件，把 Google AI Quests 原位汉化（地图、任务、对话、cinematic 字幕），并在右侧提供中文伴读面板（AI 术语卡、讲解、玩法提示）。

面向 11-14 岁中国儿童学习 AI。

## 本地开发

```bash
npm install
npm run build     # 产物在 dist/
npm test          # 跑单元测试
npm run test:e2e  # 跑 E2E
```

## 安装到 Chrome

1. 打开 `chrome://extensions`
2. 右上角"开发者模式" ON
3. 点"加载已解压的扩展程序"，选 `<项目根目录>/dist`
4. 访问 `https://research.google/ai-quests/intl/en_gb`

## 更新 CMS 英文源

Google 更新游戏内容后，重新拉取并重新翻译/构建：

```bash
node scripts/fetch-cms.mjs
npm run verify:shape   # 找出新字段
# 手工翻译 public/content-zh/en_gb/*.json 中的新字段
npm run build
```

## 打包给别人装

```bash
npm run package
```

产物：`coopa-study-0.1.0.zip`，可分发。
```

- [ ] **Step 4: 提交**

```bash
git add package.json README.md
git commit -m "chore: add package script and install instructions"
```

---

### Task 29: 最终自查

**Files:** 无

- [ ] **Step 1: 跑全部测试**

Run: `npm test && npx playwright test`
Expected: 全绿。

- [ ] **Step 2: 跑 shape 校验**

Run: `npm run verify:shape`
Expected: `shape OK`。

- [ ] **Step 3: 类型检查**

Run: `npm run lint:types`
Expected: 无 error。

- [ ] **Step 4: 手工验收清单**

按 README 把 `dist/` 装到自己 Chrome 里，访问 ai-quests：
- [ ] 首页"Accept mission"变成"接受任务"
- [ ] 地图页 quest 的"Start Quest"变成"开始任务"
- [ ] 点开 Flood Forecasting，开场 cinematic 第一句字幕是"糟糕……我们麻烦大了。"
- [ ] Skye 开场独白（跳过地图）首句是"欢迎来到 AI 探索之旅"
- [ ] 右侧细条可见，点开展开伴读面板，能切章节、翻术语卡
- [ ] 关闭浏览器再打开，折叠偏好保留

逐一手工确认，发现问题开 issue。

- [ ] **Step 5: 打 tag**

```bash
git tag v0.1.0-mvp
git log --oneline -5
```

---

## Self-Review 结果

（写完后对照 spec 自查，此段是我写的检查记录，不是待执行步骤。）

**1. Spec 覆盖核对**

| spec 章节 | 对应 Task |
|---|---|
| § 4.1 项目结构 | Task 1-3 |
| § 4.2 (A) CMS 拦截器 | Task 17-24 |
| § 4.2 (B) 伴读面板 | Task 5-16 |
| § 5.1 中文 CMS JSON | Task 17-21 |
| § 5.2 companion pack | Task 6 |
| § 5.3 schema 校验 | Task 5, 22 |
| § 6 UI 组件 | Task 8-16 |
| § 7.1 启动序列 | Task 7, 15 |
| § 7.2 拦截规则 | Task 23-24 |
| § 7.3 用户操作 | Task 8, 9, 12, 14 |
| § 7.4 SPA 路由 | Task 15 |
| § 8 错误处理 | Task 14 (localStorage), Task 22 (shape verify) |
| § 9 测试 | Task 5-14 单元 + Task 22 shape + Task 25-27 E2E + Task 29 手工 |

全覆盖。

**2. Placeholder 扫描**

无 TODO / TBD / "稍后补"。Task 20 里明确声明"其他阶段 value 保留英文"是可接受的 MVP 决定，不是 placeholder。

**3. 类型一致性**

- `CompanionPack` / `Chapter` / `Block` 在 Task 5 定义，后续 Task 8-14 全部一致使用。
- `ExplainerBlock` / `TermBlock` / `TipBlock` 作为类型名和组件名都一致。
- Block `type` 字段的三个字符串（`explainer` / `term` / `tip`）在 schema、seed JSON、组件 props、测试中统一。
- CSS class 前缀 `coopa-` 统一。

无类型不一致。

---
