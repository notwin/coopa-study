export {}; // make this file a module so `declare global` works

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
