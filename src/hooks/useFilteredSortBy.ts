/**
 * Hook to get context-appropriate sort values
 *
 * Filters collection-only sort options when not in collection context,
 * preventing "out-of-range value" errors in the sort dropdown.
 */

import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectSortBy, selectSortOrder, selectViewContentType } from '@/redux/slices/browse';
import { useIsCollectionContext } from '@/hooks/useIsCollectionContext';
import { SortByOption, SortOrderOption } from '@/types/browse';

// Sort options that only work when userId is present (collection context)
const COLLECTION_ONLY_SORTS = {
  cards: ['quantityAll', 'quantityFoil', 'quantityReg'],
  sets: ['percentageCollected', 'totalValue', 'costToComplete.oneOfEachCard'],
};

// Default sort values when collection-only sorts are removed
const DEFAULT_SORT = {
  cards: { sortBy: 'releasedAt' as SortByOption, sortOrder: 'asc' as SortOrderOption },
  sets: { sortBy: 'releasedAt' as SortByOption, sortOrder: 'desc' as SortOrderOption },
};

/**
 * Returns sort values filtered for the current context
 *
 * When in browse context (no userId), collection-only sorts are reset to defaults.
 * When in collection context, returns raw Redux values unchanged.
 */
export function useFilteredSortBy(): { sortBy: SortByOption; sortOrder: SortOrderOption } {
  const rawSortBy = useSelector(selectSortBy);
  const rawSortOrder = useSelector(selectSortOrder);
  const viewType = useSelector(selectViewContentType);
  const isCollection = useIsCollectionContext();

  return useMemo(() => {
    // If in collection context, return raw values
    if (isCollection) {
      return {
        sortBy: rawSortBy || DEFAULT_SORT[viewType].sortBy,
        sortOrder: rawSortOrder || DEFAULT_SORT[viewType].sortOrder,
      };
    }

    // Check if current sort is collection-only
    const collectionSorts = COLLECTION_ONLY_SORTS[viewType];
    const isCollectionSort = rawSortBy && collectionSorts.includes(rawSortBy);

    // If using collection-only sort in browse context, reset to default
    if (isCollectionSort) {
      return {
        sortBy: DEFAULT_SORT[viewType].sortBy,
        sortOrder: DEFAULT_SORT[viewType].sortOrder,
      };
    }

    // Otherwise, return raw values (with fallback to defaults)
    return {
      sortBy: rawSortBy || DEFAULT_SORT[viewType].sortBy,
      sortOrder: rawSortOrder || DEFAULT_SORT[viewType].sortOrder,
    };
  }, [rawSortBy, rawSortOrder, viewType, isCollection]);
}
