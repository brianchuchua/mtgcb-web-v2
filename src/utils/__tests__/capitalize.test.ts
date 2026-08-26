import capitalize from '@/utils/capitalize';

describe('capitalize', () => {
  it('passes null and undefined straight through', () => {
    expect(capitalize(null)).toBeNull();
  });

  it('handles the empty string', () => {
    expect(capitalize('')).toBe('');
  });

  describe('single words (card rarity, set category) — unchanged behaviour', () => {
    it.each([
      ['mythic', 'Mythic'],
      ['rare', 'Rare'],
      ['Unknown', 'Unknown'],
      ['Normal', 'Normal'],
      ['Sealed', 'Sealed'],
      ['List', 'List'],
    ])('%s -> %s', (input, expected) => {
      expect(capitalize(input)).toBe(expected);
    });
  });

  describe('set types', () => {
    it('keeps an already-spaced set type title-cased', () => {
      // Regression: this used to render "Secret lair" in "Sealed Set - Secret lair".
      expect(capitalize('Secret Lair')).toBe('Secret Lair');
    });

    it('turns underscore tokens into spaced words', () => {
      expect(capitalize('draft_innovation')).toBe('Draft Innovation');
      expect(capitalize('from_the_vault')).toBe('From The Vault');
      expect(capitalize('premium_deck')).toBe('Premium Deck');
    });

    it('normalises odd casing', () => {
      expect(capitalize('SECRET LAIR')).toBe('Secret Lair');
      expect(capitalize('sEcReT_lAiR')).toBe('Secret Lair');
    });

    it('collapses runs of separators', () => {
      expect(capitalize('core__set')).toBe('Core Set');
      expect(capitalize('  spaced  out  ')).toBe('Spaced Out');
    });
  });
});
