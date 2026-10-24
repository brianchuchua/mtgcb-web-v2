import { act } from '@testing-library/react';
import { createTestStore, renderHookWithRedux } from '@/__tests__/utils/testUtils';
import { setSelectedGoalId } from '@/redux/slices/browse';
import { GOAL_SUMMARY_MAX_AGE_MS, useCardData } from '../useCardData';

const mockUseGetCardsQuery = jest.fn();
const mockUseGetGoalSummaryQuery = jest.fn();
let mockPriceType = 'market';

jest.mock('@/api/browse/browseApi', () => ({
  useGetCardsQuery: (args: unknown, options: unknown) => mockUseGetCardsQuery(args, options),
  useGetGoalSummaryQuery: (args: unknown, options: unknown) => mockUseGetGoalSummaryQuery(args, options),
}));

jest.mock('@/hooks/usePriceType', () => ({
  usePriceType: () => mockPriceType,
}));

jest.mock('@/contexts/DisplaySettingsContext', () => ({
  useCardDisplaySettings: () => ({ locationsIsVisible: false }),
  useCollectionSettings: () => ({ tableLocationsIsVisible: false }),
}));

const SUMMARY = { goalId: 7, goalName: 'Every card', totalCards: 100, collectedCards: 40, percentageCollected: 40 };

const refetchCards = jest.fn();
const refetchGoalSummary = jest.fn();

function cardsResult(overrides: Record<string, unknown> = {}) {
  return {
    data: { success: true, data: { cards: [], totalCount: 100 } },
    isLoading: false,
    isFetching: false,
    error: undefined,
    refetch: refetchCards,
    fulfilledTimeStamp: 1_000,
    ...overrides,
  };
}

function summaryResult(overrides: Record<string, unknown> = {}) {
  return {
    data: { success: true, data: { cards: [], totalCount: 0, goalSummary: SUMMARY, goalSummaryOnly: true } },
    isFetching: false,
    refetch: refetchGoalSummary,
    fulfilledTimeStamp: 1_000,
    ...overrides,
  };
}

const lastCardsArgs = () => mockUseGetCardsQuery.mock.calls.at(-1)[0];
const lastSummaryCall = () => mockUseGetGoalSummaryQuery.mock.calls.at(-1);

function render(props: { currentPage?: number; skip?: boolean; userId?: number; goalId?: number | null } = {}) {
  const store = createTestStore();
  if (props.goalId !== null) store.dispatch(setSelectedGoalId(props.goalId ?? 7));
  const initial = {
    searchParams: {},
    pagination: { currentPage: props.currentPage ?? 1, pageSize: 20 },
    skip: props.skip ?? false,
    userId: 'userId' in props ? props.userId : 5,
  };
  const utils = renderHookWithRedux((p: typeof initial) => useCardData(p), {
    store,
    initialProps: initial,
  } as any);
  return { ...utils, initial };
}

beforeEach(() => {
  mockPriceType = 'market';
  mockUseGetCardsQuery.mockReset().mockImplementation(() => cardsResult());
  mockUseGetGoalSummaryQuery.mockReset().mockImplementation(() => summaryResult());
  refetchCards.mockReset();
  refetchGoalSummary.mockReset();
});

describe('useCardData goal summary', () => {
  it('card pages no longer ask for goal progress, but still send the goal', () => {
    render();
    expect(lastCardsArgs().goalId).toBe(7);
    expect(lastCardsArgs()).not.toHaveProperty('showGoalProgress');
    expect(lastCardsArgs()).not.toHaveProperty('goalSummaryOnly');
  });

  it('asks for the summary with only user, goal and price type', () => {
    render();
    const [args, options] = lastSummaryCall();
    expect(args).toEqual({ userId: 5, goalId: 7, priceType: 'market' });
    expect(options.skip).toBe(false);
  });

  it('every page uses the same summary request, so it is fetched once', () => {
    const { rerender, initial } = render();
    const first = lastSummaryCall()[0];
    for (const currentPage of [2, 3, 50]) {
      rerender({ ...initial, pagination: { currentPage, pageSize: 20 } });
      expect(lastCardsArgs().offset).toBe((currentPage - 1) * 20);
      expect(lastSummaryCall()[0]).toEqual(first);
    }
    rerender({ ...initial, searchParams: { sortBy: 'name', name: 'dragon' } });
    expect(lastSummaryCall()[0]).toEqual(first);
  });

  it('a different price type is a different summary', () => {
    const { rerender, initial } = render();
    mockPriceType = 'low';
    rerender({ ...initial });
    expect(lastSummaryCall()[0]).toEqual({ userId: 5, goalId: 7, priceType: 'low' });
  });

  it('returns the summary from the summary request, not from the page', () => {
    mockUseGetCardsQuery.mockImplementation(() =>
      cardsResult({ data: { success: true, data: { cards: [], totalCount: 1, goalSummary: { goalId: 999 } } } }),
    );
    const { result } = render();
    expect(result.current.goalSummary).toEqual(SUMMARY);
  });

  it.each([
    ['no goal selected', { goalId: null }],
    ['no collection user', { userId: undefined }],
    ['the cards query is skipped', { skip: true }],
  ])('skips the summary when %s', (_label, props) => {
    const { result } = render(props as any);
    expect(lastSummaryCall()[1].skip).toBe(true);
    expect(result.current.goalSummary).toBeUndefined();
  });

  it('refetch reloads both the page and the summary (compilation retry loop)', () => {
    const { result } = render();
    act(() => result.current.refetch());
    expect(refetchCards).toHaveBeenCalledTimes(1);
    expect(refetchGoalSummary).toHaveBeenCalledTimes(1);
  });

  it('refetch leaves a skipped summary alone', () => {
    const { result } = render({ goalId: null });
    act(() => result.current.refetch());
    expect(refetchCards).toHaveBeenCalledTimes(1);
    expect(refetchGoalSummary).not.toHaveBeenCalled();
  });

  describe('freshness while paging', () => {
    it('a fresh page load refreshes a summary older than the max age', () => {
      mockUseGetGoalSummaryQuery.mockImplementation(() => summaryResult({ fulfilledTimeStamp: 1_000 }));
      mockUseGetCardsQuery.mockImplementation(() =>
        cardsResult({ fulfilledTimeStamp: 1_000 + GOAL_SUMMARY_MAX_AGE_MS + 1 }),
      );
      render();
      expect(refetchGoalSummary).toHaveBeenCalledTimes(1);
    });

    it('leaves a summary younger than the max age alone', () => {
      mockUseGetCardsQuery.mockImplementation(() =>
        cardsResult({ fulfilledTimeStamp: 1_000 + GOAL_SUMMARY_MAX_AGE_MS - 1 }),
      );
      render();
      expect(refetchGoalSummary).not.toHaveBeenCalled();
    });

    it('a cached page older than the summary does not refetch it', () => {
      mockUseGetGoalSummaryQuery.mockImplementation(() => summaryResult({ fulfilledTimeStamp: 500_000 }));
      mockUseGetCardsQuery.mockImplementation(() => cardsResult({ fulfilledTimeStamp: 1_000 }));
      render();
      expect(refetchGoalSummary).not.toHaveBeenCalled();
    });

    it('does not stack a second refetch while one is in flight', () => {
      mockUseGetGoalSummaryQuery.mockImplementation(() =>
        summaryResult({ fulfilledTimeStamp: 1_000, isFetching: true }),
      );
      mockUseGetCardsQuery.mockImplementation(() =>
        cardsResult({ fulfilledTimeStamp: 1_000 + GOAL_SUMMARY_MAX_AGE_MS * 5 }),
      );
      render();
      expect(refetchGoalSummary).not.toHaveBeenCalled();
    });
  });

  describe('goal compilation', () => {
    const compiling = { success: true, data: { cards: [], totalCount: 0, compilationInProgress: true } };

    it('refetches a summary that landed mid-compile once the page says the goal is ready', () => {
      mockUseGetGoalSummaryQuery.mockImplementation(() =>
        summaryResult({ data: compiling, fulfilledTimeStamp: 1_000 }),
      );
      mockUseGetCardsQuery.mockImplementation(() => cardsResult({ fulfilledTimeStamp: 2_000 }));
      render();
      expect(refetchGoalSummary).toHaveBeenCalledTimes(1);
    });

    it('does not loop when the mid-compile summary is newer than the page', () => {
      mockUseGetGoalSummaryQuery.mockImplementation(() =>
        summaryResult({ data: compiling, fulfilledTimeStamp: 3_000 }),
      );
      mockUseGetCardsQuery.mockImplementation(() => cardsResult({ fulfilledTimeStamp: 2_000 }));
      render();
      expect(refetchGoalSummary).not.toHaveBeenCalled();
    });

    it('does nothing while both requests report compiling', () => {
      mockUseGetGoalSummaryQuery.mockImplementation(() =>
        summaryResult({ data: compiling, fulfilledTimeStamp: 1_000 }),
      );
      mockUseGetCardsQuery.mockImplementation(() => cardsResult({ data: compiling, fulfilledTimeStamp: 2_000 }));
      render();
      expect(refetchGoalSummary).not.toHaveBeenCalled();
    });
  });
});
