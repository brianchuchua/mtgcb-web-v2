import pluralize from '../pluralize';

describe('pluralize', () => {
  describe('default plural form (appends "s")', () => {
    it('returns singular for count of 1', () => {
      expect(pluralize(1, 'card')).toBe('card');
    });

    it('returns plural for count of 0', () => {
      expect(pluralize(0, 'card')).toBe('cards');
    });

    it('returns plural for count > 1', () => {
      expect(pluralize(2, 'card')).toBe('cards');
      expect(pluralize(9999, 'card')).toBe('cards');
    });

    it('returns plural for negative counts', () => {
      expect(pluralize(-1, 'card')).toBe('cards');
      expect(pluralize(-5, 'card')).toBe('cards');
    });
  });

  describe('explicit plural form', () => {
    it('uses provided plural for count != 1', () => {
      expect(pluralize(2, 'entry', 'entries')).toBe('entries');
      expect(pluralize(0, 'entry', 'entries')).toBe('entries');
    });

    it('uses singular for count of 1 even when plural is provided', () => {
      expect(pluralize(1, 'entry', 'entries')).toBe('entry');
    });
  });

  describe('typical usage in app messages', () => {
    it('produces grammatically correct toast messages', () => {
      expect(`Updated ${1} ${pluralize(1, 'card')}`).toBe('Updated 1 card');
      expect(`Updated ${5} ${pluralize(5, 'card')}`).toBe('Updated 5 cards');
      expect(`Updated ${0} ${pluralize(0, 'card')}`).toBe('Updated 0 cards');
    });

    it('handles irregular plurals like entry/entries', () => {
      expect(`Deleted ${1} collection ${pluralize(1, 'entry', 'entries')}`).toBe(
        'Deleted 1 collection entry',
      );
      expect(`Deleted ${3} collection ${pluralize(3, 'entry', 'entries')}`).toBe(
        'Deleted 3 collection entries',
      );
    });
  });
});
