import { act, renderHook } from '@testing-library/react';
import { useGetSetsNavigationQuery } from '@/api/browse/browseApi';
import { useSetNavigation } from '@/hooks/useSetNavigation';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('@/api/browse/browseApi', () => ({
  useGetSetsNavigationQuery: jest.fn(),
}));

const mockNavigationQuery = useGetSetsNavigationQuery as jest.Mock;

const navSets = [
  { id: '3', name: 'Newest', slug: 'newest', releasedAt: '2024-01-01' },
  { id: '2', name: 'Middle', slug: 'middle', releasedAt: '2023-01-01' },
  { id: '1', name: 'Oldest', slug: 'oldest', releasedAt: '2022-01-01' },
];

beforeEach(() => {
  mockPush.mockReset();
  mockNavigationQuery
    .mockReset()
    .mockReturnValue({ data: { success: true, data: { sets: navSets, totalCount: 3 } }, isLoading: false });
});

describe('useSetNavigation', () => {
  it('asks for sets newest first and skips without a current set', () => {
    renderHook(() => useSetNavigation({}));
    expect(mockNavigationQuery).toHaveBeenCalledWith({ sortBy: 'releasedAt', sortDirection: 'desc' }, { skip: true });

    renderHook(() => useSetNavigation({ currentSetId: '2' }));
    expect(mockNavigationQuery).toHaveBeenLastCalledWith(
      { sortBy: 'releasedAt', sortDirection: 'desc' },
      { skip: false },
    );
  });

  it('finds the newer and older neighbours of a middle set', () => {
    const { result } = renderHook(() => useSetNavigation({ currentSetId: '2' }));
    expect(result.current.previousSet?.slug).toBe('newest');
    expect(result.current.nextSet?.slug).toBe('oldest');
  });

  it('has no previous set for the newest set', () => {
    const { result } = renderHook(() => useSetNavigation({ currentSetId: '3' }));
    expect(result.current.previousSet).toBeNull();
    expect(result.current.nextSet?.slug).toBe('middle');
  });

  it('has no next set for the oldest set', () => {
    const { result } = renderHook(() => useSetNavigation({ currentSetId: '1' }));
    expect(result.current.previousSet?.slug).toBe('middle');
    expect(result.current.nextSet).toBeNull();
  });

  it('has no neighbours for an unknown set or missing data', () => {
    expect(renderHook(() => useSetNavigation({ currentSetId: '99' })).result.current).toMatchObject({
      previousSet: null,
      nextSet: null,
    });

    mockNavigationQuery.mockReturnValue({ data: undefined, isLoading: true });
    const { result } = renderHook(() => useSetNavigation({ currentSetId: '2' }));
    expect(result.current).toMatchObject({ previousSet: null, nextSet: null, isLoading: true });
  });

  it('navigates to the browse set page by default', () => {
    const { result } = renderHook(() => useSetNavigation({ currentSetId: '2' }));
    act(() => result.current.handleSetNavigation('oldest'));
    expect(mockPush).toHaveBeenCalledWith('/browse/sets/oldest');
  });

  it('uses the base URL and keeps defined params', () => {
    const { result } = renderHook(() =>
      useSetNavigation({
        currentSetId: '2',
        baseUrl: '/collections/1337',
        preserveParams: { goalId: 4, locationId: undefined, contentType: 'cards' },
      }),
    );
    act(() => result.current.handleSetNavigation('oldest'));
    expect(mockPush).toHaveBeenCalledWith('/collections/1337/oldest?goalId=4&contentType=cards');
  });
});
