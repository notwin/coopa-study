# Coopa Study · 设计文档

- 日期：2026-04-15
- 状态：Draft（待用户审阅）· 已基于实测升级至方案 F
- 作者：@notwin + Claude

## 1. 背景

Google Research 推出面向 11-14 岁的 AI 教育游戏 [AI Quests](https://research.google/ai-quests/intl/en_gb)，Google + 斯坦福 CRAFT 合作开发。当前含 2 个上线 quest（Flood Forecasting、Blindness Prevention），1 个待上线（Mapping the Brain）。玩家在 WebGL 3D 场景里跟虚拟导师 Skye 教授一起收集数据、训练模型、做预测。

**问题**：该产品不支持中文，中国家庭的 11-14 岁儿童学 AI 时存在语言门槛。

**关键技术发现**（实测得出）：
- 原站是 **Angular SPA**（不是纯 WebGL 游戏），URL 随场景变化（`/map` → `/quest/market-marshes` 等）
- 游戏 UI、对话气泡、按钮、任务说明 **100% 是 DOM 文本**（非 canvas）
- Cinematic 视频字幕**不是外挂 .vtt 文件**，而是直接嵌在 CMS JSON 字段（`video.subtitles` = `"WEBVTT\n\n00:00:02.000 --> ..."`）
- 整个游戏的文本内容在几个 **CMS JSON**（`content/api/snapshot/<id>/en_gb/*.json`）里集中管理
- WebGL canvas 内几乎不含英文贴图文字，3D 部分只负责视觉/动画

**结论**：只要替换 CMS JSON 为中文版，就可实现**接近 100% 的原位汉化**——游戏内所有 UI、对话、字幕、按钮都是中文。

## 2. 目标 / MVP 范围

**目标**：做一个 Chrome / Edge MV3 浏览器插件，在访问 AI Quests 时：

1. **原位完全汉化**：拦截 CMS JSON 请求，返回预翻译的中文 JSON，让 Angular 直接渲染中文 UI 和中文字幕
2. **右侧伴读面板**：补充深度讲解（AI 术语卡、玩法提示、拓展知识），不替代游戏内容，而是额外增强

**MVP 范围**：
- 仅 Chrome / Edge（Chromium 88+，MV3）
- 仅覆盖 **Flood Forecasting** 一个 quest（+ 主页 + 地图页等通用 UI）
- 内容 = 预翻译 JSON 包，随插件打包（离线可用，家长零配置）
- 伴读面板：折叠态细条，展开时右侧 360px，儿童手动切章节

**非目标（YAGNI）**：
- 不做 Firefox / Safari
- 不做 Blindness Prevention / Mapping the Brain（第二、第三 quest 留给 V1.1）
- 不做进度持久化（除边栏折叠偏好）
- 不做家长视角 / 学习报告
- 不做 TTS / 拼音
- 不做 LLM 实时讲解
- **不修改原站 JS、不侵入 Angular 内部状态**（只改它读的 JSON）

## 3. 关键约束

- **MV3 规则**：不能用 `webRequestBlocking` 改响应体。必须用 `declarativeNetRequest` 做重定向 + `web_accessible_resources` 暴露本地 JSON。
- **CMS snapshot 会更新**：Google 每发新版本生成新 snapshot ID（如 `20260408-153323`）。插件需要匹配**多 snapshot** 或忽略 snapshot 段用通配。
- **JSON 字段必须完整**：中文 JSON 结构必须与英文源 1:1 对齐（所有 key 保留），Angular 读到 undefined 会崩。
- **时间轴必须对齐**：cinematic 视频是固定时长 .webm，字幕 WebVTT 的时间戳不能动，只能翻译文本部分。
- **儿童 11-14 岁能独立读中文**，不需拼音 / 语音。
- **家长零配置**，不填 API key、不登录。

## 4. 架构

### 4.1 项目结构

```
coopa-study/
├── manifest.json                    # MV3 manifest
├── vite.config.ts                   # Vite + @crxjs/vite-plugin
├── rules.json                       # declarativeNetRequest 规则（自动生成）
├── src/
│   ├── content/
│   │   └── index.ts                 # content script：挂载伴读面板
│   ├── sidebar/
│   │   ├── App.tsx                  # 伴读面板根
│   │   ├── ChapterTabs.tsx
│   │   ├── ChapterView.tsx
│   │   ├── blocks/
│   │   │   ├── ExplainerBlock.tsx
│   │   │   ├── TermBlock.tsx
│   │   │   └── TipBlock.tsx
│   │   └── styles.css
│   ├── companion-packs/
│   │   └── flood-forecasting.json   # 伴读面板的深度讲解内容
│   └── schema/
│       ├── companion-pack.ts        # 伴读面板的 zod schema
│       └── cms-pack.ts              # CMS JSON 翻译后的 zod schema（字段完整性校验）
├── content-source/                  # 从 Google CMS 拉取的英文源（由 scripts/fetch-cms.mjs 更新）
│   ├── SNAPSHOT.txt
│   ├── site_config.json
│   └── en_gb/
│       ├── sitewide.json
│       ├── home_page.json
│       ├── planet_page.json
│       └── flood_prediction.json
├── content-zh/                      # 预翻译后的中文版（=英文源结构 1:1 镜像，打包进插件）
│   └── en_gb/
│       ├── sitewide.json            # ← 这里的"en_gb"是路径伪装，因为原站读的 URL 写死 en_gb
│       ├── home_page.json
│       ├── planet_page.json
│       └── flood_prediction.json
├── scripts/
│   ├── fetch-cms.mjs                # 拉英文源
│   ├── translate.mjs                # 半自动翻译辅助（人工校对前的 seed）
│   ├── verify-shape.mjs             # 校验 content-zh 和 content-source 结构完全对齐
│   └── build-rules.mjs              # 从 content-zh 列表自动生成 rules.json
└── public/icons/
```

### 4.2 两个互相独立的功能

**(A) CMS 拦截器（原位汉化）** — 完全无 UI，只有 manifest 规则：

1. `declarativeNetRequest` 匹配 `^.*/content/api/snapshot/[^/]+/en_gb/(sitewide|home_page|planet_page|flood_prediction)\.json.*$`
2. 重定向到 `chrome-extension://<id>/content-zh/en_gb/<name>.json`
3. 浏览器直接从插件包拿中文 JSON 返回给 Angular
4. Angular 原样渲染，整个游戏 UI、对话气泡、按钮、cinematic 字幕全是中文

**(B) 伴读面板（深度讲解）** — Preact app，右侧折叠边栏：

1. content script 挂载在 `research.google/ai-quests/*`
2. 创建 host + Shadow DOM
3. 挂载 `<App pack={companionPack}/>`
4. 面板内容：术语卡（dataset、训练集、误差等 AI 概念）、玩法提示、拓展知识。**不重复游戏对白**（那部分已被 (A) 汉化在游戏里）

### 4.3 技术栈

- Vite 5 + `@crxjs/vite-plugin`（MV3 产物 + HMR）
- Preact（≈3kb）
- TypeScript 严格模式
- zod 构建期校验两类 pack
- 纯 CSS + CSS 变量 + Shadow DOM 隔离
- Vitest + Playwright

## 5. 内容格式

### 5.1 中文 CMS JSON（`content-zh/en_gb/*.json`）

结构必须**和英文源完全对齐**（所有 key 同名），只翻译 string value。例：

```jsonc
// content-source/en_gb/flood_prediction.json （原文，仅展示片段）
{
  "collection_id": "FloodPrediction",
  "intro": {
    "video": {
      "webm": { "url": "quests/en_gb/floodhub-intro.webm" },
      "subtitles": "WEBVTT\n\n00:00:00.000 --> 00:00:02.600\nArgh no... We're in so much trouble.\n..."
    }
  }
}

// content-zh/en_gb/flood_prediction.json （翻译版）
{
  "collection_id": "FloodPrediction",       // 保留原值（Angular 可能用它做判断）
  "intro": {
    "video": {
      "webm": { "url": "quests/en_gb/floodhub-intro.webm" },   // URL 不动（指向同一视频文件）
      "subtitles": "WEBVTT\n\n00:00:00.000 --> 00:00:02.600\n糟糕……我们麻烦大了。\n..."
    }
  }
}
```

**翻译规则**：
- 只改自然语言 string（对白、标题、按钮文字、subtitles 里的说话文本）
- 不动：URL、asset 路径、collection_id、document_id、enum 值（如 habitat 枚举的 `coastal` 等代码标识）
- WebVTT：保留 `WEBVTT` header + 每行时间戳，只翻译字幕文本
- HTML 实体（如 `{{ google_logo }}` 模板变量）保留不动

### 5.2 伴读面板内容（`src/companion-packs/flood-forecasting.json`）

伴读只讲深度拓展（游戏本身已经被 (A) 汉化了，面板**不再负责逐句翻译对白**）：

```jsonc
{
  "questId": "flood-forecasting",
  "questTitle": "洪水预测",
  "version": "0.1.0",
  "chapters": [
    {
      "id": "ch1",
      "title": "第一关：选对数据",
      "summary": "Skye 教授给你 14 种数据，只有部分对预测洪水有用。选错了 AI 就会乱猜。",
      "blocks": [
        { "type": "explainer", "title": "为什么数据质量决定一切",
          "body": "AI 就像学生，数据就是教材。教材错了，学得再刻苦也学不对..." },
        { "type": "term", "term": "相关性", "en": "correlation",
          "definition": "两件事一起发生的规律，比如下雨多 → 河水涨。",
          "analogy": "不是所有一起发生的事都有因果——冰淇淋卖得多和河水涨都是夏天现象。" },
        { "type": "tip", "body": "选数据时问自己：这个东西变化真的会导致洪水吗？" }
      ]
    }
  ]
}
```

三种 block 类型（比原设计少一种 `dialogue`，因为对白已被 (A) 汉化）：
- `explainer` — 自由讲解
- `term` — AI 术语卡
- `tip` — 玩法提示

章节按 `flood_prediction.json` 的 intro / collect_tokens / select_tokens / data_cleaning / testing_training / stalls_game / complete 阶段切分，预计 5-7 章。

### 5.3 Schema 和校验

**`src/schema/cms-pack.ts`**：用 zod 定义 `sitewide`/`home_page`/`planet_page`/`flood_prediction` 的字段结构。构建期和 `scripts/verify-shape.mjs` 跑：对比 `content-source/` 和 `content-zh/` 的 key 路径是否 100% 对齐，少一个字段或多一个字段都 CI 失败。

**`src/schema/companion-pack.ts`**：用 zod 约束 companion pack 的 chapter/block 结构。

## 6. UI 组件（伴读面板）

```
<App pack={companionPack}>
  ├── <CollapseHandle/>       # 折叠态：右侧 32px 细条
  └── <Sidebar/>              # 展开态：360px 宽
        ├── <Header/>         # 标题「中文伴读 · 洪水预测」+ 收起按钮
        ├── <ChapterTabs/>    # 章节切换
        └── <ChapterView/>
              ├── <ChapterIntro/>
              └── blocks.map → <ExplainerBlock/> / <TermBlock/> / <TipBlock/>
```

**状态**（Preact `useState`）：
- `collapsed: boolean` — localStorage 持久化（默认 true）
- `currentChapterId: string` — 会话内记忆，不持久化

**视觉规范**：字号 ≥ 16px、圆角 12px、色块区分 3 种 block、避开原游戏主色、折叠态 32px 细条、展开 360px、Shadow DOM 隔离。

## 7. 数据流

### 7.1 启动序列

```
页面加载
  → 浏览器对 content/api/snapshot/*/en_gb/*.json 的 fetch
  → declarativeNetRequest 匹配 → 重定向到 chrome-extension://xxx/content-zh/en_gb/*.json
  → Angular 收到中文 JSON → 渲染中文 UI + 中文字幕

并行：
  → content script 自动注入（matches: research.google/ai-quests/*）
  → 创建 <div id="coopa-study-host"> + Shadow DOM
  → import companion-packs/flood-forecasting.json
  → render(<App/>, shadowRoot)
```

### 7.2 CMS 拦截规则生成

`scripts/build-rules.mjs` 在构建时读 `content-zh/` 目录，为每个 JSON 生成一条 `rules.json`：

```json
[
  {
    "id": 1,
    "priority": 1,
    "action": {
      "type": "redirect",
      "redirect": { "extensionPath": "/content-zh/en_gb/flood_prediction.json" }
    },
    "condition": {
      "regexFilter": "^.*/content/api/snapshot/[^/]+/en_gb/flood_prediction\\.json.*$",
      "resourceTypes": ["xmlhttprequest", "other"]
    }
  }
  // ... sitewide / home_page / planet_page 各一条
]
```

通配 snapshot ID 段（`[^/]+`），Google 发新版本也不会失效。

### 7.3 伴读面板用户操作

| 操作 | 触发 | 结果 |
|---|---|---|
| 点细条展开 | `setCollapsed(false)` | localStorage 写入 |
| 收起 | `setCollapsed(true)` | localStorage 写入 |
| 切章节 tab | `setCurrentChapterId(id)` | 重渲 |
| 翻术语卡 | TermBlock 内部 state | 翻面动画 |

### 7.4 SPA 路由

原站是 Angular SPA，URL 切换不重载。用 `MutationObserver` + `popstate` 监听：离开 ai-quests 路径自动隐藏面板（不卸载），回来再显。

### 7.5 不做的事

- 不调任何外部网络 API（插件本身）
- 不注入脚本到原站 MAIN world
- 不监听/修改原游戏的 canvas / Angular 内部状态
- 不持久化学习记录

## 8. 错误处理

| 场景 | 处理 |
|---|---|
| CMS 字段结构变更（Google 改了 JSON） | `scripts/verify-shape.mjs` CI 检查 `content-zh` vs `content-source` 字段路径对齐；新字段会让 CI 失败，触发人工补译 |
| Snapshot ID 更新 | 规则用 `[^/]+` 通配，无需改 |
| 中文 JSON 某字段少了 | verify-shape 拦住。运行时不兜底（信任构建产物） |
| WebVTT 时间戳被误改 | lint 脚本校验：中文 subtitles 字段必须和英文源有相同数量的 `-->` 行和相同时间戳 |
| `localStorage` 不可用 | try/catch + fallback 内存态 |
| content script 重复注入 | `window.__coopaStudyMounted` 防护 |
| Google 下线当前 snapshot | 规则失效回退 = 用户看英文原版，不崩（降级可接受） |

**不写**的兜底：网络失败、Preact 错误边界、原站 CSP（content script isolated world 不受限）。

## 9. 测试策略

1. **Schema / Shape 测试**（Vitest）
   - `content-zh/` 每个 JSON 字段路径与 `content-source/` 完全对齐
   - WebVTT `-->` 行数和时间戳一致
   - URL / enum / 模板变量未被翻译

2. **Companion Pack 测试**（Vitest）
   - zod schema 对每个 block 类型校验
   - 章节数量 ≥ 1

3. **伴读 UI 单元测试**（Vitest + happy-dom + testing-library/preact）
   - 折叠/展开状态机
   - 章节切换
   - 各 block 渲染

4. **端到端**（Playwright）
   - 启动 Chromium 加载 unpacked 插件
   - 访问 `ai-quests` → 断言看到"接受任务"（汉化 Accept mission）、"开始任务"（Start Quest）
   - 点击进入 Flood Forecasting → 断言 cinematic 第一句字幕是中文（"糟糕……"）
   - 断言伴读边栏可见并能展开

5. **人工 MVP 验收**
   - 作者本机装插件实玩一遍
   - 对照英文原版和中文版截图，确认核心流程中文完整
   - 11-14 岁目标用户试玩一次（如能找到）

## 10. 开放问题 / 后续

- **V1.1**：Blindness Prevention（已上线，JSON 已抓到 57KB）+ Mapping the Brain（上线后补）
- **V1.2**：覆盖 US/UK 以外的 locale（当前 site_config 显示 Google 自己支持 9 种语言但没 zh_cn；我们为每个 locale 提供一份 `content-zh/<locale>/` 即可）
- **V2**：若 Google 未来加原生 zh_cn，插件功能可降级为"纯伴读深度讲解"（CMS 拦截规则关闭）
- **更新机制**：`scripts/fetch-cms.mjs` 每周跑一次，对比 diff 找 Google 是否改了文案；找到差异则提示人工补译
- **不纳入 MVP**：8-10 岁拼音版、家长导出、TTS

（End）
