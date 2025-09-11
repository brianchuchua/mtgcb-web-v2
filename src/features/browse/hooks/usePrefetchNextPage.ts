import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { browseApi, getNextPageParams } from '@/api/browse/browseApi';
import { featureFlags } from '@/config/features';
import { useAppDispatch } from '@/redux/hooks';

interface UsePrefetchNextPageProps {
  view: string;
  pagination: {
    currentPage: number;
    pageSize: number;
  };
  cardApiArgs: any;
  setApiArgs: any;
  isLoading: boolean;
}

/**
 * Prefetches the next page of results for smoother pagination
 * Calculates next page params based on current view and pagination state
 *
 * Note: Prefetching can be disabled by setting featureFlags.enablePrefetchNextPage to false
 */
export function usePrefetchNextPage({
  view,
  pagination,
  cardApiArgs,
  setApiArgs,
  isLoading,
}: UsePrefetchNextPageProps) {
  const dispatch = useAppDispatch();
  const isCardsView = view === 'cards';
  const isSetsView = view === 'sets';

  const hasSomeResults = pagination.currentPage >= 1;

  const nextPageApiParams = useMemo(() => {
    if (!hasSomeResults) return null;
    if (isCardsView) {
      return getNextPageParams(cardApiArgs, pagination.currentPage, pagination.pageSize);
    } else if (isSetsView) {
      return getNextPageParams(setApiArgs, pagination.currentPage, pagination.pageSize);
    }
    return null;
  }, [isCardsView, isSetsView, cardApiArgs, setApiArgs, pagination.currentPage, pagination.pageSize, hasSomeResults]);

  // Read RTKQ cache entries directly (no subscription overhead)
  const currentApiArgs = isCardsView ? cardApiArgs : setApiArgs;
  
  // Create memoized selectors to avoid recreation on each render
  const currentCardsSelector = useMemo(
    () => (isCardsView ? browseApi.endpoints.getCards.select(currentApiArgs) : null),
    [isCardsView, currentApiArgs]
  );

  const currentSetsSelector = useMemo(
    () => (!isCardsView ? browseApi.endpoints.getSets.select(currentApiArgs) : null),
    [isCardsView, currentApiArgs]
  );

  const nextCardsSelector = useMemo(
    () => (isCardsView && nextPageApiParams ? browseApi.endpoints.getCards.select(nextPageApiParams) : null),
    [isCardsView, nextPageApiParams]
  );

  const nextSetsSelector = useMemo(
    () => (!isCardsView && nextPageApiParams ? browseApi.endpoints.getSets.select(nextPageApiParams) : null),
    [isCardsView, nextPageApiParams]
  );

  const currentCardsEntry = useSelector((state: any) => currentCardsSelector?.(state));
  const currentSetsEntry = useSelector((state: any) => currentSetsSelector?.(state));
  const currentEntry = isCardsView ? currentCardsEntry : currentSetsEntry;

  const nextCardsEntry = useSelector((state: any) => nextCardsSelector?.(state));
  const nextSetsEntry = useSelector((state: any) => nextSetsSelector?.(state));
  const nextEntry = isCardsView ? nextCardsEntry : nextSetsEntry;

  // Only prefetch when main query is settled (not during invalidation/refetch)
  const mainSettled =
    currentEntry?.status === 'fulfilled' && !('isFetching' in currentEntry && currentEntry.isFetching);

  // Prefetch next page
  useEffect(() => {
    // Check if prefetching is enabled
    if (!featureFlags.enablePrefetchNextPage) {
      return;
    }

    if (!nextPageApiParams) {
      return;
    }

    // Don't prefetch during invalidation/refetch
    if (!mainSettled) {
      return;
    }

    // Already have the next page cached
    if (nextEntry?.status === 'fulfilled') {
      return;
    }

    // Prefetch immediately since we're already waiting for main query to settle
    // Use initiate with subscribe: false to ensure no subscription is created
    if (isCardsView) {
      dispatch(
        browseApi.endpoints.getCards.initiate(nextPageApiParams, {
          subscribe: false,
          forceRefetch: false,
        }),
      );
    } else {
      dispatch(
        browseApi.endpoints.getSets.initiate(nextPageApiParams, {
          subscribe: false,
          forceRefetch: false,
        }),
      );
    }
  }, [
    dispatch,
    isCardsView,
    nextPageApiParams,
    mainSettled,
    nextEntry?.status,
    currentEntry?.fulfilledTimeStamp, // Re-run only when main query actually settles
  ]);
}
