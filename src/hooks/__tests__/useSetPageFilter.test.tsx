import { act, renderHook } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import { useGetSetByIdQuery, useGetSetsQuery } from '@/api/browse/browseApi';
import { UseSetPageFilterOptions, useSetPageFilter } from '@/hooks/useSetPageFilter';
import { resetSearch, setViewContentType } from '@/redux/slices/browse';
import { makeStore } from '@/redux/store';

jest.mock('@/api/browse/browseApi', () => ({
  useGetSetsQuery: jest.fn(),
  useGetSetByIdQuery: jest.fn(),
}));

const mockUseGetSetsQuery = useGetSetsQuery as jest.Mock;
const mockUseGetSetByIdQuery = useGetSetByIdQuery as jest.Mock;

type FakeSet = { id: string; slug: string; parentSetId?: string | null; isSubsetGroup?: boolean };

let setsBySlug: Record<string, FakeSet> = {};
let subsetsByParent: Record<string, FakeSet[]> = {};

// RTK Query hands back the same data object for the same cache entry, and the hook's effects
// depend on that, so the fake memoizes its results by args.
let resultCache = new Map<string, unknown>();

const memoized = (key: string, build: () => unknown) => {
  if (!resultCache.has(key)) resultCache.set(key, build());
  return resultCache.get(key);
};

const setQueryResult = (args: Record<string, unknown>, options: { skip?: boolean }) => {
  if (options?.skip) return { data: undefined, isSuccess: false, isLoading: false, isFetching: false };
  if (args.slug !== undefined) {
    const set = setsBySlug[args.slug as string];
    const data = memoized(`slug:${args.slug}`, () => ({ data: { sets: set ? [set] : [] } }));
    return { data, isSuccess: true, isLoading: false, isFetching: false };
  }
  const parent = (args.parentSetId ?? args.subsetGroupId) as string;
  const data = memoized(`parent:${parent}`, () => ({ data: { sets: subsetsByParent[parent] ?? [] } }));
  return { data, isSuccess: true, isLoading: false };
};

const baseOptions: UseSetPageFilterOptions = {
  setSlug: 'alpha',
  priceType: 'market',
  includeSubsetsInSets: false,
};

const setup = (options: Partial<UseSetPageFilterOptions> = {}) => {
  const store = makeStore();
  const wrapper = ({ children }: { children: React.ReactNode }) => <Provider store={store}>{children}</Provider>;
  const hook = renderHook((props: UseSetPageFilterOptions) => useSetPageFilter(props), {
    wrapper,
    initialProps: { ...baseOptions, ...options },
  });
  return { store, hook, setsFilter: () => store.getState().browse.cardsSearchParams.sets };
};

beforeEach(() => {
  sessionStorage.clear();
  resultCache = new Map();
  setsBySlug = {
    alpha: { id: '1', slug: 'alpha' },
    beta: { id: '2', slug: 'beta', parentSetId: '1' },
    'the-list': { id: '3', slug: 'the-list', isSubsetGroup: true },
  };
  subsetsByParent = { '1': [{ id: '10', slug: 'alpha-promos' }], '3': [{ id: '30', slug: 'list-a' }] };
  mockUseGetSetsQuery.mockReset().mockImplementation(setQueryResult);
  mockUseGetSetByIdQuery.mockReset().mockImplementation((id: string, options: { skip?: boolean }) =>
    options?.skip ? { data: undefined } : { data: memoized(`id:${id}`, () => ({ data: { set: { id, slug: 'parent' } } })) },
  );
});

describe('useSetPageFilter', () => {
  it('filters cards to the set and switches to the cards view', () => {
    const { store, hook, setsFilter } = setup();

    expect(setsFilter()).toEqual({ include: ['1'], exclude: [] });
    expect(store.getState().browse.viewContentType).toBe('cards');
    expect(hook.result.current.isReady).toBe(true);
    expect(hook.result.current.set).toEqual(setsBySlug.alpha);
  });

  it('asks for the set by slug with the page options', () => {
    setup({ userId: 1337, goalId: 4, priceType: 'low', includeSubsetsInSets: true });

    expect(mockUseGetSetsQuery).toHaveBeenCalledWith(
      { limit: 1, slug: 'alpha', priceType: 'low', includeSubsetsInSets: true, userId: 1337, goalId: 4 },
      { skip: undefined },
    );
  });

  it('loads subsets by parent for a normal set', () => {
    const { hook } = setup();
    expect(hook.result.current.subsets).toEqual(subsetsByParent['1']);
    expect(mockUseGetSetsQuery).toHaveBeenCalledWith(expect.objectContaining({ parentSetId: '1', limit: 500 }), {
      skip: undefined,
    });
  });

  it('loads subsets by group for a rollup set', () => {
    const { hook } = setup({ setSlug: 'the-list' });
    expect(hook.result.current.subsets).toEqual(subsetsByParent['3']);
    expect(mockUseGetSetsQuery).toHaveBeenCalledWith(expect.objectContaining({ subsetGroupId: '3' }), {
      skip: undefined,
    });
  });

  it('passes the goal filter to the subset query only when it narrows results', () => {
    setup({ userId: 1, goalId: 4, showGoals: 'complete' });
    expect(mockUseGetSetsQuery).toHaveBeenCalledWith(
      expect.objectContaining({ parentSetId: '1', goalId: 4, showGoals: 'complete' }),
      expect.anything(),
    );

    mockUseGetSetsQuery.mockClear();
    setup({ userId: 1, goalId: 4, showGoals: 'all' });
    const subsetCall = mockUseGetSetsQuery.mock.calls.find(([args]) => args.parentSetId === '1');
    expect(subsetCall?.[0]).not.toHaveProperty('showGoals');
  });

  it('loads the parent set when there is one', () => {
    const { hook } = setup({ setSlug: 'beta' });
    expect(hook.result.current.parentSet).toEqual({ id: '1', slug: 'parent' });
    expect(mockUseGetSetByIdQuery).toHaveBeenCalledWith('1', { skip: undefined });
  });

  it('skips the parent lookup when there is no parent', () => {
    const { hook } = setup();
    expect(hook.result.current.parentSet).toBeUndefined();
    expect(mockUseGetSetByIdQuery).toHaveBeenCalledWith('', { skip: true });
  });

  it('puts the set filter back after a reset search', () => {
    const { store, setsFilter } = setup();

    act(() => {
      store.dispatch(resetSearch());
    });

    expect(setsFilter()).toEqual({ include: ['1'], exclude: [] });
  });

  it('switches the filter when the slug changes', () => {
    const { hook, setsFilter } = setup();

    hook.rerender({ ...baseOptions, setSlug: 'beta' });

    expect(setsFilter()).toEqual({ include: ['2'], exclude: [] });
    expect(hook.result.current.set).toEqual(setsBySlug.beta);
  });

  it('clears the set filter and its saved session value on unmount', () => {
    const { hook, setsFilter } = setup();
    sessionStorage.setItem('mtgcb_search_state_cards', JSON.stringify({ sets: { include: ['1'], exclude: [] } }));

    hook.unmount();

    expect(setsFilter()).toBeUndefined();
    expect(sessionStorage.getItem('mtgcb_search_state_cards')).toBeNull();
  });

  it('is not ready and applies no filter while queries are skipped', () => {
    const { store, hook, setsFilter } = setup({ skipQueries: true });

    expect(hook.result.current.isReady).toBe(false);
    expect(setsFilter()).toBeUndefined();
    expect(store.getState().browse.viewContentType).toBe('cards');
  });

  it('is not ready when the slug matches no set', () => {
    const { hook, setsFilter } = setup({ setSlug: 'nope' });
    expect(hook.result.current.isReady).toBe(false);
    expect(hook.result.current.set).toBeUndefined();
    expect(setsFilter()).toBeUndefined();
  });

  it('forces the cards view even if the sets view was active', () => {
    const store = makeStore();
    store.dispatch(setViewContentType('sets'));
    const wrapper = ({ children }: { children: React.ReactNode }) => <Provider store={store}>{children}</Provider>;
    renderHook(() => useSetPageFilter(baseOptions), { wrapper });
    expect(store.getState().browse.viewContentType).toBe('cards');
  });
});
