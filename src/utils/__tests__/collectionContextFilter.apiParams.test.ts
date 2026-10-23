import { filterCollectionParams } from '../collectionContextFilter';

describe('filterCollectionParams on API-shaped params (sortDirection)', () => {
  it('resets the sort direction the API reads when a collection-only set sort is dropped', () => {
    const result = filterCollectionParams(
      { sortBy: 'percentageCollected', sortDirection: 'asc' },
      false,
      'sets',
    );

    expect(result).toEqual({ sortBy: 'releasedAt', sortDirection: 'desc' });
  });

  it('resets sortDirection for a collection-only card sort', () => {
    const result = filterCollectionParams({ sortBy: 'quantityReg', sortDirection: 'desc' }, false, 'cards');

    expect(result).toEqual({ sortBy: 'releasedAt', sortDirection: 'asc' });
  });

  it('leaves sortDirection alone for a public sort', () => {
    const result = filterCollectionParams({ sortBy: 'name', sortDirection: 'desc' }, false, 'cards');

    expect(result).toEqual({ sortBy: 'name', sortDirection: 'desc' });
  });
});
