import { RootState } from '@/redux/rootReducer';
import browseReducer from '@/redux/slices/browse/browseSlice';
import {
  getCardsPreferences,
  getPreferencesForView,
  getSetsPreferences,
  getViewContentTypePreference,
} from '@/redux/slices/browse/preferences';
import {
  selectCardCurrentPage,
  selectCardPageSize,
  selectCurrentPage,
  selectFormatsLegalIncludeBanned,
  selectIncludeChildLocations,
  selectIncludeSubsetsInSets,
  selectPageSize,
  selectSearchName,
  selectSearchParams,
  selectSelectedGoalId,
  selectSelectedLocationId,
  selectSetCurrentPage,
  selectSetPageSize,
  selectShowGoals,
  selectShowSubsets,
  selectSortBy,
  selectSortOrder,
} from '@/redux/slices/browse/selectors';
import { BrowseSearchParams, BrowseState } from '@/types/browse';

const rootWith = (
  cards: BrowseSearchParams,
  sets: BrowseSearchParams,
  viewContentType: 'cards' | 'sets' = 'cards',
) => ({ browse: { cardsSearchParams: cards, setsSearchParams: sets, viewContentType } }) as unknown as RootState;

describe('browse selectors — defaults', () => {
  const empty = rootWith({}, {});

  it('defaults paging to page 1 and 20 per page', () => {
    expect(selectCardCurrentPage(empty)).toBe(1);
    expect(selectCardPageSize(empty)).toBe(20);
    expect(selectSetCurrentPage(empty)).toBe(1);
    expect(selectSetPageSize(empty)).toBe(20);
    expect(selectCurrentPage(empty)).toBe(1);
    expect(selectPageSize(empty)).toBe(20);
  });

  it('treats an unset showSubsets as on, and only false as off', () => {
    expect(selectShowSubsets(empty)).toBe(true);
    expect(selectShowSubsets(rootWith({}, { showSubsets: true }))).toBe(true);
    expect(selectShowSubsets(rootWith({}, { showSubsets: false }))).toBe(false);
  });

  it('coerces optional booleans to false', () => {
    expect(selectIncludeSubsetsInSets(empty)).toBe(false);
    expect(selectFormatsLegalIncludeBanned(empty)).toBe(false);
    expect(selectIncludeChildLocations(empty)).toBe(false);
  });

  it('defaults showGoals to all', () => {
    expect(selectShowGoals(empty)).toBe('all');
  });
});

describe('browse selectors — follow the active view', () => {
  const cards: BrowseSearchParams = {
    name: 'Bolt',
    sortBy: 'name',
    sortOrder: 'desc',
    currentPage: 3,
    pageSize: 50,
    selectedGoalId: 1,
    selectedLocationId: 11,
    showGoals: 'complete',
    includeChildLocations: true,
  };
  const sets: BrowseSearchParams = {
    name: 'Alpha',
    sortBy: 'releasedAt',
    sortOrder: 'asc',
    currentPage: 6,
    pageSize: 100,
    selectedGoalId: 2,
    selectedLocationId: 22,
    showGoals: 'incomplete',
  };

  it('reads from the cards view when it is active', () => {
    const state = rootWith(cards, sets, 'cards');
    expect(selectSearchParams(state)).toBe(cards);
    expect(selectSearchName(state)).toBe('Bolt');
    expect(selectSortBy(state)).toBe('name');
    expect(selectSortOrder(state)).toBe('desc');
    expect(selectCurrentPage(state)).toBe(3);
    expect(selectPageSize(state)).toBe(50);
    expect(selectSelectedGoalId(state)).toBe(1);
    expect(selectSelectedLocationId(state)).toBe(11);
    expect(selectShowGoals(state)).toBe('complete');
    expect(selectIncludeChildLocations(state)).toBe(true);
  });

  it('reads from the sets view when it is active', () => {
    const state = rootWith(cards, sets, 'sets');
    expect(selectSearchParams(state)).toBe(sets);
    expect(selectSearchName(state)).toBe('Alpha');
    expect(selectSortBy(state)).toBe('releasedAt');
    expect(selectSortOrder(state)).toBe('asc');
    expect(selectCurrentPage(state)).toBe(6);
    expect(selectPageSize(state)).toBe(100);
    expect(selectSelectedGoalId(state)).toBe(2);
    expect(selectSelectedLocationId(state)).toBe(22);
    expect(selectShowGoals(state)).toBe('incomplete');
    expect(selectIncludeChildLocations(state)).toBe(false);
  });

  it('works against real reducer output', () => {
    const browse = browseReducer(undefined, { type: '@@INIT' }) as BrowseState;
    const state = { browse } as unknown as RootState;
    expect(selectSortOrder(state)).toBe('desc');
    expect(selectShowSubsets(state)).toBe(true);
  });
});

describe('browse preferences', () => {
  beforeEach(() => localStorage.clear());

  it('returns defaults when nothing is stored', () => {
    expect(getCardsPreferences()).toEqual({ sortBy: 'releasedAt', sortOrder: 'asc', oneResultPerCardName: false });
    expect(getSetsPreferences()).toEqual({
      sortBy: 'releasedAt',
      sortOrder: 'desc',
      showSubsets: true,
      includeSubsetsInSets: false,
    });
    expect(getViewContentTypePreference()).toBe('sets');
  });

  it('reads JSON-encoded values from the mtgcb_preferred_* keys', () => {
    localStorage.setItem('mtgcb_preferred_sort_by_cards', JSON.stringify('name'));
    localStorage.setItem('mtgcb_preferred_sort_order_cards', JSON.stringify('desc'));
    localStorage.setItem('mtgcb_preferred_one_result_per_card', 'true');
    localStorage.setItem('mtgcb_preferred_sort_by_sets', JSON.stringify('code'));
    localStorage.setItem('mtgcb_preferred_sort_order_sets', JSON.stringify('asc'));
    localStorage.setItem('mtgcb_preferred_show_subsets', 'false');
    localStorage.setItem('mtgcb_preferred_include_subsets_in_sets', 'true');
    localStorage.setItem('mtgcb_preferred_view_content_type', JSON.stringify('cards'));

    expect(getCardsPreferences()).toEqual({ sortBy: 'name', sortOrder: 'desc', oneResultPerCardName: true });
    expect(getSetsPreferences()).toEqual({
      sortBy: 'code',
      sortOrder: 'asc',
      showSubsets: false,
      includeSubsetsInSets: true,
    });
    expect(getViewContentTypePreference()).toBe('cards');
  });

  it('falls back to defaults for values that are not valid JSON', () => {
    localStorage.setItem('mtgcb_preferred_sort_by_cards', 'name');
    localStorage.setItem('mtgcb_preferred_show_subsets', '{oops');

    expect(getCardsPreferences().sortBy).toBe('releasedAt');
    expect(getSetsPreferences().showSubsets).toBe(true);
  });

  it('picks the right set for each view', () => {
    localStorage.setItem('mtgcb_preferred_sort_order_sets', JSON.stringify('asc'));
    expect(getPreferencesForView('cards')).toEqual(getCardsPreferences());
    expect(getPreferencesForView('sets')).toEqual(getSetsPreferences());
    expect(getPreferencesForView('sets').sortOrder).toBe('asc');
  });
});
