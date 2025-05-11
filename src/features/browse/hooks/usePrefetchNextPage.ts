import { useEffect } from 'react';
import { getNextPageParams, usePrefetch } from '@/api/browse/browseApi';

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
 */
export function usePrefetchNextPage({
  view,
  pagination,
  cardApiArgs,
  setApiArgs,
  isLoading,
}: UsePrefetchNextPageProps) {
  const isCardsView = view === 'cards';
  const isSetsView = view === 'sets';
  const prefetchEndpoint = isCardsView ? 'getCards' : 'getSets';
  const prefetchNextPage = usePrefetch(prefetchEndpoint);

  const hasSomeResults = pagination.currentPage >= 1;

  let nextPageApiParams = null;
  if (isCardsView && hasSomeResults) {
    nextPageApiParams = getNextPageParams(cardApiArgs, pagination.currentPage, pagination.pageSize);
  } else if (isSetsView && hasSomeResults) {
    nextPageApiParams = getNextPageParams(setApiArgs, pagination.currentPage, pagination.pageSize);
  }

  // Prefetch next page
  useEffect(() => {
    if (!nextPageApiParams || isLoading) return;

    const prefetchTimer = setTimeout(() => {
      prefetchNextPage(nextPageApiParams, { ifOlderThan: 300 });
    }, 1000);

    return () => clearTimeout(prefetchTimer);
  }, [prefetchNextPage, nextPageApiParams, isLoading]);
}
