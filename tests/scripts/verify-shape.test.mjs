import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';

describe('verify-shape', () => {
  it('当前 content-zh 与 content-source 对齐', () => {
    const out = execSync('node scripts/verify-shape.mjs', { encoding: 'utf8' });
    expect(out).toMatch(/shape OK/);
  });
});
