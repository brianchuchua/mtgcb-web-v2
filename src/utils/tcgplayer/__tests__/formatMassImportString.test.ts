import { CardModel } from '@/api/browse/types';
import { CardWithQuantity, formatMassImportString } from '@/utils/tcgplayer/formatMassImportString';

const card = (overrides: Partial<CardWithQuantity> = {}): CardWithQuantity =>
  ({
    id: '1',
    name: 'Lightning Bolt',
    setName: 'Alpha',
    setCode: 'LEA',
    rarity: 'common',
    tcgplayerName: null,
    tcgplayerSetCode: 'LEA',
    ...overrides,
  }) as CardWithQuantity;

describe('formatMassImportString', () => {
  it('returns an empty string for no cards', () => {
    expect(formatMassImportString([])).toBe('');
    expect(formatMassImportString(null as unknown as CardModel[])).toBe('');
  });

  it('formats one line per card joined by ||', () => {
    expect(
      formatMassImportString([card(), card({ name: 'Counterspell', tcgplayerSetCode: '2ED' })]),
    ).toBe('1 Lightning Bolt [LEA]||1 Counterspell [2ED]');
  });

  it('prefers the TCGPlayer name', () => {
    expect(formatMassImportString([card({ name: 'Bolt', tcgplayerName: 'Lightning Bolt (Retro)' })])).toBe(
      '1 Lightning Bolt (Retro) [LEA]',
    );
  });

  it('never falls back to the MTG CB set code or name', () => {
    expect(formatMassImportString([card({ tcgplayerSetCode: null })])).toBe('1 Lightning Bolt [Unknown Set Code]');
  });

  it('uses the given quantity', () => {
    expect(formatMassImportString([card()], 3)).toBe('3 Lightning Bolt [LEA]');
  });

  it('uses neededQuantity over everything else', () => {
    expect(formatMassImportString([card({ neededQuantity: 2 })], 5, true)).toBe('2 Lightning Bolt [LEA]');
    expect(formatMassImportString([card({ neededQuantity: 0 })], 5)).toBe('0 Lightning Bolt [LEA]');
  });

  it.each([
    ['common', 'standard', 4],
    ['Common', 'standard', 4],
    ['uncommon', 'standard', 4],
    ['uncommon', 'two-uncommon', 2],
    ['common', 'two-uncommon', 4],
    ['rare', 'standard', 1],
    ['mythic', 'two-uncommon', 1],
    ['special', 'standard', 1],
  ] as const)('draft cube %s (%s) gets %p copies', (rarity, variant, expected) => {
    expect(formatMassImportString([card({ rarity })], 9, true, variant)).toBe(`${expected} Lightning Bolt [LEA]`);
  });

  it('ignores rarity outside draft cube mode', () => {
    expect(formatMassImportString([card({ rarity: 'common' })], 2)).toBe('2 Lightning Bolt [LEA]');
  });

  it('uses the given quantity in draft cube mode when rarity is missing', () => {
    expect(formatMassImportString([card({ rarity: '' })], 7, true)).toBe('7 Lightning Bolt [LEA]');
  });
});
