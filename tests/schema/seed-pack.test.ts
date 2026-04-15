import { describe, it, expect } from 'vitest';
import { companionPackSchema } from '../../src/schema/companion-pack';
import pack from '../../src/companion-packs/flood-forecasting.json';

describe('flood-forecasting companion pack', () => {
  it('符合 schema', () => {
    expect(() => companionPackSchema.parse(pack)).not.toThrow();
  });

  it('有至少 2 章', () => {
    expect(companionPackSchema.parse(pack).chapters.length).toBeGreaterThanOrEqual(2);
  });
});
