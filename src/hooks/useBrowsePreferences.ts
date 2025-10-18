'use client';

import { useLocalStorage } from '@/hooks/useLocalStorage';
import { SortByOption, SortOrderOption } from '@/types/browse';

/**
 * localStorage hooks for browse preferences that persist across sessions
 * These represent "how the user likes to browse" not "what they're searching for"
 */

// Cards Sort Preferences
export function usePreferredCardsSortBy() {
  const [value, setValue, isReady] = useLocalStorage<SortByOption>(
    'mtgcb_preferred_sort_by_cards',
    'releasedAt'
  );
  return [value, setValue, isReady] as const;
}

export function usePreferredCardsSortOrder() {
  const [value, setValue, isReady] = useLocalStorage<SortOrderOption>(
    'mtgcb_preferred_sort_order_cards',
    'asc'
  );
  return [value, setValue, isReady] as const;
}

// Sets Sort Preferences
export function usePreferredSetsSortBy() {
  const [value, setValue, isReady] = useLocalStorage<SortByOption>(
    'mtgcb_preferred_sort_by_sets',
    'releasedAt'
  );
  return [value, setValue, isReady] as const;
}

export function usePreferredSetsSortOrder() {
  const [value, setValue, isReady] = useLocalStorage<SortOrderOption>(
    'mtgcb_preferred_sort_order_sets',
    'desc'
  );
  return [value, setValue, isReady] as const;
}

// Display Preferences
export function usePreferredOneResultPerCardName() {
  const [value, setValue, isReady] = useLocalStorage<boolean>(
    'mtgcb_preferred_one_result_per_card',
    false
  );
  return [value, setValue, isReady] as const;
}

export function usePreferredShowSubsets() {
  const [value, setValue, isReady] = useLocalStorage<boolean>(
    'mtgcb_preferred_show_subsets',
    true
  );
  return [value, setValue, isReady] as const;
}

export function usePreferredIncludeSubsetsInSets() {
  const [value, setValue, isReady] = useLocalStorage<boolean>(
    'mtgcb_preferred_include_subsets_in_sets',
    false
  );
  return [value, setValue, isReady] as const;
}

/**
 * Helper to check if all preferences are loaded from localStorage
 */
export function useBrowsePreferencesReady() {
  const [, , cardsSortByReady] = usePreferredCardsSortBy();
  const [, , cardsSortOrderReady] = usePreferredCardsSortOrder();
  const [, , setsSortByReady] = usePreferredSetsSortBy();
  const [, , setsSortOrderReady] = usePreferredSetsSortOrder();
  const [, , onePerCardReady] = usePreferredOneResultPerCardName();
  const [, , showSubsetsReady] = usePreferredShowSubsets();
  const [, , includeSubsetsReady] = usePreferredIncludeSubsetsInSets();

  return (
    cardsSortByReady &&
    cardsSortOrderReady &&
    setsSortByReady &&
    setsSortOrderReady &&
    onePerCardReady &&
    showSubsetsReady &&
    includeSubsetsReady
  );
}
