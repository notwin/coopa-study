import { describe, it, expect } from 'vitest';
import { companionPackSchema } from '../../src/schema/companion-pack';

describe('companionPackSchema', () => {
  it('接受最小合法 pack', () => {
    const pack = {
      questId: 'flood-forecasting',
      questTitle: '洪水预测',
      version: '0.1.0',
      chapters: [
        {
          id: 'ch1',
          title: '第一关',
          summary: '测试摘要',
          blocks: [{ type: 'tip', body: '加油' }]
        }
      ]
    };
    expect(companionPackSchema.parse(pack)).toEqual(pack);
  });

  it('拒绝未知 block type', () => {
    const bad = {
      questId: 'x',
      questTitle: 'x',
      version: '0.1.0',
      chapters: [{ id: 'c', title: 't', summary: 's', blocks: [{ type: 'unknown' }] }]
    };
    expect(() => companionPackSchema.parse(bad)).toThrow();
  });

  it('接受 explainer / term / tip', () => {
    const pack = {
      questId: 'x',
      questTitle: 'x',
      version: '0.1.0',
      chapters: [
        {
          id: 'c', title: 't', summary: 's',
          blocks: [
            { type: 'explainer', title: 'T', body: 'B' },
            { type: 'term', term: '术语', en: 'term', definition: 'D', analogy: 'A' },
            { type: 'tip', body: '提示' }
          ]
        }
      ]
    };
    expect(companionPackSchema.parse(pack).chapters[0]!.blocks.length).toBe(3);
  });
});
