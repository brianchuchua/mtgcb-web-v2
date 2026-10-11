import { createTestStore, renderHookWithRedux } from '@/__tests__/utils/testUtils';
import { setViewContentType } from '@/redux/slices/browse';
import { useBrowseController } from '../useBrowseController';

const mockUseCardData = jest.fn();
const mockUseSetData = jest.fn();
const mockPaginationSync = jest.fn();

const emptyData = { items: [], total: 0, isLoading: false, error: null, refetch: jest.fn(), apiArgs: {} };

jest.mock('@/features/browse/hooks', () => ({
  useCardData: (args: unknown) => {
    mockUseCardData(args);
    return emptyData;
  },
  useSetData: (args: unknown) => {
    mockUseSetData(args);
    return { ...emptyData, costToCompleteData: undefined };
  },
  useCompilationHandler: () => ({}),
  useDisplaySettings: () => ({}),
  usePaginationSync: () => mockPaginationSync(),
  usePrefetchNextPage: () => undefined,
  useSort: () => ({}),
  useViewMode: () => ({ viewMode: 'grid', changeViewMode: jest.fn() }),
}));

jest.mock('@/hooks/useBrowseSearchParams', () => ({
  useCardSearchParams: () => ({}),
  useSetSearchParams: () => ({}),
}));

jest.mock('@/hooks/useBrowsePreferences', () => ({
  usePreferredCardsSortBy: () => [null, jest.fn()],
  usePreferredCardsSortOrder: () => [null, jest.fn()],
  usePreferredSetsSortBy: () => [null, jest.fn()],
  usePreferredSetsSortOrder: () => [null, jest.fn()],
}));

jest.mock('@/features/browse/BrowseSearchForm/utils/sortOptions', () => ({
  getCardSortOptions: () => [],
  getSetSortOptions: () => [],
}));

jest.mock('@/features/browse/BrowseSearchForm/hooks/usePriceTypeSync', () => ({
  usePriceTypeSync: () => ({ isPriceMismatched: false, handlePriceSortChange: jest.fn() }),
}));

jest.mock('@/features/browse/BrowseSearchForm/hooks/useBrowseUrlContext', () => ({
  useBrowseUrlContext: () => ({ isCollectionPage: true }),
}));

const run = (view: 'cards' | 'sets', options: Parameters<typeof useBrowseController>[0]) => {
  const store = createTestStore();
  store.dispatch(setViewContentType(view));
  return renderHookWithRedux(() => useBrowseController(options), { store }).result.current as any;
};

const lastSkip = (mock: jest.Mock) => mock.mock.calls.at(-1)[0].skip;

beforeEach(() => {
  mockUseCardData.mockReset();
  mockUseSetData.mockReset();
  mockPaginationSync.mockReturnValue({
    pagination: { currentPage: 1, pageSize: 24, viewMode: 'grid' },
    handlePageChange: jest.fn(),
    handlePageSizeChange: jest.fn(),
    initialLoadComplete: true,
  });
});

describe('useBrowseController waitForGoalCheck', () => {
  it('runs the cards search when there is no goal check pending', () => {
    run('cards', { waitForGoalCheck: false });
    expect(lastSkip(mockUseCardData)).toBe(false);
  });

  it('runs the cards search when the option is not passed (Browse page)', () => {
    run('cards', undefined);
    expect(lastSkip(mockUseCardData)).toBe(false);
  });

  it('holds the cards search while the goal is unconfirmed', () => {
    run('cards', { waitForGoalCheck: true });
    expect(lastSkip(mockUseCardData)).toBe(true);
  });

  it('runs the sets search when there is no goal check pending', () => {
    run('sets', { waitForGoalCheck: false });
    expect(lastSkip(mockUseSetData)).toBe(false);
  });

  it('holds the sets search while the goal is unconfirmed', () => {
    run('sets', { waitForGoalCheck: true });
    expect(lastSkip(mockUseSetData)).toBe(true);
  });

  it('still skips the inactive view regardless of the goal check', () => {
    run('cards', { waitForGoalCheck: false });
    expect(lastSkip(mockUseSetData)).toBe(true);
    run('sets', { waitForGoalCheck: false });
    expect(lastSkip(mockUseCardData)).toBe(true);
  });

  it('shows loading for cards, not an empty result, while waiting', () => {
    const result = run('cards', { waitForGoalCheck: true });
    expect(result.paginationProps.isLoading).toBe(true);
    expect(result.cardsProps.loading).toBe(true);
  });

  it('shows loading for sets, not an empty result, while waiting', () => {
    const result = run('sets', { waitForGoalCheck: true });
    expect(result.paginationProps.isLoading).toBe(true);
    expect(result.setsProps.isLoading).toBe(true);
  });

  it('reports the real loading state when not waiting', () => {
    expect(run('cards', { waitForGoalCheck: false }).cardsProps.loading).toBe(false);
    expect(run('sets', { waitForGoalCheck: false }).setsProps.isLoading).toBe(false);
  });

  it('keeps the existing skip reasons working alongside it', () => {
    run('cards', { waitForGoalCheck: false, skipCardsUntilReady: true });
    expect(lastSkip(mockUseCardData)).toBe(true);

    mockPaginationSync.mockReturnValue({ ...mockPaginationSync(), initialLoadComplete: false });
    run('sets', { waitForGoalCheck: false });
    expect(lastSkip(mockUseSetData)).toBe(true);
  });
});
