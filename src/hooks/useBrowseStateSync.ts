import debounce from 'lodash.debounce';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchStateSessionSync } from './browse/useSearchStateSessionSync';
import { convertStateToUrlParams, parseUrlToState } from '@/features/browse/schema/urlStateAdapters';
import { useCardsPageSize } from '@/hooks/useCardsPageSize';
import { useSetsPageSize } from '@/hooks/useSetsPageSize';
import { usePreferredCardViewMode, usePreferredSetViewMode } from '@/contexts/DisplaySettingsContext';
import { useBrowsePreferencesReady, usePreferredViewContentType } from '@/hooks/useBrowsePreferences';
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
      dispatch(setViewContentType(contentTypeFromUrl));
    } else if (!isSetSpecificPage(pathname)) {
      // No contentType in URL and not on set page → default to sets
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
      dispatch(resetAllSearches());
      dispatch(setCardPagination({ pageSize: cardsPageSize }));
      dispatch(setSetPagination({ pageSize: setsPageSize }));
    } else {
      // Initial load with no URL params - try to restore from sessionStorage
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
  const [preferredViewContentType, setPreferredViewContentType] = usePreferredViewContentType();
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

    // Determine initial view with priority order:
    // 1. Set-specific pages force 'cards' (don't save to preference)
    // 2. URL param overrides preference (save to preference)
    // 3. localStorage preference
    // 4. Default to 'sets'

    const setSpecificPage = isSetSpecificPage(pathname);
    const contentTypeFromUrl = search.get('contentType');

    let initialView: 'cards' | 'sets';
    let shouldSavePreference = false;

    if (setSpecificPage) {
      // Set-specific pages always show cards (forced by page context)
      initialView = 'cards';
      shouldSavePreference = false; // Don't save forced context
    } else if (contentTypeFromUrl === 'cards' || contentTypeFromUrl === 'sets') {
      // URL param present - respect it and save to preference
      initialView = contentTypeFromUrl;
      shouldSavePreference = true;
    } else {
      // No URL param, not on set page - use localStorage preference
      initialView = preferredViewContentType;
      shouldSavePreference = false; // Already saved, don't re-save
    }

    dispatch(setViewContentType(initialView));

    // Save preference if URL param was used
    if (shouldSavePreference && initialView !== preferredViewContentType) {
      setPreferredViewContentType(initialView);
    }

    // Sync Redux from URL or sessionStorage (initialization)
    syncReduxFromUrlOrSession(search, dispatch, cardsPageSize, setsPageSize, pathname, {
      resetBeforeSync: false,  // Don't reset on init, preserve Redux defaults
      forcePageOne: true,      // Always start at page 1 on init
      isNavigation: false,     // Initial load - allow sessionStorage restore
    });

    prevView.current = initialView;
    hasInit.current = true;
  }, [dispatch, search, cardsPageSize, setsPageSize, cardsPageSizeReady, setsPageSizeReady, preferencesReady, pathname, preferredViewContentType, setPreferredViewContentType]);

  /** ------------------------------------------------------------------
   *  Handle URL changes after initialization
   * ------------------------------------------------------------------ */
  useEffect(() => {
    if (!hasInit.current) return;

    const currentSearchString = search.toString();
    const currentUrl = pathname + (currentSearchString ? `?${currentSearchString}` : '');

    // Skip if URL hasn't changed
    if (currentSearchString === prevSearchParamsString.current) return;

    // Skip sync if this URL change was initiated by us (Redux→URL sync)
    // This prevents feedback loops where URL→Redux→URL→Redux...
    if (lastUrlPushed.current === currentUrl) {
      prevSearchParamsString.current = currentSearchString;
      return;
    }

    // URL changed externally (user navigation, browser back/forward, shared link)
    // Sync Redux from URL
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

    const hasSearchData = stateWithoutMeta.some(k => {
      const value = (state as any)[k];
      const hasData = value !== '' && value !== null && value !== undefined &&
             (!Array.isArray(value) || value.length > 0);
      return hasData;
    });

    // Always try to merge sessionStorage data with current Redux state
    // This handles the case where URL has shared fields (like goalId) but sessionStorage
    // has view-specific fields (like locationId for cards)
    const sessionState = loadSearchState(viewType);

    if (sessionState && Object.keys(sessionState).length > 0) {

      // Merge: Redux state (from URL) + sessionStorage data
      const pageSize = viewType === 'cards' ? cardsPageSize : setsPageSize;
      const mergedState = { ...state, ...sessionState, currentPage: 1, pageSize };

      // Update Redux with merged data
      if (viewType === 'cards') {
        dispatch(setCardSearchParams(mergedState));
      } else {
        dispatch(setSetSearchParams(mergedState));
      }

      // Use merged data to build URL
      state = mergedState;
    }

    // Build URL from Redux state (or restored sessionStorage data)
    const setSpecificPage = isSetSpecificPage(pathname);
    const params = convertStateToUrlParams(state, viewType, setSpecificPage);

    // Only add contentType if we're not on a set-specific page
    if (!setSpecificPage) {
      params.set('contentType', viewType);
    }

    const url = params.toString() ? `${pathname}?${params}` : pathname;

    lastUrlPushed.current = url;
    router.push(url, { scroll: false }); // Use push to create history entry

    prevView.current = viewType;
  }, [viewType, cardState, setState, pathname, router, dispatch, cardsPageSize, setsPageSize]);

  /** ------------------------------------------------------------------
   *  Save viewContentType preference to localStorage when it changes
   * ------------------------------------------------------------------ */
  useEffect(() => {
    if (!hasInit.current) return;

    // Only save if user explicitly changed view on a browse page
    // Don't save if we're on a set-specific page (forced context)
    const setSpecificPage = isSetSpecificPage(pathname);

    if (!setSpecificPage && viewType !== preferredViewContentType) {
      setPreferredViewContentType(viewType);
    }
  }, [viewType, pathname, preferredViewContentType, setPreferredViewContentType]);

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
