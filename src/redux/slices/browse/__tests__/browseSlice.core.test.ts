import browseReducer, {
  clearSelectedGoal,
  clearSelectedLocation,
  resetAllSearches,
  resetSearch,
  setArtist,
  setCardPagination,
  setCardSearchName,
  setCardSearchParams,
  setColors,
  setCompletionStatus,
  setFormatsLegal,
  setFormatsLegalIncludeBanned,
  setIncludeBadDataOnly,
  setIncludeChildLocations,
  setIncludeSubsetsInSet,
  setLayouts,
  setOneResultPerCardName,
  setOracleText,
  setPagination,
  setRarities,
  setSearchName,
  setSelectedGoalId,
  setSelectedLocationId,
  setSetCategories,
  setSetCode,
  setSetPagination,
  setSetSearchName,
  setSetSearchParams,
  setSetTypes,
  setSets,
  setShowGoals,
  setShowSubsets,
  setSortBy,
  setSortOrder,
  setStats,
  setTypes,
  setViewContentType,
} from '@/redux/slices/browse/browseSlice';
import { BrowseState } from '@/types/browse';

const initial = () => browseReducer(undefined, { type: '@@INIT' }) as BrowseState;

const withView = (view: 'cards' | 'sets') => browseReducer(initial(), setViewContentType(view));

const reduce = (state: BrowseState, ...actions: Parameters<typeof browseReducer>[1][]) =>
  actions.reduce((acc, action) => browseReducer(acc, action), state);

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe('browseSlice — initial state', () => {
  it('starts on the sets view with default paging and sorts', () => {
    expect(initial()).toEqual({
      cardsSearchParams: { currentPage: 1, pageSize: 20, viewMode: 'grid', sortBy: 'releasedAt', sortOrder: 'asc' },
      setsSearchParams: {
        currentPage: 1,
        pageSize: 20,
        viewMode: 'grid',
        showSubsets: true,
        includeSubsetsInSets: false,
        sortBy: 'releasedAt',
        sortOrder: 'desc',
      },
      viewContentType: 'sets',
    });
  });
});

describe('browseSlice — view-scoped reducers', () => {
  it('setSearchName writes to whichever view is active', () => {
    const cards = browseReducer(withView('cards'), setSearchName('Bolt'));
    expect(cards.cardsSearchParams.name).toBe('Bolt');
    expect(cards.setsSearchParams.name).toBeUndefined();

    const sets = browseReducer(withView('sets'), setSearchName('Alpha'));
    expect(sets.setsSearchParams.name).toBe('Alpha');
    expect(sets.cardsSearchParams.name).toBeUndefined();
  });

  it('setSearchName with an empty string removes the key', () => {
    const state = reduce(withView('cards'), setSearchName('Bolt'), setSearchName(''));
    expect(state.cardsSearchParams).not.toHaveProperty('name');
  });

  it('setSortBy and setSortOrder write to the active view only', () => {
    const cards = reduce(withView('cards'), setSortBy('name'), setSortOrder('desc'));
    expect(cards.cardsSearchParams).toMatchObject({ sortBy: 'name', sortOrder: 'desc' });
    expect(cards.setsSearchParams).toMatchObject({ sortBy: 'releasedAt', sortOrder: 'desc' });

    const sets = reduce(withView('sets'), setSortBy('code' as never), setSortOrder('asc'));
    expect(sets.setsSearchParams).toMatchObject({ sortBy: 'code', sortOrder: 'asc' });
    expect(sets.cardsSearchParams).toMatchObject({ sortBy: 'releasedAt', sortOrder: 'asc' });
  });

  it('setPagination merges only the provided fields into the active view', () => {
    const cards = browseReducer(withView('cards'), setPagination({ currentPage: 4 }));
    expect(cards.cardsSearchParams).toMatchObject({ currentPage: 4, pageSize: 20, viewMode: 'grid' });
    expect(cards.setsSearchParams.currentPage).toBe(1);

    const sets = browseReducer(withView('sets'), setPagination({ pageSize: 50, viewMode: 'table' }));
    expect(sets.setsSearchParams).toMatchObject({ currentPage: 1, pageSize: 50, viewMode: 'table' });
    expect(sets.cardsSearchParams.pageSize).toBe(20);
  });

  it('setCardPagination and setSetPagination ignore the active view', () => {
    const state = reduce(withView('sets'), setCardPagination({ currentPage: 3 }), setSetPagination({ pageSize: 100 }));
    expect(state.cardsSearchParams.currentPage).toBe(3);
    expect(state.setsSearchParams.pageSize).toBe(100);
    expect(state.setsSearchParams.currentPage).toBe(1);
  });
});

describe('browseSlice — explicit text reducers', () => {
  it.each([
    ['setCardSearchName', setCardSearchName, 'cardsSearchParams', 'name'],
    ['setSetSearchName', setSetSearchName, 'setsSearchParams', 'name'],
    ['setSetCode', setSetCode, 'setsSearchParams', 'code'],
    ['setOracleText', setOracleText, 'cardsSearchParams', 'oracleText'],
    ['setArtist', setArtist, 'cardsSearchParams', 'artist'],
  ] as const)('%s stores a value and deletes the key on empty', (_, action, bucket, key) => {
    const stored = browseReducer(initial(), action('abc'));
    expect(stored[bucket][key]).toBe('abc');

    const cleared = browseReducer(stored, action(''));
    expect(cleared[bucket]).not.toHaveProperty(key);
  });
});

describe('browseSlice — include/exclude reducers', () => {
  const filled = { include: ['a'], exclude: ['b'] };
  const empty = { include: [], exclude: [] };

  it.each([
    ['setTypes', setTypes, 'cardsSearchParams', 'types'],
    ['setLayouts', setLayouts, 'cardsSearchParams', 'layouts'],
    ['setRarities', setRarities, 'cardsSearchParams', 'rarities'],
    ['setSets', setSets, 'cardsSearchParams', 'sets'],
    ['setFormatsLegal', setFormatsLegal, 'cardsSearchParams', 'formatsLegal'],
    ['setSetCategories', setSetCategories, 'setsSearchParams', 'setCategories'],
    ['setSetTypes', setSetTypes, 'setsSearchParams', 'setTypes'],
    ['setCompletionStatus', setCompletionStatus, 'setsSearchParams', 'completionStatus'],
  ] as const)('%s stores a selection and deletes the key when emptied', (_, action, bucket, key) => {
    const stored = browseReducer(initial(), action(filled));
    expect(stored[bucket][key]).toEqual(filled);

    const otherBucket = bucket === 'cardsSearchParams' ? 'setsSearchParams' : 'cardsSearchParams';
    expect(stored[otherBucket]).not.toHaveProperty(key);

    expect(browseReducer(stored, action(empty))[bucket]).not.toHaveProperty(key);
  });

  it('keeps an exclude-only selection', () => {
    const state = browseReducer(initial(), setTypes({ include: [], exclude: ['Land'] }));
    expect(state.cardsSearchParams.types).toEqual({ include: [], exclude: ['Land'] });
  });
});

describe('browseSlice — colors and stats', () => {
  it('stores colours and deletes them when nothing is chosen', () => {
    const stored = browseReducer(initial(), setColors({ colors: ['W'], matchType: 'atLeast' }));
    expect(stored.cardsSearchParams.colors).toEqual({ colors: ['W'], matchType: 'atLeast' });

    const cleared = browseReducer(stored, setColors({ colors: [], matchType: 'atLeast' }));
    expect(cleared.cardsSearchParams).not.toHaveProperty('colors');
  });

  it('keeps a colorless-only selection', () => {
    const state = browseReducer(initial(), setColors({ colors: [], matchType: 'exactly', includeColorless: true }));
    expect(state.cardsSearchParams.colors).toEqual({ colors: [], matchType: 'exactly', includeColorless: true });
  });

  it('stores stats and deletes them when every attribute is empty', () => {
    const stored = browseReducer(initial(), setStats({ powerNumeric: ['gte1'], toughnessNumeric: [] }));
    expect(stored.cardsSearchParams.stats).toEqual({ powerNumeric: ['gte1'], toughnessNumeric: [] });

    const cleared = browseReducer(stored, setStats({ powerNumeric: [] }));
    expect(cleared.cardsSearchParams).not.toHaveProperty('stats');
    expect(browseReducer(stored, setStats({})).cardsSearchParams).not.toHaveProperty('stats');
  });
});

describe('browseSlice — boolean toggles', () => {
  it.each([
    ['setOneResultPerCardName', setOneResultPerCardName, 'oneResultPerCardName'],
    ['setIncludeBadDataOnly', setIncludeBadDataOnly, 'includeBadDataOnly'],
    ['setFormatsLegalIncludeBanned', setFormatsLegalIncludeBanned, 'formatsLegalIncludeBanned'],
  ] as const)('%s stores true and deletes the key on false', (_, action, key) => {
    const on = browseReducer(initial(), action(true));
    expect(on.cardsSearchParams[key]).toBe(true);
    expect(browseReducer(on, action(false)).cardsSearchParams).not.toHaveProperty(key);
  });

  it('stores showSubsets and includeSubsetsInSets as plain values', () => {
    const state = reduce(initial(), setShowSubsets(false), setIncludeSubsetsInSet(true));
    expect(state.setsSearchParams.showSubsets).toBe(false);
    expect(state.setsSearchParams.includeSubsetsInSets).toBe(true);
  });
});

describe('browseSlice — goal and location', () => {
  it('setSelectedGoalId writes to both views and null clears both', () => {
    const stored = browseReducer(initial(), setSelectedGoalId(8));
    expect(stored.cardsSearchParams.selectedGoalId).toBe(8);
    expect(stored.setsSearchParams.selectedGoalId).toBe(8);

    const cleared = browseReducer(stored, setSelectedGoalId(null));
    expect(cleared.cardsSearchParams).not.toHaveProperty('selectedGoalId');
    expect(cleared.setsSearchParams).not.toHaveProperty('selectedGoalId');
  });

  it('clearSelectedGoal also clears showGoals', () => {
    const state = reduce(initial(), setSelectedGoalId(8), setShowGoals('complete'), clearSelectedGoal());
    expect(state.cardsSearchParams).not.toHaveProperty('selectedGoalId');
    expect(state.cardsSearchParams).not.toHaveProperty('showGoals');
    expect(state.setsSearchParams).not.toHaveProperty('showGoals');
  });

  it('setShowGoals writes to both views and "all" clears them', () => {
    const stored = browseReducer(initial(), setShowGoals('incomplete'));
    expect(stored.cardsSearchParams.showGoals).toBe('incomplete');
    expect(stored.setsSearchParams.showGoals).toBe('incomplete');

    const cleared = browseReducer(stored, setShowGoals('all'));
    expect(cleared.cardsSearchParams).not.toHaveProperty('showGoals');
    expect(cleared.setsSearchParams).not.toHaveProperty('showGoals');
  });

  it('setSelectedLocationId writes to both views; null and clearSelectedLocation clear both', () => {
    const stored = browseReducer(initial(), setSelectedLocationId(5));
    expect(stored.cardsSearchParams.selectedLocationId).toBe(5);
    expect(stored.setsSearchParams.selectedLocationId).toBe(5);

    [setSelectedLocationId(null), clearSelectedLocation()].forEach((action) => {
      const cleared = browseReducer(stored, action);
      expect(cleared.cardsSearchParams).not.toHaveProperty('selectedLocationId');
      expect(cleared.setsSearchParams).not.toHaveProperty('selectedLocationId');
    });
  });

  it('setIncludeChildLocations writes to both views', () => {
    const state = browseReducer(initial(), setIncludeChildLocations(true));
    expect(state.cardsSearchParams.includeChildLocations).toBe(true);
    expect(state.setsSearchParams.includeChildLocations).toBe(true);
  });
});

describe('browseSlice — setCardSearchParams / setSetSearchParams', () => {
  it('merges defined values and keeps existing ones', () => {
    const start = reduce(initial(), setArtist('Guay'), setCardPagination({ currentPage: 3, viewMode: 'table' }));
    const state = browseReducer(start, setCardSearchParams({ name: 'Elf', oracleText: undefined }));

    expect(state.cardsSearchParams).toMatchObject({
      name: 'Elf',
      artist: 'Guay',
      currentPage: 3,
      pageSize: 20,
      viewMode: 'table',
    });
    expect(state.cardsSearchParams).not.toHaveProperty('oracleText');
  });

  it('overrides paging when the payload provides it', () => {
    const state = browseReducer(initial(), setSetSearchParams({ currentPage: 2, pageSize: 60, viewMode: 'table' }));
    expect(state.setsSearchParams).toMatchObject({ currentPage: 2, pageSize: 60, viewMode: 'table' });
  });

  it('does not touch the other view', () => {
    const state = browseReducer(initial(), setSetSearchParams({ name: 'Alpha' }));
    expect(state.cardsSearchParams).not.toHaveProperty('name');
    expect(state.setsSearchParams.name).toBe('Alpha');
  });
});

describe('browseSlice — resetSearch', () => {
  const busyCards = () =>
    reduce(
      withView('cards'),
      setCardSearchName('Bolt'),
      setOracleText('damage'),
      setTypes({ include: ['Instant'], exclude: [] }),
      setSortBy('name'),
      setCardPagination({ currentPage: 5, pageSize: 50, viewMode: 'table' }),
      setSelectedGoalId(3),
      setSelectedLocationId(4),
      setSetSearchName('Alpha'),
    );

  it('clears the active view search but keeps paging', () => {
    const state = browseReducer(busyCards(), resetSearch());
    expect(state.cardsSearchParams).toEqual({
      currentPage: 5,
      pageSize: 50,
      viewMode: 'table',
      sortBy: 'releasedAt',
      sortOrder: 'asc',
    });
  });

  it('leaves the other view search alone except goal and location', () => {
    const state = browseReducer(busyCards(), resetSearch());
    expect(state.setsSearchParams.name).toBe('Alpha');
    expect(state.setsSearchParams).not.toHaveProperty('selectedGoalId');
    expect(state.setsSearchParams).not.toHaveProperty('selectedLocationId');
  });

  it('keeps the goal when asked to', () => {
    const state = browseReducer(busyCards(), resetSearch({ preserveGoal: true }));
    expect(state.cardsSearchParams.selectedGoalId).toBe(3);
    expect(state.setsSearchParams.selectedGoalId).toBe(3);
    expect(state.cardsSearchParams).not.toHaveProperty('selectedLocationId');
  });

  it('keeps the location when asked to', () => {
    const state = browseReducer(busyCards(), resetSearch({ preserveLocation: true }));
    expect(state.cardsSearchParams.selectedLocationId).toBe(4);
    expect(state.cardsSearchParams).not.toHaveProperty('selectedGoalId');
  });

  it('restores saved sort preferences rather than hard-coded defaults', () => {
    localStorage.setItem('mtgcb_preferred_sort_by_cards', JSON.stringify('name'));
    localStorage.setItem('mtgcb_preferred_sort_order_cards', JSON.stringify('desc'));
    localStorage.setItem('mtgcb_preferred_one_result_per_card', JSON.stringify(true));

    const state = browseReducer(busyCards(), resetSearch());
    expect(state.cardsSearchParams).toMatchObject({ sortBy: 'name', sortOrder: 'desc', oneResultPerCardName: true });
  });

  it('restores set preferences when resetting the sets view', () => {
    localStorage.setItem('mtgcb_preferred_show_subsets', JSON.stringify(false));
    const start = reduce(withView('sets'), setSetSearchName('Alpha'), setSetCode('LEA'), setShowSubsets(true));

    const state = browseReducer(start, resetSearch());
    expect(state.setsSearchParams).toEqual({
      currentPage: 1,
      pageSize: 20,
      viewMode: 'grid',
      showSubsets: false,
      includeSubsetsInSets: false,
      sortBy: 'releasedAt',
      sortOrder: 'desc',
    });
  });

  it('clears the active view session search state only', () => {
    sessionStorage.setItem('mtgcb_search_state_cards', JSON.stringify({ name: 'Bolt' }));
    sessionStorage.setItem('mtgcb_search_state_sets', JSON.stringify({ name: 'Alpha' }));

    browseReducer(busyCards(), resetSearch());

    expect(sessionStorage.getItem('mtgcb_search_state_cards')).toBeNull();
    expect(sessionStorage.getItem('mtgcb_search_state_sets')).not.toBeNull();
  });
});

describe('browseSlice — resetAllSearches', () => {
  it('clears both views, keeps paging, and leaves session storage alone', () => {
    sessionStorage.setItem('mtgcb_search_state_cards', JSON.stringify({ name: 'Bolt' }));
    const start = reduce(
      initial(),
      setCardSearchName('Bolt'),
      setSetSearchName('Alpha'),
      setSelectedGoalId(2),
      setSetPagination({ currentPage: 7 }),
    );

    const state = browseReducer(start, resetAllSearches());

    expect(state.cardsSearchParams).toEqual({
      currentPage: 1,
      pageSize: 20,
      viewMode: 'grid',
      sortBy: 'releasedAt',
      sortOrder: 'asc',
    });
    expect(state.setsSearchParams).toEqual({
      currentPage: 7,
      pageSize: 20,
      viewMode: 'grid',
      showSubsets: true,
      includeSubsetsInSets: false,
      sortBy: 'releasedAt',
      sortOrder: 'desc',
    });
    expect(sessionStorage.getItem('mtgcb_search_state_cards')).not.toBeNull();
  });
});

describe('browseSlice — setViewContentType', () => {
  it('switches between cards and sets', () => {
    expect(withView('cards').viewContentType).toBe('cards');
    expect(browseReducer(withView('cards'), setViewContentType('sets')).viewContentType).toBe('sets');
  });

  it('returns the same state object when the view does not change', () => {
    const state = initial();
    expect(browseReducer(state, setViewContentType('sets'))).toBe(state);
  });

  it('falls back to cards for an invalid view', () => {
    const state = browseReducer(initial(), setViewContentType('decks' as 'cards'));
    expect(state.viewContentType).toBe('cards');
  });
});
