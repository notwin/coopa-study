import { describe, it, expect, beforeEach } from 'vitest';
import { readCollapsed, writeCollapsed } from '../src/sidebar/storage';

beforeEach(() => { localStorage.clear(); });

describe('storage', () => {
  it('空 localStorage 读到 true（默认折叠）', () => {
    expect(readCollapsed()).toBe(true);
  });

  it('写 false 后读到 false', () => {
    writeCollapsed(false);
    expect(readCollapsed()).toBe(false);
  });

  it('localStorage 抛错时 fallback 返回 true 不炸', () => {
    const orig = Storage.prototype.getItem;
    Storage.prototype.getItem = () => { throw new Error('no'); };
    try {
      expect(readCollapsed()).toBe(true);
    } finally {
      Storage.prototype.getItem = orig;
    }
  });
});
