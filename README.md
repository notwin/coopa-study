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
