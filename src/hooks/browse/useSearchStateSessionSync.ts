import { useEffect } from 'react';
import { saveSearchState } from '@/hooks/useSearchStateSync';
import { BrowseSearchParams } from '@/types/browse';

/**
 * Syncs current search state to sessionStorage
 * Enables restoration after F5 refresh (see useInitialStateHydration)
 *
 * IMPORTANT: Uses separate effects for cards and sets to prevent cross-contamination.
 * When you switch views, Redux resets the inactive view's state to defaults, which would
 * trigger a save of empty state and remove it from sessionStorage. By using separate effects,
 * we only save when the ACTIVE view's state changes.
 *
 * @param viewType - Current view ('cards' or 'sets')
 * @param cardState - Current cards search parameters
 * @param setState - Current sets search parameters
 * @param isInitialized - Only sync after initialization complete
 */
export function useSearchStateSessionSync(
  viewType: 'cards' | 'sets',
  cardState: BrowseSearchParams,
  setState: BrowseSearchParams,
  isInitialized: boolean
): void {
  // Save cards state ONLY when cards view is active
  // This prevents overwriting sessionStorage with partial data from inactive view
  useEffect(() => {
    if (!isInitialized) return;
    if (viewType !== 'cards') return; // Only save when cards is active view

    saveSearchState('cards', cardState, viewType);
  }, [cardState, isInitialized, viewType]);

  // Save sets state ONLY when sets view is active
  // This prevents overwriting sessionStorage with partial data from inactive view
  useEffect(() => {
    if (!isInitialized) return;
    if (viewType !== 'sets') return; // Only save when sets is active view

    saveSearchState('sets', setState, viewType);
  }, [setState, isInitialized, viewType]);
}
