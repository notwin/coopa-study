# Chrome Web Store Listing · Coopa Study

把下面的内容分别粘贴到 Chrome Web Store Developer Dashboard 对应字段。

---

## 名称（Name）· 最多 75 字符

```
Coopa Study · AI Quests 中文伴读
```

## 简短描述（Summary）· ≤ 132 字符

```
把 Google AI Quests 的界面、对话、过场字幕全部变中文，并在右侧提供术语卡与伴读讲解，11-14 岁孩子能用母语学 AI。
```

## 类别（Category）

- **Education**（首选）
- 可选二级：Accessibility

## 支持的语言（Listing Languages）

- 中文（简体）- `zh-CN`
- English - `en`（简介可用英文，正文中文）

## 详细描述（Description）· 富文本，≤ 16000 字符

```
Coopa Study 是 Google AI Quests（https://research.google/ai-quests）的**中文伴读插件**。

安装之后，访问 AI Quests，整个游戏界面、Luna 的开场对话、Skye 教授的教程过场字幕、市场摊位的任务说明、数据收集对象的名字，全部都变成中文。

右侧边栏会有一个紫色的「伴」字细条，点开后是中文伴读面板：AI 术语卡（相关性、预测、数据集……），玩法提示，以及数据选择背后的科学解释——帮孩子一边玩一边真正理解 AI 是怎么思考的。

— 面向谁 —
- 11-14 岁对 AI 好奇的中国孩子
- 希望孩子用母语学编程/AI 概念的家长
- 双语教学场景里的老师

— 它做什么 —
- 拦截 Google AI Quests 的内容 JSON 请求，返回预翻译的中文版本
- 不改变原游戏 WebGL 3D 体验，只替换文字
- 右侧挂一个可折叠的伴读面板（Shadow DOM 隔离，不干扰原站）

— 它不做什么 —
- 不收集任何用户数据
- 不上传任何信息到第三方服务器
- 不修改 Google 账号或学习记录
- 不改动 AI Quests 本身，插件卸载即回到原版英文

— 覆盖范围 —
MVP 仅翻译「Flood Forecasting（洪水预测）」这个 quest 的主线内容。「Blindness Prevention」「Mapping the Brain」暂时保留英文，后续版本补齐。

— 开源 —
代码完全公开，可审计、可自编译。Issue 与翻译贡献欢迎来 GitHub 讨论。

Made with ❤ for kids learning AI in Chinese.
```

## 单句标语（Tagline，商店小卡片副标题用）

```
让 Google AI Quests 说中文
```

## 宣传素材（Assets）位置

- 商店图标 128×128：`public/icons/icon128.png`
- 小宣传图 440×280（必需）：`public/icons/promo-tile-440x280.png`
- 大宣传图 1400×560（推荐）：`public/icons/marquee-1400x560.png`
- 截图 1280×800（至少 1 张，推荐 3-5 张）：`docs/release/screenshots/*.png`

## 搜索关键词建议

`AI Quests`, `中文`, `汉化`, `translation`, `Chinese`, `localization`, `Google Research`, `AI 教育`, `儿童编程`, `Flood Forecasting`, `教育游戏`, `KidsAI`

## 发布者信息（占位，你发版前填上）

- Developer / Publisher: _填你的 GitHub 用户名或昵称_
- Support email: _填 email_
- Website: _填 repo URL 或主页_
- Privacy policy URL: _托管 `PRIVACY_POLICY.md` 的公共 URL_

## 权限理由（Permissions Justification）

复制 `docs/release/PERMISSIONS.md` 的内容到 Developer Dashboard 对应问答。
