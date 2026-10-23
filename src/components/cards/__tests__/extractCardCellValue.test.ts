/**
 * Unit tests for extractCardCellValue — the per-cell extractor behind the table view's
 * CSV export and copy-to-clipboard buttons.
 */

import { CardItemProps } from '../CardItem';
import { PriceType } from '@/types/pricing';
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

  describe('price columns', () => {
    it('exports the fallback price the table shows when the chosen type is missing', () => {
      const card = makeCard({ market: null, low: '81421.00', foil: null } as Partial<CardItemProps>);

      expect(extractCardCellValue(card, 'market', PriceType.Market)).toBe(81421);
    });

    it('exports the chosen price type when it exists', () => {
      const card = makeCard({ market: '2.50', low: '1.00' } as Partial<CardItemProps>);

      expect(extractCardCellValue(card, 'market', PriceType.Market)).toBe(2.5);
      expect(extractCardCellValue(card, 'low', PriceType.Low)).toBe(1);
    });

    it('leaves a price column blank when it is not the selected price type', () => {
      const card = makeCard({ market: '2.50', low: '1.00' } as Partial<CardItemProps>);

      expect(extractCardCellValue(card, 'low', PriceType.Market)).toBe('');
    });

    it('exports blank when the card has no price', () => {
      expect(extractCardCellValue(makeCard(), 'market', PriceType.Market)).toBe('');
    });

    it('exports the foil price regardless of price type', () => {
      const card = makeCard({ foil: '12.00' } as Partial<CardItemProps>);

      expect(extractCardCellValue(card, 'foil', PriceType.Low)).toBe(12);
    });
  });
});
