import { extractSetCellValue } from '@/components/sets/SetTableRenderer';
import { Set } from '@/types/sets';

const makeSet = (overrides: Partial<Set> = {}) =>
  ({
    id: '1',
    name: 'Limited Edition Alpha',
    code: 'LEA',
    slug: 'alpha',
    setType: 'core',
    category: 'Normal',
    releasedAt: '1993-08-05',
    cardCount: '295',
    isDraftable: true,
    ...overrides,
  }) as Set;

describe('extractSetCellValue', () => {
  it('returns the plain text fields', () => {
    const set = makeSet();
    expect(extractSetCellValue(set, 'code')).toBe('LEA');
    expect(extractSetCellValue(set, 'name')).toBe('Limited Edition Alpha');
    expect(extractSetCellValue(set, 'cardCount')).toBe('295');
    expect(extractSetCellValue(set, 'category')).toBe('Normal');
  });

  it('formats the release date as YYYY-MM-DD', () => {
    expect(extractSetCellValue(makeSet({ releasedAt: '1993-08-05' }), 'releasedAt')).toBe('1993-08-05');
  });

  it('rolls a noon-or-later timestamp forward to the intended day', () => {
    expect(extractSetCellValue(makeSet({ releasedAt: '2024-02-08 12:00:00' }), 'releasedAt')).toBe('2024-02-09');
  });

  it('capitalises the set type and replaces underscores', () => {
    expect(extractSetCellValue(makeSet({ setType: 'draft_innovation' }), 'setType')).toBe('Draft innovation');
    expect(extractSetCellValue(makeSet({ setType: 'from_the_vault' }), 'setType')).toBe('From the vault');
  });

  it('writes Unknown for a missing set type', () => {
    expect(extractSetCellValue(makeSet({ setType: null }), 'setType')).toBe('Unknown');
  });

  it('writes Yes or No for draftable', () => {
    expect(extractSetCellValue(makeSet({ isDraftable: true }), 'isDraftable')).toBe('Yes');
    expect(extractSetCellValue(makeSet({ isDraftable: false }), 'isDraftable')).toBe('No');
  });

  it('writes empty strings for missing values', () => {
    const set = makeSet({ code: '', name: '', cardCount: null, releasedAt: null, category: null });
    expect(extractSetCellValue(set, 'code')).toBe('');
    expect(extractSetCellValue(set, 'name')).toBe('');
    expect(extractSetCellValue(set, 'cardCount')).toBe('');
    expect(extractSetCellValue(set, 'releasedAt')).toBe('');
    expect(extractSetCellValue(set, 'category')).toBe('');
  });

  it('keeps a zero card count', () => {
    expect(extractSetCellValue(makeSet({ cardCount: '0' }), 'cardCount')).toBe('0');
  });

  it('writes an empty string for an unknown column', () => {
    expect(extractSetCellValue(makeSet(), 'percentageCollected')).toBe('');
  });
});
