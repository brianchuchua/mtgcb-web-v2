import { act, renderHook } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import { useSort } from '@/features/browse/hooks/useSort';
import { setSortBy, setSortOrder, setViewContentType } from '@/redux/slices/browse';
import { makeStore } from '@/redux/store';
import { SortByOption, SortOrderOption } from '@/types/browse';

let mockPathname = '/browse';

jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const setup = (view: 'cards' | 'sets', sortBy: string, sortOrder: SortOrderOption) => {
  const store = makeStore();
  store.dispatch(setViewContentType(view));
  store.dispatch(setSortBy(sortBy as SortByOption));
  store.dispatch(setSortOrder(sortOrder));

  const wrapper = ({ children }: { children: React.ReactNode }) => <Provider store={store}>{children}</Provider>;
  const { result } = renderHook(() => useSort(), { wrapper });

  const params = () =>
    view === 'cards' ? store.getState().browse.cardsSearchParams : store.getState().browse.setsSearchParams;
  const stored = (key: string) => {
    const raw = localStorage.getItem(key);
    return raw === null ? null : JSON.parse(raw);
  };

  return { result, params, stored };
};

beforeEach(() => {
  mockPathname = '/browse';
  localStorage.clear();
});

describe('useSort — cards', () => {
  it('flips the order when the current column is clicked again', () => {
    const { result, params, stored } = setup('cards', 'name', 'asc');

    act(() => result.current.handleSort('name'));
    expect(params()).toMatchObject({ sortBy: 'name', sortOrder: 'desc' });
    expect(stored('mtgcb_preferred_sort_order_cards')).toBe('desc');

    act(() => result.current.handleSort('name'));
    expect(params().sortOrder).toBe('asc');
  });

  it('switches to a new column ascending and remembers it', () => {
    const { result, params, stored } = setup('cards', 'name', 'desc');

    act(() => result.current.handleSort('releasedAt'));

    expect(params()).toMatchObject({ sortBy: 'releasedAt', sortOrder: 'asc' });
    expect(stored('mtgcb_preferred_sort_by_cards')).toBe('releasedAt');
    expect(stored('mtgcb_preferred_sort_order_cards')).toBe('asc');
    expect(stored('mtgcb_preferred_sort_by_sets')).toBeNull();
  });

  it('exposes the current sort', () => {
    const { result } = setup('cards', 'artist', 'desc');
    expect(result.current.sortBy).toBe('artist');
    expect(result.current.sortOrder).toBe('desc');
  });

  it('ignores an empty column id', () => {
    const { result, params } = setup('cards', 'name', 'asc');
    act(() => result.current.handleSort(''));
    expect(params()).toMatchObject({ sortBy: 'name', sortOrder: 'asc' });
  });

  // On public browse a stale collection sort reads as releasedAt, so clicking Release Date
  // flips it instead of starting fresh.
  it('treats a hidden collection-only sort as the default column', () => {
    const { result, params } = setup('cards', 'quantityReg', 'asc');
    act(() => result.current.handleSort('releasedAt'));
    expect(params()).toMatchObject({ sortBy: 'quantityReg', sortOrder: 'desc' });
  });
});

describe('useSort — sets', () => {
  it('starts Release Date descending', () => {
    const { result, params, stored } = setup('sets', 'name', 'asc');

    act(() => result.current.handleSort('releasedAt'));

    expect(params()).toMatchObject({ sortBy: 'releasedAt', sortOrder: 'desc' });
    expect(stored('mtgcb_preferred_sort_by_sets')).toBe('releasedAt');
    expect(stored('mtgcb_preferred_sort_order_sets')).toBe('desc');
  });

  it('starts other columns ascending', () => {
    const { result, params } = setup('sets', 'releasedAt', 'desc');
    act(() => result.current.handleSort('code'));
    expect(params()).toMatchObject({ sortBy: 'code', sortOrder: 'asc' });
  });

  it('flips the order of the current column', () => {
    const { result, params, stored } = setup('sets', 'releasedAt', 'desc');
    act(() => result.current.handleSort('releasedAt'));
    expect(params().sortOrder).toBe('asc');
    expect(stored('mtgcb_preferred_sort_order_sets')).toBe('asc');
    expect(stored('mtgcb_preferred_sort_order_cards')).toBeNull();
  });
});
