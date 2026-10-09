/**
 * Unit tests for extractCardCellValue — the per-cell extractor behind the table view's
 * CSV export and copy-to-clipboard buttons.
 */

import { CardItemProps } from '../CardItem';
import { extractCardCellValue } from '../CardTableRenderer';

const makeCard = (overrides: Partial<CardItemProps> = {}): CardItemProps =>
  ({
    id: '1',
    name: 'Giant Spider',
    ...overrides,
  }) as CardItemProps;

describe('extractCardCellValue', () => {
  describe('locations', () => {
    it('exports each location by name with its quantities', () => {
      const card = makeCard({
        locations: [
          { locationId: 1, locationName: 'Binder A', description: null, quantityReg: 1, quantityFoil: 0 },
          { locationId: 2, locationName: 'Deck Box', description: null, quantityReg: 0, quantityFoil: 2 },
        ],
      });

      expect(extractCardCellValue(card, 'locations')).toBe('Binder A (R:1 F:0); Deck Box (R:0 F:2)');
    });

    it('never exports "undefined" as a location name', () => {
      const card = makeCard({
        locations: [{ locationId: 1, locationName: 'Binder A', description: null, quantityReg: 1, quantityFoil: 0 }],
      });

      expect(extractCardCellValue(card, 'locations')).not.toContain('undefined');
    });

    it('exports an empty string when the card has no locations', () => {
      expect(extractCardCellValue(makeCard({ locations: [] }), 'locations')).toBe('');
      expect(extractCardCellValue(makeCard(), 'locations')).toBe('');
    });
  });
});
