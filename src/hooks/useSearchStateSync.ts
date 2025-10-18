import { useEffect } from 'react';
import { BrowseSearchParams } from '@/types/browse';

/**
 * Syncs "active search state" to sessionStorage
 * This allows F5 refresh to restore the current search, but tab close clears it.
 */

// Fields that represent "active search" (Tier 2)
// These are search criteria, not user preferences
const SEARCH_FIELDS: Array<keyof BrowseSearchParams> = [
  'name',
  'code',
  'oracleText',
  'artist',
  'colors',
  'types',
  'layouts',
  'rarities',
  'sets',
  'stats',
  'setCategories',
  'setTypes',
  'completionStatus',
  'isReserved',
  'includeBadDataOnly',
  // Note: NOT including sort, checkboxes, pagination (those are preferences in localStorage)
  // Note: NOT including goal/location (those have special handling)
];

interface SearchStateSyncOptions {
  searchParams: BrowseSearchParams;
  view: 'cards' | 'sets';
  enabled: boolean;
}

/**
 * Extract only search fields from search params
 */
function extractSearchState(searchParams: BrowseSearchParams): Partial<BrowseSearchParams> {
  const searchState: Partial<BrowseSearchParams> = {};

  for (const field of SEARCH_FIELDS) {
    const value = searchParams[field];
    if (value !== undefined && value !== null) {
      // Only include non-empty values
      if (typeof value === 'object') {
        // For objects, check if they have meaningful content
        if (Array.isArray(value)) {
          if (value.length === 0) continue;
        } else {
          // For filter objects (colors, types, etc.)
          const obj = value as Record<string, unknown>;
          const hasContent = Object.values(obj).some((v) => {
            if (Array.isArray(v)) return v.length > 0;
            if (typeof v === 'boolean') return v;
            return v !== undefined && v !== null;
          });
          if (!hasContent) continue;
        }
      }
      // Use type assertion to assign the value
      (searchState as any)[field] = value;
    }
  }

  return searchState;
}

/**
 * Load search state from sessionStorage
 */
export function loadSearchState(view: 'cards' | 'sets'): Partial<BrowseSearchParams> | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const key = `mtgcb_search_state_${view}`;
    const stored = sessionStorage.getItem(key);
    if (!stored) return null;
    return JSON.parse(stored) as Partial<BrowseSearchParams>;
  } catch (error) {
    console.warn('Failed to load search state from sessionStorage:', error);
    return null;
  }
}

/**
 * Save search state to sessionStorage
 */
export function saveSearchState(view: 'cards' | 'sets', searchParams: BrowseSearchParams): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const key = `mtgcb_search_state_${view}`;
    const searchState = extractSearchState(searchParams);

    // If search state is empty, remove from sessionStorage
    if (Object.keys(searchState).length === 0) {
      sessionStorage.removeItem(key);
    } else {
      sessionStorage.setItem(key, JSON.stringify(searchState));
    }
  } catch (error) {
    console.warn('Failed to save search state to sessionStorage:', error);
  }
}

/**
 * Clear search state from sessionStorage
 */
export function clearSearchState(view: 'cards' | 'sets'): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const key = `mtgcb_search_state_${view}`;
    sessionStorage.removeItem(key);
  } catch (error) {
    console.warn('Failed to clear search state from sessionStorage:', error);
  }
}

/**
 * Clear a specific field from search state in sessionStorage
 * Useful for clearing contextual filters (like sets filter on set pages)
 */
export function clearSpecificSearchField(
  view: 'cards' | 'sets',
  field: keyof BrowseSearchParams
): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const key = `mtgcb_search_state_${view}`;
    const stored = sessionStorage.getItem(key);
    if (!stored) return;

    const searchState = JSON.parse(stored) as Partial<BrowseSearchParams>;
    delete searchState[field];

    // If search state is now empty, remove the key entirely
    if (Object.keys(searchState).length === 0) {
      sessionStorage.removeItem(key);
    } else {
      sessionStorage.setItem(key, JSON.stringify(searchState));
    }
  } catch (error) {
    console.warn('Failed to clear specific search field from sessionStorage:', error);
  }
}

/**
 * Hook to automatically sync search state to sessionStorage
 */
export function useSearchStateSync({ searchParams, view, enabled }: SearchStateSyncOptions) {
  useEffect(() => {
    if (!enabled) return;

    saveSearchState(view, searchParams);
  }, [searchParams, view, enabled]);
}
