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
      resources: ['content-zh/*', 'assets/*'],
      matches: ['https://research.google/*']
    }
  ]
});
