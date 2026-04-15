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
2. 右上角「开发者模式」ON
3. 点「加载已解压的扩展程序」，选 `<项目根目录>/dist`
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

## MVP 验收清单（手工）

装 `dist/` 到 Chrome 后，访问 `https://research.google/ai-quests/intl/en_gb`，逐项核对：

- [ ] 首页「Accept mission」变成「接受任务」
- [ ] 地图页的「Start Quest」变成「开始任务」
- [ ] 点开 Flood Forecasting，开场 cinematic 第一句字幕是「糟糕……我们麻烦大了。」
- [ ] Skye 开场独白首句是「欢迎来到 AI 探索之旅」
- [ ] 右侧细条可见，点开展开伴读面板，能切章节、翻术语卡
- [ ] 关闭浏览器再打开，折叠偏好保留
