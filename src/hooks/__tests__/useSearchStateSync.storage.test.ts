import { renderHook } from '@testing-library/react';
import {
  SHARED_CROSS_VIEW_FIELDS,
  clearAllSearchState,
  clearSearchState,
  clearSpecificSearchField,
  loadSearchState,
  saveSearchState,
  syncSharedFieldsToStorage,
  useSearchStateSync,
} from '@/hooks/useSearchStateSync';
import { BrowseSearchParams } from '@/types/browse';

const CARDS_KEY = 'mtgcb_search_state_cards';
const SETS_KEY = 'mtgcb_search_state_sets';

const stored = (key: string) => {
  const raw = sessionStorage.getItem(key);
  return raw === null ? null : JSON.parse(raw);
};

beforeEach(() => {
  sessionStorage.clear();
  jest.restoreAllMocks();
});

describe('loadSearchState', () => {
  it('returns null when nothing is stored', () => {
    expect(loadSearchState('cards')).toBeNull();
  });

  it('returns the parsed state for the view', () => {
    sessionStorage.setItem(SETS_KEY, JSON.stringify({ name: 'Zendikar' }));

    expect(loadSearchState('sets')).toEqual({ name: 'Zendikar' });
    expect(loadSearchState('cards')).toBeNull();
  });

  it('returns null on corrupt JSON', () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    sessionStorage.setItem(CARDS_KEY, '{oops');

    expect(loadSearchState('cards')).toBeNull();
  });

  it('returns null when storage throws', () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });

    expect(loadSearchState('cards')).toBeNull();
  });
});

describe('saveSearchState', () => {
  it('stores only search criteria, not preferences', () => {
    const params: BrowseSearchParams = {
      name: 'Bolt',
      artist: 'Christopher Rush',
      colors: { colors: ['R'], matchType: 'exactly' },
      types: { include: ['Instant'], exclude: [] },
      isReserved: false,
      selectedGoalId: 7,
      showGoals: 'incomplete',
      sortBy: 'name' as BrowseSearchParams['sortBy'],
      sortOrder: 'desc',
      currentPage: 3,
      pageSize: 50,
      viewMode: 'table',
      oneResultPerCardName: true,
      showSubsets: false,
    };

    saveSearchState('cards', params);

    expect(stored(CARDS_KEY)).toEqual({
      name: 'Bolt',
      artist: 'Christopher Rush',
      colors: { colors: ['R'], matchType: 'exactly' },
      types: { include: ['Instant'], exclude: [] },
      isReserved: false,
      selectedGoalId: 7,
      showGoals: 'incomplete',
    });
  });

  // Format legality is not in SEARCH_FIELDS, so it does not survive an F5 refresh (current behavior).
  it('does not persist format legality', () => {
    saveSearchState('cards', {
      name: 'Bolt',
      formatsLegal: { include: ['modern'] } as unknown as BrowseSearchParams['formatsLegal'],
      formatsLegalIncludeBanned: true,
    });

    expect(stored(CARDS_KEY)).toEqual({ name: 'Bolt' });
  });

  it('drops empty filters, empty arrays and null ids', () => {
    saveSearchState('cards', {
      name: 'Bolt',
      types: { include: [], exclude: [] },
      rarities: { include: [], exclude: [] },
      selectedGoalId: null,
      selectedLocationId: undefined,
    });

    expect(stored(CARDS_KEY)).toEqual({ name: 'Bolt' });
  });

  it('writes each view to its own key', () => {
    saveSearchState('sets', { name: 'Zendikar' });

    expect(stored(SETS_KEY)).toEqual({ name: 'Zendikar' });
    expect(stored(CARDS_KEY)).toBeNull();
  });

  it('removes the stored state when the active view is cleared', () => {
    sessionStorage.setItem(CARDS_KEY, JSON.stringify({ name: 'Bolt' }));

    saveSearchState('cards', { sortBy: 'name' as BrowseSearchParams['sortBy'] }, 'cards');

    expect(stored(CARDS_KEY)).toBeNull();
  });

  it('keeps the stored state when an inactive view comes through empty', () => {
    sessionStorage.setItem(CARDS_KEY, JSON.stringify({ name: 'Bolt' }));

    saveSearchState('cards', {}, 'sets');
    saveSearchState('cards', {});

    expect(stored(CARDS_KEY)).toEqual({ name: 'Bolt' });
  });

  it('does not throw when storage is full', () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    expect(() => saveSearchState('cards', { name: 'Bolt' })).not.toThrow();
  });
});

describe('clearing', () => {
  beforeEach(() => {
    sessionStorage.setItem(CARDS_KEY, JSON.stringify({ name: 'Bolt', sets: { include: ['1'], exclude: [] } }));
    sessionStorage.setItem(SETS_KEY, JSON.stringify({ name: 'Zendikar' }));
    sessionStorage.setItem('unrelated', 'keep');
  });

  it('clearSearchState removes one view', () => {
    clearSearchState('cards');

    expect(stored(CARDS_KEY)).toBeNull();
    expect(stored(SETS_KEY)).toEqual({ name: 'Zendikar' });
  });

  it('clearAllSearchState removes both views and nothing else', () => {
    clearAllSearchState();

    expect(stored(CARDS_KEY)).toBeNull();
    expect(stored(SETS_KEY)).toBeNull();
    expect(sessionStorage.getItem('unrelated')).toBe('keep');
  });

  it('clearSpecificSearchField removes one field', () => {
    clearSpecificSearchField('cards', 'sets');

    expect(stored(CARDS_KEY)).toEqual({ name: 'Bolt' });
  });

  it('clearSpecificSearchField removes the key once the state is empty', () => {
    clearSpecificSearchField('sets', 'name');

    expect(stored(SETS_KEY)).toBeNull();
  });

  it('clearSpecificSearchField is a no-op when nothing is stored', () => {
    sessionStorage.removeItem(CARDS_KEY);
    const setItem = jest.spyOn(Storage.prototype, 'setItem');

    clearSpecificSearchField('cards', 'name');

    expect(setItem).not.toHaveBeenCalled();
    expect(stored(CARDS_KEY)).toBeNull();
  });
});

describe('syncSharedFieldsToStorage', () => {
  it('lists the fields shared across views', () => {
    expect([...SHARED_CROSS_VIEW_FIELDS].sort()).toEqual(
      ['includeChildLocations', 'selectedGoalId', 'selectedLocationId', 'showGoals'].sort(),
    );
  });

  it('mirrors shared fields into the stored state and leaves other fields alone', () => {
    sessionStorage.setItem(SETS_KEY, JSON.stringify({ name: 'Zendikar', selectedGoalId: 1 }));

    syncSharedFieldsToStorage('sets', {
      name: 'ignored',
      selectedGoalId: 2,
      selectedLocationId: 3,
      includeChildLocations: true,
      showGoals: 'complete',
    });

    expect(stored(SETS_KEY)).toEqual({
      name: 'Zendikar',
      selectedGoalId: 2,
      selectedLocationId: 3,
      includeChildLocations: true,
      showGoals: 'complete',
    });
  });

  it('creates the entry when the view has nothing stored', () => {
    syncSharedFieldsToStorage('cards', { selectedGoalId: 9 });

    expect(stored(CARDS_KEY)).toEqual({ selectedGoalId: 9 });
  });

  it('removes shared fields that are unset in the source', () => {
    sessionStorage.setItem(
      CARDS_KEY,
      JSON.stringify({ name: 'Bolt', selectedGoalId: 1, selectedLocationId: 2, showGoals: 'all' }),
    );

    syncSharedFieldsToStorage('cards', {
      selectedGoalId: null,
      selectedLocationId: undefined,
      showGoals: '' as unknown as BrowseSearchParams['showGoals'],
    });

    expect(stored(CARDS_KEY)).toEqual({ name: 'Bolt' });
  });

  it('removes the key when nothing is left', () => {
    sessionStorage.setItem(CARDS_KEY, JSON.stringify({ selectedGoalId: 1 }));

    syncSharedFieldsToStorage('cards', { selectedGoalId: null });

    expect(stored(CARDS_KEY)).toBeNull();
  });

  it('does not write when nothing changed', () => {
    sessionStorage.setItem(CARDS_KEY, JSON.stringify({ name: 'Bolt', selectedGoalId: 1 }));
    const setItem = jest.spyOn(Storage.prototype, 'setItem');

    syncSharedFieldsToStorage('cards', { selectedGoalId: 1 });
    syncSharedFieldsToStorage('sets', {});

    expect(setItem).not.toHaveBeenCalled();
    expect(stored(SETS_KEY)).toBeNull();
  });

  it('keeps includeChildLocations false as a real value', () => {
    syncSharedFieldsToStorage('cards', { includeChildLocations: false });

    expect(stored(CARDS_KEY)).toEqual({ includeChildLocations: false });
  });
});

describe('useSearchStateSync', () => {
  it('saves the search state when enabled', () => {
    renderHook(() => useSearchStateSync({ searchParams: { name: 'Bolt' }, view: 'cards', enabled: true }));

    expect(stored(CARDS_KEY)).toEqual({ name: 'Bolt' });
  });

  it('does nothing when disabled', () => {
    renderHook(() => useSearchStateSync({ searchParams: { name: 'Bolt' }, view: 'cards', enabled: false }));

    expect(stored(CARDS_KEY)).toBeNull();
  });
});
