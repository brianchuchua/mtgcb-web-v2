import { filterCollectionParams } from '@/utils/collectionContextFilter';

describe('filterCollectionParams', () => {
  it('returns the same object in a collection context', () => {
    const params = { selectedGoalId: 1, sortBy: 'quantityAll' };

    expect(filterCollectionParams(params, true, 'cards')).toBe(params);
  });

  it('strips collection-only card fields outside a collection', () => {
    const params = {
      name: 'Bolt',
      selectedGoalId: 1,
      selectedLocationId: 2,
      quantityAll: { AND: ['>=1'] },
      quantityFoil: { AND: ['>=1'] },
      quantityReg: { AND: ['>=1'] },
      completionStatus: { include: ['complete'] },
    };

    expect(filterCollectionParams(params, false, 'cards')).toEqual({
      name: 'Bolt',
      completionStatus: { include: ['complete'] },
    });
  });

  it('strips collection-only set fields outside a collection', () => {
    const params = {
      name: 'Zendikar',
      selectedGoalId: 1,
      selectedLocationId: 2,
      completionStatus: { include: ['complete'] },
      quantityAll: 'kept for sets',
    };

    expect(filterCollectionParams(params, false, 'sets')).toEqual({
      name: 'Zendikar',
      quantityAll: 'kept for sets',
    });
  });

  it.each(['quantityAll', 'quantityFoil', 'quantityReg'])(
    'resets the card sort %s to release date ascending',
    (sortBy) => {
      expect(filterCollectionParams({ sortBy, sortOrder: 'desc' }, false, 'cards')).toEqual({
        sortBy: 'releasedAt',
        sortOrder: 'asc',
      });
    },
  );

  it.each(['percentageCollected', 'totalValue', 'costToComplete.oneOfEachCard'])(
    'resets the set sort %s to release date descending',
    (sortBy) => {
      expect(filterCollectionParams({ sortBy, sortOrder: 'asc' }, false, 'sets')).toEqual({
        sortBy: 'releasedAt',
        sortOrder: 'desc',
      });
    },
  );

  it('keeps public sorts untouched', () => {
    expect(filterCollectionParams({ sortBy: 'name', sortOrder: 'desc' }, false, 'cards')).toEqual({
      sortBy: 'name',
      sortOrder: 'desc',
    });
    expect(filterCollectionParams({ sortBy: 'quantityAll', sortOrder: 'desc' }, false, 'sets')).toEqual({
      sortBy: 'quantityAll',
      sortOrder: 'desc',
    });
  });

  it('does not mutate the input', () => {
    const params = { selectedGoalId: 1, sortBy: 'quantityAll' };
    filterCollectionParams(params, false, 'cards');

    expect(params).toEqual({ selectedGoalId: 1, sortBy: 'quantityAll' });
  });
});
