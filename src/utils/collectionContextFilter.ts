/**
 * Collection Context Filter
 *
 * Filters out collection-specific search parameters when browsing without a collection context.
 * This prevents API errors when users navigate from /collections/{userId} to /browse with
 * persisted sessionStorage/localStorage that contains goalId, locationId, or quantity filters.
 */

import { BrowseSearchParams } from '@/types/browse';

// Fields that only work when userId is present (collection context)
const COLLECTION_ONLY_FIELDS = {
  cards: ['selectedGoalId', 'selectedLocationId', 'quantityAll', 'quantityFoil', 'quantityReg'] as const,
  sets: ['selectedGoalId', 'selectedLocationId', 'completionStatus'] as const,
};

// Sort options that only work when userId is present (collection context)
const COLLECTION_ONLY_SORTS = {
  cards: ['quantityAll', 'quantityFoil', 'quantityReg'] as const,
  sets: ['percentageCollected', 'totalValue', 'costToComplete.oneOfEachCard'] as const,
};

// Default sort values when collection-only sorts are removed
const DEFAULT_SORT = {
  cards: { sortBy: 'releasedAt' as const, sortOrder: 'asc' as const },
  sets: { sortBy: 'releasedAt' as const, sortOrder: 'desc' as const },
};

/**
 * Filters collection-specific parameters from search params when not in collection context.
 *
 * @param params - The search parameters to filter
 * @param isCollection - Whether we're in a collection context (has userId)
 * @param viewType - Whether we're searching cards or sets
 * @returns Filtered params safe for the current context
 */
export function filterCollectionParams<T extends Record<string, any>>(
  params: T,
  isCollection: boolean,
  viewType: 'cards' | 'sets'
): T {
  // If we're in collection context, return params as-is
  if (isCollection) {
    return params;
  }

  // Make a shallow copy to avoid mutating original
  const filtered = { ...params };

  // Remove collection-only fields
  COLLECTION_ONLY_FIELDS[viewType].forEach((field) => {
    if (field in filtered) {
      delete filtered[field as keyof T];
    }
  });

  // Reset collection-only sorts to default
  if (filtered['sortBy']) {
    const collectionSorts = COLLECTION_ONLY_SORTS[viewType] as readonly string[];
    if (collectionSorts.includes(filtered['sortBy'] as string)) {
      (filtered as any)['sortBy'] = DEFAULT_SORT[viewType].sortBy;
      (filtered as any)['sortOrder'] = DEFAULT_SORT[viewType].sortOrder;
    }
  }

  return filtered;
}
