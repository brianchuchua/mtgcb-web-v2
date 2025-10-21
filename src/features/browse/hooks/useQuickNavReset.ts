import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAppDispatch } from '@/redux/hooks';
import { resetSearch, setCardSearchName, setViewContentType } from '@/redux/slices/browse/browseSlice';

/**
 * Hook to detect and handle quick navigation from header components
 * (Quick Search, Jump to Sets) and reset browse form state accordingly.
 *
 * This hook preserves the "sticky" filter behavior for normal browsing
 * while providing a clean slate when users use quick navigation features.
 *
 * Detection mechanism:
 * - Quick navigation components set a sessionStorage flag before routing
 * - This hook checks for that flag on URL changes
 * - If flag exists, resets browse state (clearing old filters)
 * - Then immediately restores URL params from quick navigation
 * - Normal browsing (filters, pagination, etc) doesn't set the flag, so state persists
 */
export const useQuickNavReset = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Skip on initial mount to avoid interfering with existing initialization logic
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Check if navigation came from Quick Search or Jump to Sets
    const quickNavFlag = sessionStorage.getItem('quickNavReset');

    if (quickNavFlag === 'true') {
      // Capture URL params that were just set by quick navigation
      // These should be preserved while we clear old filters/state
      const nameParam = searchParams?.get('name');
      const contentTypeParam = searchParams?.get('contentType');

      // Reset browse state (clears filters, search fields, goal/location)
      // Preserves user preferences (sort, checkboxes, pageSize) from localStorage
      dispatch(
        resetSearch({
          preserveGoal: false,
          preserveLocation: false,
        })
      );

      // Immediately restore the URL params that were set by quick navigation
      // This prevents race condition where resetSearch() clears the search term
      if (nameParam) {
        dispatch(setCardSearchName(nameParam));
      }

      if (contentTypeParam === 'cards' || contentTypeParam === 'sets') {
        dispatch(setViewContentType(contentTypeParam));
      }

      // Clear the flag so subsequent URL changes don't trigger reset
      sessionStorage.removeItem('quickNavReset');
    }
  }, [pathname, searchParams, dispatch]);
};
