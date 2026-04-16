# 隐私政策 · Coopa Study

**最新更新：2026-04-16**

本文同时适用简体中文用户与英文用户。英文版在下方。

---

## 一句话总结

Coopa Study 是一款只在本地运行的浏览器扩展。**它不收集、不存储、不传输你的任何数据。**

## 我们收集什么

**什么都不收集。**

具体地：
- 我们不收集你的姓名、邮箱、账号或任何身份识别信息
- 我们不追踪你访问了哪些网页
- 我们不记录你在 AI Quests 游戏里的进度、选择、答案
- 我们不嵌入任何第三方分析服务（无 Google Analytics、无 Sentry、无任何 SDK）
- 我们不向任何服务器发起网络请求（插件中翻译的内容文件随插件一起分发，运行时不下载）

## 插件本地存储的唯一东西

浏览器的 `localStorage`（归属于 research.google 这个网站，不是扩展）记录**一个 key**：`coopa-study.collapsed`，值只可能是 `"0"` 或 `"1"`，表示右侧伴读面板是否折叠。它**不离开你的电脑**，卸载插件或清理浏览器数据即可清除。

## 权限说明

本扩展声明了两个权限：

1. **`declarativeNetRequestWithHostAccess`**：用于在浏览器本地把 `research.google/ai-quests/content/api/snapshot/*/en_gb/*.json` 请求重定向到扩展内置的中文 JSON 文件。这是纯客户端操作，不涉及任何服务器。
2. **Host permission `https://research.google/*`**：限制上述重定向规则只作用于 research.google，避免影响其它网站。

## 儿童隐私（COPPA / PIPL 相关）

本扩展面向 11-14 岁儿童使用场景设计。由于我们**完全不收集任何数据**，不适用于 COPPA 下的「从 13 岁以下儿童收集个人信息」条款，也不适用 PIPL 下的「未成年人个人信息处理」条款。

## 开源审计

插件代码完全开源，任何人都可以审计实现：  
<https://github.com/notwin/coopa-study>

## 联系方式

隐私相关问题：notwin@gmail.com

---

# Privacy Policy · Coopa Study (English)

**Last updated: 2026-04-16**

## TL;DR

Coopa Study runs entirely on your device. **It does not collect, store, or transmit any of your data.**

## What we collect

**Nothing.**

Specifically:
- No names, emails, account identifiers, or any personally identifiable information
- No browsing history or page visit tracking
- No AI Quests game progress, choices, or answers
- No third-party analytics (no Google Analytics, Sentry, or any SDK)
- No runtime network requests (all translated content is bundled with the extension)

## The only thing stored locally

Browser `localStorage` (scoped to `research.google`, not the extension) holds **one key**: `coopa-study.collapsed`, with value `"0"` or `"1"`, remembering whether the sidebar is collapsed. It never leaves your device. Uninstalling the extension or clearing site data removes it.

## Permissions

This extension declares two permissions:

1. **`declarativeNetRequestWithHostAccess`** — used to redirect, locally, any request to `research.google/ai-quests/content/api/snapshot/*/en_gb/*.json` to the extension-bundled Chinese JSON. Pure client-side; no server involved.
2. **Host permission `https://research.google/*`** — scopes the redirect rules to this host only, so nothing else is affected.

## Children's privacy (COPPA)

This extension is designed for 11–14-year-old learners. Because we collect **no data whatsoever**, COPPA's "collect personal information from children under 13" trigger never activates.

## Open source

Source is fully auditable:  
<https://github.com/notwin/coopa-study>

## Contact

For any privacy question: notwin@gmail.com
