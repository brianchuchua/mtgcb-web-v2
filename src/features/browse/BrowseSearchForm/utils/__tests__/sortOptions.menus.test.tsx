import { render, screen } from '@testing-library/react';
import { ReactElement } from 'react';
import { getCardSortOptions, getSetSortOptions } from '../sortOptions';

const values = (items: ReactElement[]) => items.map((item) => (item.props as { value: string }).value);

const BASE_CARD_SORTS = [
  'name',
  'releasedAt',
  'collectorNumber',
  'mtgcbCollectorNumber',
  'rarityNumeric',
  'type',
  'artist',
  'powerNumeric',
  'toughnessNumeric',
  'loyaltyNumeric',
  'convertedManaCost',
  'market',
  'low',
  'average',
  'high',
  'foil',
];

const BASE_SET_SORTS = ['name', 'code', 'releasedAt', 'cardCount', 'setType', 'category', 'isDraftable'];

describe('getCardSortOptions', () => {
  it('lists the public card sorts in order', () => {
    expect(values(getCardSortOptions(() => false, false))).toEqual(BASE_CARD_SORTS);
  });

  it('adds quantity sorts on collection pages only', () => {
    expect(values(getCardSortOptions(() => false, true))).toEqual([
      ...BASE_CARD_SORTS,
      'quantityReg',
      'quantityFoil',
      'quantityAll',
    ]);
  });

  it('asks about a price mismatch for each non-foil price sort', () => {
    const isPriceMismatched = jest.fn().mockReturnValue(false);
    getCardSortOptions(isPriceMismatched, false);
    expect(isPriceMismatched.mock.calls.map(([option]) => option)).toEqual(['market', 'low', 'average', 'high']);
  });

  it('shows the warning tooltip only on mismatched price options', () => {
    const options = getCardSortOptions((option) => option === 'low', false);
    const byValue = (value: string) =>
      options.find((item) => (item.props as { value: string }).value === value) as ReactElement;

    const { container: low } = render(byValue('low'));
    expect(low.querySelector('[data-testid="WarningAmberIcon"]')).not.toBeNull();

    const { container: market } = render(byValue('market'));
    expect(market.querySelector('[data-testid="WarningAmberIcon"]')).toBeNull();
  });

  it('labels the price menu items', () => {
    const options = getCardSortOptions(() => false, false);
    render(<>{options.filter((item) => ['market', 'foil'].includes((item.props as { value: string }).value))}</>);
    expect(screen.getByText('Price (Market)')).toBeInTheDocument();
    expect(screen.getByText('Price (Foil)')).toBeInTheDocument();
  });
});

describe('getSetSortOptions', () => {
  it('lists the public set sorts in order', () => {
    expect(values(getSetSortOptions(false))).toEqual(BASE_SET_SORTS);
  });

  it('adds collection sorts on collection pages only', () => {
    expect(values(getSetSortOptions(true))).toEqual([
      ...BASE_SET_SORTS,
      'percentageCollected',
      'totalValue',
      'costToComplete.oneOfEachCard',
    ]);
  });
});
