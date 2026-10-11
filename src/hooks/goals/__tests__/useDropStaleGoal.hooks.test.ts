import { act } from '@testing-library/react';
import { mockNextNavigation, resetAllMocks } from '@/__tests__/utils/mockHelpers';
import { createTestStore, renderHookWithRedux } from '@/__tests__/utils/testUtils';
import { setCardSearchName, setSelectedGoalId, setShowGoals, setViewContentType } from '@/redux/slices/browse';
import { useDropGoalOutsideCollection, useDropUnknownGoal, useIsGoalUnconfirmed } from '../useDropStaleGoal';

const mockGoalsQuery = jest.fn();
jest.mock('@/api/goals/goalsApi', () => ({
  useGetUserGoalsQuery: (...args: unknown[]) => mockGoalsQuery(...args),
}));

type QueryState = {
  currentData?: unknown;
  isFetching: boolean;
  isError: boolean;
  fulfilledTimeStamp?: number;
  refetch: jest.Mock;
};

let query: QueryState;

const goalList = (ids: number[], { totalCount = ids.length, inactive = [] as number[] } = {}) => ({
  success: true,
  data: {
    goals: ids.map((id) => ({ id, isActive: !inactive.includes(id) })),
    totalCount,
    limit: 500,
    offset: 0,
  },
  error: null,
});

// A list that arrives after the goal was selected (the normal case)
const freshList = (ids: number[], opts?: Parameters<typeof goalList>[1]) => {
  query = { ...query, currentData: goalList(ids, opts), isFetching: false, isError: false, fulfilledTimeStamp: Date.now() + 1000 };
};

const stored = (view: 'cards' | 'sets') => JSON.parse(sessionStorage.getItem(`mtgcb_search_state_${view}`) ?? 'null');
const store = (view: 'cards' | 'sets', state: object) =>
  sessionStorage.setItem(`mtgcb_search_state_${view}`, JSON.stringify(state));

const storeWithGoal = (goalId: number | null, { showGoals = false } = {}) => {
  const s = createTestStore();
  if (goalId != null) s.dispatch(setSelectedGoalId(goalId));
  if (showGoals) s.dispatch(setShowGoals('incomplete'));
  return s;
};

const goalIds = (s: ReturnType<typeof createTestStore>) => [
  s.getState().browse.cardsSearchParams.selectedGoalId ?? null,
  s.getState().browse.setsSearchParams.selectedGoalId ?? null,
];

beforeEach(() => {
  sessionStorage.clear();
  query = { currentData: undefined, isFetching: false, isError: false, fulfilledTimeStamp: undefined, refetch: jest.fn() };
  mockGoalsQuery.mockReset();
  mockGoalsQuery.mockImplementation(() => query);
});

afterEach(() => {
  resetAllMocks();
});

describe('useDropGoalOutsideCollection', () => {
  const render = (pathname: string | null, s = storeWithGoal(7, { showGoals: true })) => {
    mockNextNavigation({ pathname: pathname as string });
    renderHookWithRedux(() => useDropGoalOutsideCollection(), { store: s });
    return s;
  };

  it('drops the goal and showGoals on Browse, from Redux and both stored views', () => {
    store('cards', { selectedGoalId: 7, showGoals: 'incomplete', name: 'bolt' });
    store('sets', { selectedGoalId: 7, showGoals: 'incomplete' });

    const s = render('/browse');

    expect(goalIds(s)).toEqual([null, null]);
    expect(s.getState().browse.cardsSearchParams.showGoals).toBeUndefined();
    expect(s.getState().browse.setsSearchParams.showGoals).toBeUndefined();
    expect(stored('cards')).toEqual({ name: 'bolt' });
    expect(stored('sets')).toBeNull();
  });

  it('drops a stored goal on Browse even when Redux has none yet (cold load)', () => {
    store('cards', { selectedGoalId: 7 });
    const s = render('/browse', storeWithGoal(null));
    expect(stored('cards')).toBeNull();
    expect(goalIds(s)).toEqual([null, null]);
  });

  it('drops the goal on other non-collection pages that use browse state', () => {
    for (const pathname of ['/browse/sets/alpha', '/goals', '/']) {
      const s = render(pathname);
      expect(goalIds(s)).toEqual([null, null]);
    }
  });

  it('leaves other search fields alone', () => {
    const s = storeWithGoal(7);
    s.dispatch(setCardSearchName('bolt'));
    render('/browse', s);
    expect(s.getState().browse.cardsSearchParams.name).toBe('bolt');
  });

  it.each([
    ['a collection', '/collections/5'],
    ['a collection set page', '/collections/5/limited-edition-alpha'],
    ['a shared collection', '/shared/abc123'],
    ['a shared collection set page', '/shared/abc123/limited-edition-alpha'],
  ])('keeps the goal on %s', (_label, pathname) => {
    store('cards', { selectedGoalId: 7 });
    const s = render(pathname);
    expect(goalIds(s)).toEqual([7, 7]);
    expect(stored('cards')).toEqual({ selectedGoalId: 7 });
  });

  it('does nothing before the pathname is known', () => {
    store('cards', { selectedGoalId: 7 });
    const s = render(null);
    expect(goalIds(s)).toEqual([7, 7]);
    expect(stored('cards')).toEqual({ selectedGoalId: 7 });
  });

  it('does not touch the stored location or other stored fields', () => {
    store('cards', { selectedGoalId: 7, selectedLocationId: 3, includeChildLocations: true });
    render('/browse');
    expect(stored('cards')).toEqual({ selectedLocationId: 3, includeChildLocations: true });
  });
});

describe('useDropUnknownGoal', () => {
  const setup = (userId: number | null, goalId: number | null = 7) => {
    mockNextNavigation({ pathname: '/collections/5' });
    const s = storeWithGoal(goalId, { showGoals: true });
    if (goalId != null) {
      store('cards', { selectedGoalId: goalId, showGoals: 'incomplete' });
      store('sets', { selectedGoalId: goalId });
    }
    const hook = renderHookWithRedux((props: { userId: number | null }) => useDropUnknownGoal(props.userId), {
      store: s,
      initialProps: { userId },
    });
    return { s, ...hook, rerender: () => hook.rerender({ userId }) };
  };

  it('asks for the same goal list GoalSelector does, so the request is shared', () => {
    setup(5);
    expect(mockGoalsQuery).toHaveBeenCalledWith({ userId: 5, includeProgress: false, limit: 500 }, { skip: false });
  });

  it('skips the request when no goal is selected', () => {
    setup(5, null);
    expect(mockGoalsQuery).toHaveBeenLastCalledWith(expect.anything(), { skip: true });
  });

  it('skips the request and keeps the goal when the collection owner is unknown', () => {
    const { s } = setup(null);
    expect(mockGoalsQuery).toHaveBeenLastCalledWith(expect.anything(), { skip: true });
    expect(goalIds(s)).toEqual([7, 7]);
  });

  it('keeps the goal while the list is loading', () => {
    query.isFetching = true;
    const { s } = setup(5);
    expect(goalIds(s)).toEqual([7, 7]);
    expect(stored('cards')).toEqual({ selectedGoalId: 7, showGoals: 'incomplete' });
  });

  it('keeps a goal the owner has', () => {
    freshList([3, 7]);
    const { s } = setup(5);
    expect(goalIds(s)).toEqual([7, 7]);
  });

  it('keeps an inactive goal the owner has', () => {
    freshList([7], { inactive: [7] });
    const { s } = setup(5);
    expect(goalIds(s)).toEqual([7, 7]);
  });

  it('drops a goal the owner does not have, from Redux and both stored views', () => {
    freshList([3]);
    const { s } = setup(5);
    expect(goalIds(s)).toEqual([null, null]);
    expect(s.getState().browse.cardsSearchParams.showGoals).toBeUndefined();
    expect(stored('cards')).toBeNull();
    expect(stored('sets')).toBeNull();
  });

  it('drops the goal when the owner has no goals at all', () => {
    freshList([]);
    const { s } = setup(5);
    expect(goalIds(s)).toEqual([null, null]);
  });

  it('waits out a refetch before judging the list', () => {
    freshList([3]);
    query.isFetching = true;
    const { s, rerender } = setup(5);
    expect(goalIds(s)).toEqual([7, 7]);

    freshList([3]);
    rerender();
    expect(goalIds(s)).toEqual([null, null]);
  });

  it('keeps the goal if the refetch shows it exists (a goal just created)', () => {
    freshList([3]);
    query.isFetching = true;
    const { s, rerender } = setup(5);

    freshList([3, 7]);
    rerender();
    expect(goalIds(s)).toEqual([7, 7]);
  });

  it('keeps the goal when the list is only a partial page', () => {
    freshList([1, 2], { totalCount: 900 });
    const { s } = setup(5);
    expect(goalIds(s)).toEqual([7, 7]);
  });

  it('keeps the goal when the list cannot be loaded (private collection, network error)', () => {
    query.isError = true;
    const { s } = setup(5);
    expect(goalIds(s)).toEqual([7, 7]);
  });

  it('keeps the goal on an unsuccessful response', () => {
    query.currentData = { success: false, data: null, error: { message: 'x' } };
    query.fulfilledTimeStamp = Date.now() + 1000;
    const { s } = setup(5);
    expect(goalIds(s)).toEqual([7, 7]);
  });

  describe('a cached list from before the goal was selected', () => {
    const staleList = (ids: number[]) => {
      query = { ...query, currentData: goalList(ids), isFetching: false, fulfilledTimeStamp: Date.now() - 30_000 };
    };

    it('refetches instead of dropping (the goal may have been made in another tab)', () => {
      staleList([3]);
      const { s } = setup(5);
      expect(query.refetch).toHaveBeenCalledTimes(1);
      expect(goalIds(s)).toEqual([7, 7]);
    });

    it('keeps the goal when the fresh list has it', () => {
      staleList([3]);
      const { s, rerender } = setup(5);
      freshList([3, 7]);
      rerender();
      expect(goalIds(s)).toEqual([7, 7]);
    });

    it('drops the goal when the fresh list still does not have it', () => {
      staleList([3]);
      const { s, rerender } = setup(5);
      freshList([3]);
      rerender();
      expect(goalIds(s)).toEqual([null, null]);
    });

    it('refetches only once, and keeps the goal if the refetch fails', () => {
      staleList([3]);
      const { s, rerender } = setup(5);
      // The refetch runs and fails; RTK keeps the old list
      query = { ...query, isFetching: true };
      rerender();
      query = { ...query, isFetching: false, isError: true };
      rerender();
      expect(query.refetch).toHaveBeenCalledTimes(1);
      expect(goalIds(s)).toEqual([7, 7]);
    });

    it('does not refetch a cached list that has the goal', () => {
      staleList([7]);
      setup(5);
      expect(query.refetch).not.toHaveBeenCalled();
    });

    it('checks again for a different goal selected later', () => {
      staleList([3, 8]);
      const { s, rerender } = setup(5);
      expect(query.refetch).toHaveBeenCalledTimes(1);

      act(() => {
        s.dispatch(setSelectedGoalId(9));
      });
      rerender();
      expect(query.refetch).toHaveBeenCalledTimes(2);
      expect(goalIds(s)).toEqual([9, 9]);
    });
  });

  it('reads the goal from the sets view too', () => {
    freshList([3]);
    mockNextNavigation({ pathname: '/collections/5' });
    const s = storeWithGoal(7);
    s.dispatch(setViewContentType('sets'));
    renderHookWithRedux(() => useDropUnknownGoal(5), { store: s });
    expect(goalIds(s)).toEqual([null, null]);
  });

  it('only forgets the stored goal it dropped', () => {
    freshList([3]);
    mockNextNavigation({ pathname: '/collections/5' });
    store('sets', { selectedGoalId: 3 });
    renderHookWithRedux(() => useDropUnknownGoal(5), { store: storeWithGoal(7) });
    expect(stored('sets')).toEqual({ selectedGoalId: 3 });
  });
});

describe('useIsGoalUnconfirmed', () => {
  const unconfirmed = (userId: number | null, goalId: number | null = 7) => {
    mockNextNavigation({ pathname: '/collections/5' });
    return renderHookWithRedux(() => useIsGoalUnconfirmed(userId), { store: storeWithGoal(goalId) }).result.current;
  };

  it('is false with no goal selected, so searches never wait', () => {
    expect(unconfirmed(5, null)).toBe(false);
  });

  it('is false when the collection owner is unknown', () => {
    expect(unconfirmed(null)).toBe(false);
  });

  it('is true while the goal list loads', () => {
    query.isFetching = true;
    expect(unconfirmed(5)).toBe(true);
  });

  it('is false when the goal list cannot be loaded, so searches run as before', () => {
    query.isError = true;
    expect(unconfirmed(5)).toBe(false);
  });

  it('is false once the goal is found', () => {
    freshList([7]);
    expect(unconfirmed(5)).toBe(false);
  });

  it('is true for a goal that is about to be dropped', () => {
    freshList([3]);
    expect(unconfirmed(5)).toBe(true);
  });

  it('is false when the list is a partial page', () => {
    freshList([3], { totalCount: 900 });
    expect(unconfirmed(5)).toBe(false);
  });
});
