import { buildApiParamsFromSearchParams } from '@/utils/searchParamsConverter';
import { BrowseSearchParams } from '@/types/browse';

const setParams = (params: Partial<BrowseSearchParams>) =>
  buildApiParamsFromSearchParams(params as BrowseSearchParams, 'sets') as Record<string, unknown>;

describe('buildApiParamsFromSearchParams — show subsets', () => {
  /**
   * A set counts as a subset if it has a parent OR belongs to a subset group.
   * Secret Lair drops only carry subsetGroupId, so sending parentSetId alone
   * left all of them in the list with the toggle off.
   */
  it('sends both subset predicates when showSubsets is false', () => {
    const apiParams = setParams({ showSubsets: false });

    expect(apiParams).toHaveProperty('parentSetId', null);
    expect(apiParams).toHaveProperty('subsetGroupId', null);
  });

  it('sends neither predicate when showSubsets is true', () => {
    const apiParams = setParams({ showSubsets: true });

    expect(apiParams).not.toHaveProperty('parentSetId');
    expect(apiParams).not.toHaveProperty('subsetGroupId');
  });

  it('sends neither predicate when showSubsets is unset', () => {
    const apiParams = setParams({});

    expect(apiParams).not.toHaveProperty('parentSetId');
    expect(apiParams).not.toHaveProperty('subsetGroupId');
  });

  it('leaves other set filters untouched', () => {
    const apiParams = setParams({ showSubsets: false, name: 'Dominaria' });

    expect(apiParams).toHaveProperty('name', 'Dominaria');
    expect(apiParams).toHaveProperty('parentSetId', null);
    expect(apiParams).toHaveProperty('subsetGroupId', null);
  });

  it('does not add subset predicates to card searches', () => {
    const apiParams = buildApiParamsFromSearchParams(
      { showSubsets: false } as BrowseSearchParams,
      'cards',
    ) as Record<string, unknown>;

    expect(apiParams).not.toHaveProperty('parentSetId');
    expect(apiParams).not.toHaveProperty('subsetGroupId');
  });
});
