import { SortByOption, SortOrderOption } from '@/types/browse';

/**
 * Helper functions to read browse preferences from localStorage
 * Used by browseSlice initialState and resetSearch action
 *
 * These are synchronous reads from localStorage, which is acceptable
 * for Redux hydration scenarios.
 */

interface BrowsePreferences {
  sortBy: SortByOption;
  sortOrder: SortOrderOption;
  oneResultPerCardName?: boolean;
  showSubsets?: boolean;
  includeSubsetsInSets?: boolean;
}

function safeGetItem(key: string, defaultValue: string): string {
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  try {
    const value = localStorage.getItem(key);
    if (value === null) return defaultValue;
    // Parse JSON value since useLocalStorage stores values as JSON
    return JSON.parse(value) as string;
  } catch {
    return defaultValue;
  }
}

function safeGetBoolean(key: string, defaultValue: boolean): boolean {
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  try {
    const value = localStorage.getItem(key);
    if (value === null) return defaultValue;
    // Parse JSON value since useLocalStorage stores values as JSON
    return JSON.parse(value) as boolean;
  } catch {
    return defaultValue;
  }
}

export function getCardsPreferences(): BrowsePreferences {
  return {
    sortBy: safeGetItem('mtgcb_preferred_sort_by_cards', 'releasedAt') as SortByOption,
    sortOrder: safeGetItem('mtgcb_preferred_sort_order_cards', 'asc') as SortOrderOption,
    oneResultPerCardName: safeGetBoolean('mtgcb_preferred_one_result_per_card', false),
  };
}

export function getSetsPreferences(): BrowsePreferences {
  return {
    sortBy: safeGetItem('mtgcb_preferred_sort_by_sets', 'releasedAt') as SortByOption,
    sortOrder: safeGetItem('mtgcb_preferred_sort_order_sets', 'desc') as SortOrderOption,
    showSubsets: safeGetBoolean('mtgcb_preferred_show_subsets', true),
    includeSubsetsInSets: safeGetBoolean('mtgcb_preferred_include_subsets_in_sets', false),
  };
}

export function getPreferencesForView(view: 'cards' | 'sets'): BrowsePreferences {
  return view === 'cards' ? getCardsPreferences() : getSetsPreferences();
}
