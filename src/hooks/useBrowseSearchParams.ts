/**
 * Smart Browse Search Params Hooks
 *
 * These hooks wrap the raw Redux selectors and automatically filter out
 * collection-specific parameters when not in a collection context.
 *
 * Use these instead of raw selectors to ensure components and API calls
 * always receive params valid for the current context.
 */

import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectCardSearchParams, selectSetSearchParams } from '@/redux/slices/browse';
import { filterCollectionParams } from '@/utils/collectionContextFilter';
import { useIsCollectionContext } from '@/hooks/useIsCollectionContext';
import { BrowseSearchParams } from '@/types/browse';

/**
 * Get cards search params, filtered for current context
 *
 * Automatically removes goalId, locationId, quantity filters, and quantity sorts
 * when browsing without a collection context.
 */
export function useCardSearchParams(): BrowseSearchParams {
  const rawParams = useSelector(selectCardSearchParams);
  const isCollection = useIsCollectionContext();

  return useMemo(
    () => filterCollectionParams(rawParams, isCollection, 'cards'),
    [rawParams, isCollection]
  );
}

/**
 * Get sets search params, filtered for current context
 *
 * Automatically removes goalId, locationId, completionStatus filters, and
 * collection-specific sorts when browsing without a collection context.
 */
export function useSetSearchParams(): BrowseSearchParams {
  const rawParams = useSelector(selectSetSearchParams);
  const isCollection = useIsCollectionContext();

  return useMemo(
    () => filterCollectionParams(rawParams, isCollection, 'sets'),
    [rawParams, isCollection]
  );
}

/**
 * Get the active search params (cards or sets) based on current view
 */
export function useActiveSearchParams(): BrowseSearchParams {
  const cardParams = useCardSearchParams();
  const setParams = useSetSearchParams();
  const viewContentType = useSelector((state: any) => state.browse.viewContentType);

  return viewContentType === 'cards' ? cardParams : setParams;
}
