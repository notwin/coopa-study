# Coopa Study · 设计文档

- 日期：2026-04-15
- 状态：Draft（待用户审阅）
- 作者：@notwin + Claude

## 1. 背景

Google Research 推出了面向 11-14 岁的 AI 教育游戏 [AI Quests](https://research.google/ai-quests/intl/en_gb)，由 Google + 斯坦福 CRAFT 合作开发。MVP 含 1 个已上线 quest「洪水预测」(Flood Forecasting)，另有「糖尿病视网膜病变检测」「人脑映射」待上线。目标用户在游戏里跟虚拟导师 Skye 教授一起收集数据、训练模型、做 AI 预测。

**问题**：该产品仅提供英文，中国家庭的 11-14 岁儿童学 AI 时存在语言门槛。原站是 WebGL 3D 沉浸游戏（自定义 Toon 着色器 + Gemini 生成图像 + 多场景切换），游戏对话、UI、提示全部渲染在 canvas 纹理里，**无法通过常规浏览器插件的 DOM 覆盖方式翻译**。

## 2. 目标 / MVP 范围

**目标**：做一个 Chrome / Edge MV3 浏览器插件，在访问 AI Quests 时，右侧弹出中文"伴读"面板，帮助 11-14 岁中国儿童理解游戏剧情、跟上关键对白、掌握 AI 术语。

**MVP 范围**（刻意收敛）：
- 仅支持 Chrome 和 Edge（Chromium 88+，MV3）
- 仅覆盖第 1 个 quest：洪水预测
- 内容为**人工预制的静态 JSON 包**，随插件打包，离线可用
- 儿童**手动**切换章节（不做自动游戏进度同步）
- 中文书面为主，不做 TTS 语音

**非目标（YAGNI）**：
- 不做 Firefox / Safari
- 不做进度/成就持久化（除折叠状态）
- 不做家长视角 / 学习报告 / 教师导出
- 不做 LLM 实时讲解（不需要配 API key）
- 不覆盖另外两个未上线 quest
- 不改动原游戏 canvas 内容

## 3. 关键约束

- 原站游戏主体是 WebGL canvas，插件**不能**读取或改写其内部文本。
- 伴读面板不能遮挡游戏主体（原游戏需要完整画面沉浸）。
- 目标儿童 11-14 岁能独立阅读中文，不需拼音或语音朗读。
- 家长零配置（不填 API key、不登录）。

## 4. 架构

### 4.1 项目结构

```
coopa-study/
├── manifest.json              # MV3 manifest，content_scripts 匹配 ai-quests URL
├── vite.config.ts             # Vite + @crxjs/vite-plugin
├── src/
│   ├── content/
│   │   └── index.ts           # content script 入口：创建 host + mount Preact
│   ├── sidebar/
│   │   ├── App.tsx            # 边栏根组件（折叠/展开状态机）
│   │   ├── ChapterTabs.tsx    # 顶部任务一/二/三 切换
│   │   ├── ChapterView.tsx    # 当前章节渲染
│   │   ├── blocks/
│   │   │   ├── ExplainerBlock.tsx
│   │   │   ├── DialogueBlock.tsx
│   │   │   ├── TermBlock.tsx
│   │   │   └── TipBlock.tsx
│   │   └── styles.css         # Shadow DOM 内 scoped 样式
│   ├── content-packs/
│   │   └── flood-forecasting.json
│   ├── schema/
│   │   └── content-pack.ts    # zod schema + 派生 TS 类型
│   └── types.ts
└── public/icons/              # 16/48/128 px 插件图标
```

### 4.2 运行机制

1. 用户访问 `research.google/ai-quests/*` → MV3 content script 自动注入
2. content script 在 `<body>` 末尾创建 `<div id="coopa-study-host">`，附 Shadow DOM（`mode: 'open'`）
3. `import flood-forecasting.json`（Vite 编译时 inline，无网络 fetch）
4. Preact 在 Shadow Root 内挂载 `<App pack={pack}/>`
5. 用户交互通过本地 state 驱动，无后台 / 无网络

### 4.3 技术栈

- **构建**：Vite 5 + `@crxjs/vite-plugin`（自动生成 MV3 产物，HMR 支持）
- **框架**：Preact（≈3kb，React API 兼容）
- **类型**：TypeScript 严格模式
- **校验**：zod 对 content pack JSON 构建期校验
- **样式**：纯 CSS + CSS 变量，挂在 Shadow DOM 内（不引 Tailwind）
- **测试**：Vitest + `@testing-library/preact` + happy-dom；Playwright 做 E2E

## 5. 内容包格式

### 5.1 JSON 示例

```jsonc
{
  "questId": "flood-forecasting",
  "questTitle": "洪水预测",
  "questUrlPattern": "research.google/ai-quests/*flood*",
  "version": "0.1.0",
  "chapters": [
    {
      "id": "ch1",
      "title": "任务一：收集数据",
      "summary": "你要去哪些地方采集水位、降雨、地形数据？AI 为什么需要这些？",
      "blocks": [
        {
          "type": "explainer",
          "title": "什么是数据？",
          "body": "数据就是 AI 的「眼睛」，AI 看到的世界有多清楚，取决于你给它什么样的数据。"
        },
        {
          "type": "dialogue",
          "speaker": "Skye 教授",
          "en": "Let's gather rainfall data first.",
          "zh": "我们先去收集降雨数据吧。"
        },
        {
          "type": "term",
          "term": "数据集",
          "en": "dataset",
          "definition": "一堆同类数据的集合，比如 1000 条降雨记录。",
          "analogy": "像一摞观察笔记本。"
        },
        {
          "type": "tip",
          "body": "在游戏里看到下雨标记就点过去采样。"
        }
      ]
    }
  ]
}
```

### 5.2 Block 类型

MVP 定义 4 种 block，约束内容创作者只能用这些：

| type | 字段 | 用途 |
|---|---|---|
| `explainer` | `title`, `body` | 自由讲解（AI 概念、任务背景） |
| `dialogue` | `speaker`, `en`, `zh` | 英文台词 + 中译，帮跟上游戏对白 |
| `term` | `term`, `en`, `definition`, `analogy` | AI 术语卡（中文词 + 英文原词 + 通俗定义 + 类比） |
| `tip` | `body` | 玩法小提示（便利贴风格） |

### 5.3 章节数

按"洪水预测"实际任务节点划分，预计 3-5 章。具体章节标题、数量、对白抽取在实施阶段由作者**实玩一遍游戏**后填定。

### 5.4 zod Schema

`src/schema/content-pack.ts` 用 zod 定义所有类型，在 `vite build` 前校验 JSON，CI 失败拦截。运行时不再二次校验（信任构建产物）。TS 类型由 `z.infer` 派生，单一真源。

## 6. UI 组件

### 6.1 组件树

```
<App>
  ├── <CollapseHandle/>          # 折叠态：右侧 32px 细条 + 图标
  └── <Sidebar/> (展开时)
        ├── <Header/>            # 「中文伴读 · 洪水预测」 + 收起按钮
        ├── <ChapterTabs/>
        └── <ChapterView/>
              ├── <ChapterIntro/>   # 标题 + summary
              └── blocks.map → <ExplainerBlock/> / <DialogueBlock/> /
                                <TermBlock/> / <TipBlock/>
```

### 6.2 状态

App 使用 Preact `useState`，不引入 store：

- `collapsed: boolean` — 默认 `true`，localStorage 持久化用户偏好
- `currentChapterId: string` — 默认第一章，会话内记忆，不持久化
- `pack: ContentPack` — 启动时 import 静态 JSON

### 6.3 视觉规范（11-14 岁友好）

- 字号 ≥ 16px，行高 1.6
- 圆角卡片 12px，明亮色块区分 4 种 block
- 配色避开原游戏主色系，防止视觉混乱
- 折叠态图标用清晰可识别的中文字符或图形，不装饰性 emoji
- 展开宽度 360px（在 1280+ 屏幕上不挤压游戏 canvas）

### 6.4 Shadow DOM 隔离

所有 CSS 注入 Shadow Root 内，彻底避开原站样式污染。Shadow Root `mode: 'open'`（方便 E2E 测试选择器穿透）。

## 7. 数据流

### 7.1 启动序列

```
页面 DOMContentLoaded
  → 检查 window.__coopaStudyMounted（防重复注入）
  → 创建 <div id="coopa-study-host"> 附 Shadow DOM
  → import flood-forecasting.json
  → render(<App pack={pack}/>, shadowRoot)
  → 从 localStorage 读 collapsed 偏好（默认 true）
```

### 7.2 用户操作

| 操作 | 触发 | 结果 |
|---|---|---|
| 点细条展开 | `setCollapsed(false)` | localStorage 写入；边栏渲染 |
| 点收起按钮 | `setCollapsed(true)` | localStorage 写入；变细条 |
| 切章节 tab | `setCurrentChapterId('ch2')` | ChapterView 重渲；不持久化 |
| 翻术语卡 | TermBlock 内部 `useState` | 局部翻面动画 |

### 7.3 SPA 路由变化

原站若是 SPA（pushState 切路由不重载）：

- 用 `MutationObserver` + `popstate` / `pushState` 拦截监听
- URL 离开 ai-quests 路径 → 自动隐藏（不卸载，preserve 状态）
- 回到匹配路径 → 自动显示

### 7.4 不做的事（MVP YAGNI 清单）

- 不调网络 API
- 不存学习记录
- 不读原站业务 DOM / 不读 canvas 内容（仅读 URL 用于判断是否在匹配路径）
- 不监听原游戏事件
- 不和 background service worker 通信

## 8. 错误处理

| 场景 | 处理 |
|---|---|
| 内容包字段缺失 / 类型错 | 构建期 zod 校验，CI 失败拦截。运行时不兜底 |
| 原站升级 SPA 路由策略 | `MutationObserver` 心跳检查 host 是否还在，缺失则重挂 |
| `localStorage` 不可用（无痕模式） | try/catch + fallback 到 memory state |
| Shadow DOM 不支持 | MV3 运行环境 Chrome 88+ / Edge 88+ 原生支持，不兜底 |
| 原站 CSP 限制 | content script 默认 isolated world + Shadow DOM，不受影响 |
| content script 重复注入 | `window.__coopaStudyMounted` 标记防护 |

**不写**的兜底：网络失败（无网络调用）、Preact 错误边界（组件简单，宁崩不藏）。

## 9. 测试策略

1. **单元测试** — Vitest + happy-dom + `@testing-library/preact`
   - 每种 Block 组件渲染
   - TermBlock 翻面交互
   - App 状态机：折叠切换 + localStorage 持久化
   - App 章节切换
   - JSON loader 正常 + 异常路径

2. **构建期校验** — zod schema 跑在 `vite build` 前，校验 content-pack JSON

3. **端到端** — Playwright 启动 Chromium 加载 unpacked 插件，访问 ai-quests URL
   - 断言边栏可见
   - 断言可展开 / 收起
   - 断言可切章节
   - 断言刷新页面后 collapsed 偏好保持

4. **人工 MVP 验收（最关键）**
   - 作者在自己 Chrome 装插件
   - 实玩一遍洪水预测
   - 对照伴读内容是否对得上、儿童视角是否易读
   - 记录发现问题到 issue

## 10. 开放问题 / 后续

MVP 完成后可评估：

- 另外 2 个 quest 上线后加入内容包（直接复用现有 block 类型）
- 加自动同步（若届时发现原站 URL / 网络有可靠信号）
- 加 8-10 岁年龄档（需要拼音 + 口语化 + TTS）
- 加教师 / 家长导出（打印版学习卡）

这些都**不纳入 MVP**。
