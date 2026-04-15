const KEY = 'coopa-study.collapsed';

export function readCollapsed(): boolean {
  try {
    const v = localStorage.getItem(KEY);
    if (v === null) return true;
    return v === '1';
  } catch {
    return true;
  }
}

export function writeCollapsed(collapsed: boolean): void {
  try {
    localStorage.setItem(KEY, collapsed ? '1' : '0');
  } catch {
    // 无痕模式等场景静默降级
  }
}
