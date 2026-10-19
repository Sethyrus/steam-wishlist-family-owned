import { describe, expect, it } from 'vitest';
import { buildOwnershipIndex } from '../src/lib/ownership';

const ME = '1';
describe('buildOwnershipIndex', () => {
  it('excluye al propio usuario y a los juegos que solo tiene él', () => {
    const idx = buildOwnershipIndex(
      [
        { appid: 10, owner_steamids: [ME], exclude_reason: 0 },
        { appid: 20, owner_steamids: [ME, '2'], exclude_reason: 0 },
        { appid: 30, name: 'Treinta', owner_steamids: ['2', '3'], exclude_reason: 0 },
      ],
      ME,
    );
    expect(idx['10']).toBeUndefined();
    expect(idx['20']?.owners).toEqual(['2']);
    expect(idx['30']?.owners).toEqual(['2', '3']);
    expect(idx['30']?.name).toBe('Treinta');
  });

  it('marca como excluidos los juegos con exclude_reason', () => {
    const idx = buildOwnershipIndex([{ appid: 40, owner_steamids: ['2'], exclude_reason: 3 }], ME);
    expect(idx['40']?.excluded).toBe(true);
  });
});
