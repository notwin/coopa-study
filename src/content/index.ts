export {}; // make this file a module so `declare global` works

declare global {
  interface Window {
    __coopaStudyMounted?: boolean;
  }
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
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount, { once: true });
} else {
  mount();
}
