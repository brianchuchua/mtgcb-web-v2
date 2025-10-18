import debounce from 'lodash.debounce';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchStateSessionSync } from './browse/useSearchStateSessionSync';
import { convertStateToUrlParams, parseUrlToState } from '@/features/browse/schema/urlStateAdapters';
import { useCardsPageSize } from '@/hooks/useCardsPageSize';
import { useSetsPageSize } from '@/hooks/useSetsPageSize';
import { usePreferredCardViewMode, usePreferredSetViewMode } from '@/contexts/DisplaySettingsContext';
import { useBrowsePreferencesReady } from '@/hooks/useBrowsePreferences';
import { loadSearchState, saveSearchState } from '@/hooks/useSearchStateSync';
import { isSetSpecificPage } from '@/utils/routeHelpers';
import {
  resetAllSearches,
  selectCardSearchParams,
  selectSetSearchParams,
  selectViewContentType,
  setCardPagination,
  setCardSearchParams,
  setPagination,
  setSetPagination,
  setSetSearchParams,
  setSets,
  setViewContentType,
} from '@/redux/slices/browse';
import { BrowsePagination } from '@/types/browse';

// Balance between responsiveness and avoiding URL spam during rapid typing
const DEBOUNCE_URL_SYNC_MS = 100;

/**
 * Syncs Redux state from either URL params or sessionStorage
 * Used for both initial load and URL changes
 *
 * @param search - URL search params to parse
 * @param dispatch - Redux dispatch function
 * @param cardsPageSize - Page size for cards from localStorage
 * @param setsPageSize - Page size for sets from localStorage
 * @param options - Control sync behavior differences
 * @param options.resetBeforeSync - If true, calls resetAllSearches() before parsing URL (URL changes only)
 * @param options.forcePageOne - If true, always sets currentPage to 1 (initialization only)
 * @param options.isNavigation - If true, empty URL means clear state (not restore from sessionStorage)
 */
function syncReduxFromUrlOrSession(
  search: URLSearchParams,
  dispatch: any,
  cardsPageSize: number,
  setsPageSize: number,
  pathname: string,
  options: {
    resetBeforeSync: boolean;
    forcePageOne: boolean;
    isNavigation: boolean;
  }
): void {
  // Update view type from URL if present (for navigation/back button)
  if (options.isNavigation) {
    const contentTypeFromUrl = search.get('contentType');
    if (contentTypeFromUrl === 'cards' || contentTypeFromUrl === 'sets') {
      console.log('[syncReduxFromUrlOrSession] 📺 Setting view type from URL:', contentTypeFromUrl);
      dispatch(setViewContentType(contentTypeFromUrl));
    } else if (!isSetSpecificPage(pathname)) {
      // No contentType in URL and not on set page → default to sets
      console.log('[syncReduxFromUrlOrSession] 📺 No contentType in URL, defaulting to sets');
      dispatch(setViewContentType('sets'));
    }
  }

  // Check if we have any search parameters in the URL (excluding contentType)
  const hasSearchParams = Array.from(search.entries()).some(
    ([key]) => key !== 'contentType'
  );

  if (!hasSearchParams) {
    // No URL params - behavior depends on context
    if (options.isNavigation) {
      // User navigated to empty URL (e.g., back button) - respect the empty state
      // Don't restore from sessionStorage, clear the search instead
      console.log('[syncReduxFromUrlOrSession] 🗑️  Empty URL (navigation) - clearing search state');
      dispatch(resetAllSearches());
      dispatch(setCardPagination({ pageSize: cardsPageSize }));
      dispatch(setSetPagination({ pageSize: setsPageSize }));
    } else {
      // Initial load with no URL params - try to restore from sessionStorage
      console.log('[syncReduxFromUrlOrSession] 💾 No URL params (init) - trying sessionStorage');
      const cardsSessionState = loadSearchState('cards');
      const setsSessionState = loadSearchState('sets');

      if (cardsSessionState && Object.keys(cardsSessionState).length > 0) {
        // Restore cards search state from sessionStorage
        dispatch(
          setCardSearchParams({
            ...cardsSessionState,
            currentPage: 1,
            pageSize: cardsPageSize,
          }),
        );
      } else {
        // No session state - reset to defaults (which includes preferences from localStorage)
        dispatch(resetAllSearches());
        dispatch(setCardPagination({ pageSize: cardsPageSize }));
      }

      if (setsSessionState && Object.keys(setsSessionState).length > 0) {
        // Restore sets search state from sessionStorage
        dispatch(
          setSetSearchParams({
            ...setsSessionState,
            currentPage: 1,
            pageSize: setsPageSize,
          }),
        );
      } else {
        // No session state - reset to defaults (which includes preferences from localStorage)
        dispatch(setSetPagination({ pageSize: setsPageSize }));
      }
    }
  } else {
    // Reset first if needed (URL changes reset to ensure clean state, init doesn't)
    if (options.resetBeforeSync) {
      dispatch(resetAllSearches());
    }

    // Parse the URL state and update Redux
    const cardsUrlState = parseUrlToState(search, 'cards');
    const setsUrlState = parseUrlToState(search, 'sets');

    // Update cards state if there are card-specific params
    if (Object.keys(cardsUrlState).length > 0) {
      dispatch(
        setCardSearchParams({
          ...cardsUrlState,
          ...(options.forcePageOne ? { currentPage: 1 } : {}),
          pageSize: cardsPageSize,
        }),
      );
    } else {
      // Even if no card params, still need to set pagination from localStorage
      const pagination: any = { pageSize: cardsPageSize };
      if (options.forcePageOne) {
        pagination.currentPage = 1;
      }
      dispatch(setCardPagination(pagination));
    }

    // Clear sets filter if not in URL (prevents persistence from set-specific pages)
    const hasIncludeSets = search.has('includeSets');
    const hasExcludeSets = search.has('excludeSets');
    if (!hasIncludeSets && !hasExcludeSets && !cardsUrlState.sets) {
      dispatch(setSets({ include: [], exclude: [] }));
    }

    // Update sets state if there are set-specific params
    if (Object.keys(setsUrlState).length > 0) {
      dispatch(
        setSetSearchParams({
          ...setsUrlState,
          ...(options.forcePageOne ? { currentPage: 1 } : {}),
          pageSize: setsPageSize,
        }),
      );
    } else {
      // Even if no set params, still need to set pagination from localStorage
      const pagination: any = { pageSize: setsPageSize };
      if (options.forcePageOne) {
        pagination.currentPage = 1;
      }
      dispatch(setSetPagination(pagination));
    }
  }
}

export function useBrowseStateSync() {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  const viewType = useSelector(selectViewContentType);
  const cardState = useSelector(selectCardSearchParams);
  const setState = useSelector(selectSetSearchParams);

  const [cardView] = usePreferredCardViewMode();
  const [setView] = usePreferredSetViewMode();
  const viewMode = viewType === 'cards' ? cardView : setView;

  const [cardsPageSize, , cardsPageSizeReady] = useCardsPageSize();
  const [setsPageSize, , setsPageSizeReady] = useSetsPageSize();
  const preferencesReady = useBrowsePreferencesReady();

  const hasInit = useRef(false);
  const prevView = useRef(viewType);
  const lastUrlPushed = useRef<string | undefined>(undefined);
  const prevSearchParamsString = useRef<string>('');

  // TODO: Consider using named functions for useEffects for readability
  // TODO: Still not happy with the readability of this code
  /** ------------------------------------------------------------------
   *  Initialise Redux from the URL exactly once
   * ------------------------------------------------------------------ */
  useEffect(() => {
    if (hasInit.current) return;

    // Wait for localStorage values to be ready (including preferences)
    if (!cardsPageSizeReady || !setsPageSizeReady || !preferencesReady) {
      return;
    }

    // On set-specific pages, always default to cards view
    const initialView = isSetSpecificPage(pathname) ? 'cards' : (search.get('contentType') === 'cards' ? 'cards' : 'sets');
    
    dispatch(setViewContentType(initialView));

    // Sync Redux from URL or sessionStorage (initialization)
    syncReduxFromUrlOrSession(search, dispatch, cardsPageSize, setsPageSize, pathname, {
      resetBeforeSync: false,  // Don't reset on init, preserve Redux defaults
      forcePageOne: true,      // Always start at page 1 on init
      isNavigation: false,     // Initial load - allow sessionStorage restore
    });

    prevView.current = initialView;
    hasInit.current = true;
  }, [dispatch, search, cardsPageSize, setsPageSize, cardsPageSizeReady, setsPageSizeReady, preferencesReady, pathname]);

  /** ------------------------------------------------------------------
   *  Handle URL changes after initialization
   * ------------------------------------------------------------------ */
  useEffect(() => {
    if (!hasInit.current) return;

    const currentSearchString = search.toString();
    const currentUrl = pathname + (currentSearchString ? `?${currentSearchString}` : '');

    // Skip if URL hasn't changed
    if (currentSearchString === prevSearchParamsString.current) return;

    console.log('[useBrowseStateSync] 🔍 URL change detected:', {
      prev: prevSearchParamsString.current,
      current: currentSearchString,
      lastPushed: lastUrlPushed.current,
      currentUrl,
    });

    // Skip sync if this URL change was initiated by us (Redux→URL sync)
    // This prevents feedback loops where URL→Redux→URL→Redux...
    if (lastUrlPushed.current === currentUrl) {
      console.log('[useBrowseStateSync] ⏭️  Skip sync - we pushed this URL (Redux→URL)', currentUrl);
      prevSearchParamsString.current = currentSearchString;
      return;
    }

    // URL changed externally (user navigation, browser back/forward, shared link)
    // Sync Redux from URL
    console.log('[useBrowseStateSync] 🔗 External URL change - syncing from URL');
    syncReduxFromUrlOrSession(search, dispatch, cardsPageSize, setsPageSize, pathname, {
      resetBeforeSync: true,   // Reset to ensure clean state
      forcePageOne: false,     // Respect page number from URL
      isNavigation: true,      // Navigation - respect empty URL (don't restore from sessionStorage)
    });

    prevSearchParamsString.current = currentSearchString;
  }, [search, dispatch, cardsPageSize, setsPageSize, pathname]);

  /** ------------------------------------------------------------------
   *  When the *view type* changes, rewrite the URL
   * ------------------------------------------------------------------ */
  useEffect(() => {
    if (!hasInit.current || viewType === prevView.current) return;

    // Get current Redux state for the new view
    let state = viewType === 'cards' ? cardState : setState;

    // Check if state is empty (only has metadata/preference fields, no actual search criteria)
    // Exclude: pagination, view preferences, sort preferences, subset display preferences, and the view type itself
    const metadataFields = ['currentPage', 'pageSize', 'viewMode', 'sortBy', 'sortOrder', 'viewContentType', 'showSubsets', 'includeSubsetsInSets'];
    const stateWithoutMeta = Object.keys(state).filter(
      k => !metadataFields.includes(k)
    );

    console.log('[useBrowseStateSync] 🔍 View changed to:', viewType, 'State keys:', Object.keys(state));
    console.log('[useBrowseStateSync] 🔍 State without meta:', stateWithoutMeta);

    const hasSearchData = stateWithoutMeta.some(k => {
      const value = (state as any)[k];
      const hasData = value !== '' && value !== null && value !== undefined &&
             (!Array.isArray(value) || value.length > 0);
      if (hasData) {
        console.log('[useBrowseStateSync] 🔍 Found data in field:', k, '=', value);
      }
      return hasData;
    });

    console.log('[useBrowseStateSync] 🔍 Has search data?', hasSearchData);

    // If state is empty, try to restore from sessionStorage
    if (!hasSearchData) {
      const sessionState = loadSearchState(viewType);
      console.log('[useBrowseStateSync] 🔍 Session state for', viewType, ':', sessionState);
      if (sessionState && Object.keys(sessionState).length > 0) {
        console.log('[useBrowseStateSync] 💾 View changed - restoring from sessionStorage:', sessionState);

        // Update Redux with sessionStorage data
        const pageSize = viewType === 'cards' ? cardsPageSize : setsPageSize;
        if (viewType === 'cards') {
          dispatch(setCardSearchParams({ ...sessionState, currentPage: 1, pageSize }));
        } else {
          dispatch(setSetSearchParams({ ...sessionState, currentPage: 1, pageSize }));
        }

        // Use sessionStorage data to build URL
        state = { ...sessionState, currentPage: 1, pageSize };
      }
    }

    // Build URL from Redux state (or restored sessionStorage data)
    const setSpecificPage = isSetSpecificPage(pathname);
    const params = convertStateToUrlParams(state, viewType, setSpecificPage);

    // Only add contentType if we're not on a set-specific page
    if (!setSpecificPage) {
      params.set('contentType', viewType);
    }

    const url = params.toString() ? `${pathname}?${params}` : pathname;

    console.log('[useBrowseStateSync] 📝 View type changed - updating URL:', url);
    lastUrlPushed.current = url;
    router.push(url, { scroll: false }); // Use push to create history entry

    prevView.current = viewType;
  }, [viewType, cardState, setState, pathname, router, dispatch, cardsPageSize, setsPageSize]);

  /** ------------------------------------------------------------------
   *  When *search state* changes, rewrite the URL (debounced)
   * ------------------------------------------------------------------ */
  useEffect(() => {
    if (!hasInit.current || viewType !== prevView.current) return;

    const sync = debounce(() => {
      const state = viewType === 'cards' ? cardState : setState;
      const setSpecificPage = isSetSpecificPage(pathname);

      // Pass context about the page type to convertStateToUrlParams
      const params = convertStateToUrlParams(state, viewType, setSpecificPage);

      // Only add contentType if we're not on a set-specific page
      if (!setSpecificPage) {
        params.set('contentType', viewType);
      }

      const url = params.toString() ? `${pathname}?${params}` : pathname;

      if (url !== lastUrlPushed.current) {
        lastUrlPushed.current = url;
        router.push(url, { scroll: false }); // Use push to create history entry
      }
    }, DEBOUNCE_URL_SYNC_MS);

    sync();
    return sync.cancel;
  }, [viewType, cardState, setState, pathname, router]);

  /** ------------------------------------------------------------------
   *  4️⃣  Reset currentPage ⇢ 1 when criteria change
   * ------------------------------------------------------------------ */
  const prevCriteria = useRef({ cards: '', sets: '' });

  useEffect(() => {
    if (!hasInit.current) return;

    const stripMeta = ({ currentPage, pageSize, viewMode, ...rest }: any) => rest;

    const cardsJSON = JSON.stringify(stripMeta(cardState));
    const setsJSON = JSON.stringify(stripMeta(setState));

    if (viewType === 'cards' && cardsJSON !== prevCriteria.current.cards) {
      dispatch(setPagination({ currentPage: 1 }));
    } else if (viewType === 'sets' && setsJSON !== prevCriteria.current.sets) {
      dispatch(setPagination({ currentPage: 1 }));
    }

    prevCriteria.current = { cards: cardsJSON, sets: setsJSON };
  }, [viewType, cardState, setState, dispatch]);


  /** ------------------------------------------------------------------
   *  Sync search state to sessionStorage (for F5 refresh restore)
   * ------------------------------------------------------------------ */
  useSearchStateSessionSync(viewType, cardState, setState, hasInit.current);

  const updatePagination = useCallback(
    (update: Partial<BrowsePagination>) => dispatch(setPagination(update)),
    [dispatch],
  );

  const activeState = viewType === 'cards' ? cardState : setState;

  const pageSize = viewType === 'cards' ? cardsPageSize : setsPageSize;

  // Don't return valid pagination until we've initialized with localStorage values
  const isReady = hasInit.current && cardsPageSizeReady && setsPageSizeReady && preferencesReady;

  return {
    pagination: {
      currentPage: activeState.currentPage ?? 1,
      pageSize: pageSize,
      viewMode,
    },
    updatePagination,
    isReady,
  };
}
