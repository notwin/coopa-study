# Permissions Justification · Coopa Study

Chrome Web Store 审核会对每个声明的权限要求填写使用理由。以下是本插件每项权限的完整说明，可逐字复制。

## Single purpose（单一用途）

> This extension has one single purpose: localize Google AI Quests (https://research.google/ai-quests) content into Chinese so that 11–14 year-old Chinese learners can experience the game in their native language.

中文：本插件只做一件事——把 Google AI Quests 的内容汉化成中文，让 11-14 岁的中国孩子能用母语体验这个 AI 教育游戏。

---

## Permission: `declarativeNetRequestWithHostAccess`

> Needed for two declarative network actions, both scoped to `research.google` via host permissions:
> 1. **Redirect** Google AI Quests content API requests (`content/api/snapshot/<id>/en_gb/*.json`) to locally bundled, pre-translated Chinese JSON files.
> 2. **Remove** the page's `Content-Security-Policy` header on `research.google/ai-quests/*` main frame responses. This is required because research.google ships a strict `script-src 'self'` CSP that blocks the extension's own content script from dynamically importing its bundled modules. The CSP removal is the narrowest possible scope (only our own host permission + ai-quests path).
>
> No request payload is inspected or logged — the only actions are a URL redirect and a header modification, both declarative.

中文：插件用声明式规则做两件事（都在 host_permissions `https://research.google/*` 范围内）：
1. 把 AI Quests 页面对 `content/api/snapshot/<id>/en_gb/*.json` 的 fetch 请求重定向到扩展内置的中文 JSON 文件；
2. 剥掉 `research.google/ai-quests/*` main frame 响应的 `Content-Security-Policy` header，因为 Google 下发的严格 `script-src 'self'` CSP 会拦住插件自身 content script 的动态 import（伴读面板无法挂载）。CSP 剥除的作用域严格限定在我们已申请权限的 host + ai-quests 路径。

只做 URL 重定向和 header 修改，不读、不记录、不上传请求内容。

---

## Host permission: `https://research.google/*`

> Required so the redirect rules scope only to Google Research pages. Without this host permission, the declarativeNetRequest rules cannot match requests on `research.google`. The extension does not read DOM, cookies, or network traffic of this host beyond what the redirect rules need.

中文：规则只作用于 research.google 域名，用于定向拦截 AI Quests 的 JSON API。不读取该域的 DOM、cookies 或其它流量。

---

## Content scripts on `https://research.google/ai-quests/*`

> The content script mounts a Shadow-DOM-isolated Preact sidebar that shows Chinese term cards, tips, and deep-dive explanations. It does not read, write, or exfiltrate any data from the host page. The sidebar's collapsed/expanded preference is persisted via `localStorage` scoped to the page origin (no `chrome.storage`).

中文：content script 在 research.google/ai-quests 路径下挂一个 Shadow DOM 隔离的 Preact 伴读面板，渲染中文术语卡、讲解、提示。不读、不写、不外传页面数据。折叠偏好保存在 page origin 的 localStorage（不使用 `chrome.storage`）。

---

## Remote code policy statement

> This extension does not execute any remote code. All JavaScript is bundled into the extension package at build time. All translated content JSON is shipped inside the extension — no runtime download, no LLM call, no analytics SDK.

中文：插件不执行任何远程代码。所有 JS 在构建时打包，所有翻译内容随插件一起分发，不做运行时远程下载，不调用 LLM，不嵌入统计 SDK。

---

## Data handling declarations

| Collected | Value |
|---|---|
| Personally identifiable information | ✗ No |
| Health information | ✗ No |
| Financial / payment info | ✗ No |
| Authentication info (passwords, credentials) | ✗ No |
| Personal communications (email, SMS, chat) | ✗ No |
| Location | ✗ No |
| Web history | ✗ No |
| User activity (clicks, mouse, keystrokes) | ✗ No |
| Website content (text, images, links from pages) | ✗ No |

I certify that:
- My extension does not sell user data to third parties
- My extension does not use or transfer user data for purposes unrelated to its single purpose
- My extension does not use or transfer user data to determine creditworthiness or for lending purposes
