import { BrowseState } from '@/types/browse';

// The slice computes its initial state once, at import time, from the URL,
// sessionStorage and localStorage, so each case loads a fresh copy of the module.
const loadInitialState = (): BrowseState => {
  let state: BrowseState | undefined;
  jest.isolateModules(() => {
    const reducer = require('@/redux/slices/browse/browseSlice').default;
    state = reducer(undefined, { type: '@@INIT' });
  });
  return state as BrowseState;
};

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  window.history.replaceState(null, '', '/');
});

afterAll(() => {
  window.history.replaceState(null, '', '/');
});

describe('browseSlice — initial state hydration', () => {
  it('uses URL params for both views when present', () => {
    window.history.replaceState(null, '', '/browse?name=Bolt&setName=Alpha&includeTypes=Instant&showSubsets=false');

    const state = loadInitialState();

    expect(state.cardsSearchParams).toMatchObject({ name: 'Bolt', types: { include: ['Instant'], exclude: [] } });
    expect(state.setsSearchParams).toMatchObject({ name: 'Alpha', showSubsets: false });
  });

  it('prefers the URL over sessionStorage', () => {
    sessionStorage.setItem('mtgcb_search_state_cards', JSON.stringify({ name: 'From session' }));
    window.history.replaceState(null, '', '/browse?name=From%20URL');

    expect(loadInitialState().cardsSearchParams.name).toBe('From URL');
  });

  it('falls back to sessionStorage when the URL has no search params', () => {
    sessionStorage.setItem('mtgcb_search_state_cards', JSON.stringify({ artist: 'Guay' }));
    sessionStorage.setItem('mtgcb_search_state_sets', JSON.stringify({ code: 'LEA' }));
    window.history.replaceState(null, '', '/browse?contentType=cards');

    const state = loadInitialState();

    expect(state.cardsSearchParams.artist).toBe('Guay');
    expect(state.setsSearchParams.code).toBe('LEA');
  });

  it('layers stored preferences under the search', () => {
    localStorage.setItem('mtgcb_preferred_sort_by_cards', JSON.stringify('name'));
    localStorage.setItem('mtgcb_preferred_one_result_per_card', 'true');
    localStorage.setItem('mtgcb_preferred_include_subsets_in_sets', 'true');

    const state = loadInitialState();

    expect(state.cardsSearchParams).toMatchObject({ sortBy: 'name', oneResultPerCardName: true });
    expect(state.setsSearchParams.includeSubsetsInSets).toBe(true);
  });

  it('ignores corrupt sessionStorage', () => {
    sessionStorage.setItem('mtgcb_search_state_cards', '{not json');
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    const state = loadInitialState();

    expect(state.cardsSearchParams).toEqual({
      currentPage: 1,
      pageSize: 20,
      viewMode: 'grid',
      sortBy: 'releasedAt',
      sortOrder: 'asc',
    });
  });
});
