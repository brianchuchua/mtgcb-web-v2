import { renderHook } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import { useFilteredSortBy } from '@/hooks/useFilteredSortBy';
import { setSortBy, setSortOrder, setViewContentType } from '@/redux/slices/browse';
import { makeStore } from '@/redux/store';
import { SortByOption, SortOrderOption } from '@/types/browse';

let mockPathname = '/browse';

jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const renderWith = (view: 'cards' | 'sets', sortBy?: string, sortOrder?: SortOrderOption) => {
  const store = makeStore();
  store.dispatch(setViewContentType(view));
  if (sortBy) store.dispatch(setSortBy(sortBy as SortByOption));
  if (sortOrder) store.dispatch(setSortOrder(sortOrder));

  const wrapper = ({ children }: { children: React.ReactNode }) => <Provider store={store}>{children}</Provider>;
  return renderHook(() => useFilteredSortBy(), { wrapper }).result.current;
};

beforeEach(() => {
  mockPathname = '/browse';
});

describe('useFilteredSortBy — public browse', () => {
  it.each(['quantityAll', 'quantityFoil', 'quantityReg'])('resets the cards sort %s to the default', (sortBy) => {
    expect(renderWith('cards', sortBy, 'desc')).toEqual({ sortBy: 'releasedAt', sortOrder: 'asc' });
  });

  it.each(['percentageCollected', 'totalValue', 'costToComplete.oneOfEachCard'])(
    'resets the sets sort %s to the default',
    (sortBy) => {
      expect(renderWith('sets', sortBy, 'asc')).toEqual({ sortBy: 'releasedAt', sortOrder: 'desc' });
    },
  );

  it('keeps a public sort and its order', () => {
    expect(renderWith('cards', 'name', 'desc')).toEqual({ sortBy: 'name', sortOrder: 'desc' });
    expect(renderWith('sets', 'code', 'asc')).toEqual({ sortBy: 'code', sortOrder: 'asc' });
  });

  it('does not treat a sets-only collection sort as collection-only on cards', () => {
    expect(renderWith('cards', 'totalValue', 'desc')).toEqual({ sortBy: 'totalValue', sortOrder: 'desc' });
  });
});

describe('useFilteredSortBy — collection context', () => {
  it.each(['/collections/1337', '/shared/abc123'])('keeps collection-only sorts on %s', (pathname) => {
    mockPathname = pathname;
    expect(renderWith('cards', 'quantityReg', 'desc')).toEqual({ sortBy: 'quantityReg', sortOrder: 'desc' });
    expect(renderWith('sets', 'percentageCollected', 'asc')).toEqual({
      sortBy: 'percentageCollected',
      sortOrder: 'asc',
    });
  });
});
