import { defineManifest } from '@crxjs/vite-plugin';

export default defineManifest({
  manifest_version: 3,
  name: 'Coopa Study · AI Quests 中文伴读',
  description: '把 Google AI Quests 的 UI 和字幕原位汉化，并提供中文伴读面板。',
  version: '0.2.0',
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
  // declarativeNetRequestWithHostAccess 多出 modifyHeaders 能力，用来剥掉 research.google 的严格
  // CSP（`script-src 'self'`），否则 MV3 content script 对插件内 JS 的 dynamic import 会被拦住。
  // 权限作用域受 host_permissions 限制。
  permissions: ['declarativeNetRequestWithHostAccess'],
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
      resources: ['content-zh/*', 'assets/*'],
      matches: ['https://research.google/*']
    }
  ]
});
