import debounce from 'lodash.debounce';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
} from '@/redux/slices/browseSlice';
import { BrowsePagination } from '@/types/browse';

// Balance between responsiveness and avoiding URL spam during rapid typing
const DEBOUNCE_URL_SYNC_MS = 100;

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

  // Track if we need to update Redux state with localStorage values
  const hasLoadedFromLocalStorage = useRef(false);

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

    // Parse URL state but override pagination with localStorage values
    const cardsUrlState = parseUrlToState(search, 'cards');
    const setsUrlState = parseUrlToState(search, 'sets');

    // Check if we have any search parameters in the URL (excluding contentType)
    const hasSearchParams = Array.from(search.entries()).some(
      ([key]) => key !== 'contentType'
    );

    if (!hasSearchParams) {
      // No URL params - try to restore from sessionStorage
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
    } else {
      // Initialize with localStorage values for page size
      // Only update fields that are present in the URL, preserving Redux defaults
      if (Object.keys(cardsUrlState).length > 0) {
        dispatch(
          setCardSearchParams({
            ...cardsUrlState,
            currentPage: 1,
            pageSize: cardsPageSize,
          }),
        );
      } else {
        // Just update pagination from localStorage
        dispatch(setCardPagination({ currentPage: 1, pageSize: cardsPageSize }));
      }
      
      // Clear sets filter if not in URL (prevents persistence from set-specific pages)
      const hasIncludeSets = search.has('includeSets');
      const hasExcludeSets = search.has('excludeSets');
      if (!hasIncludeSets && !hasExcludeSets && !cardsUrlState.sets) {
        dispatch(setSets({ include: [], exclude: [] }));
      }

      if (Object.keys(setsUrlState).length > 0) {
        dispatch(
          setSetSearchParams({
            ...setsUrlState,
            currentPage: 1,
            pageSize: setsPageSize,
          }),
        );
      } else {
        // Just update pagination from localStorage, preserve all other defaults
        dispatch(setSetPagination({ currentPage: 1, pageSize: setsPageSize }));
      }
    }

    prevView.current = initialView;
    hasInit.current = true;

    // Mark that we've already loaded from localStorage during initialization
    hasLoadedFromLocalStorage.current = true;
  }, [dispatch, search, cardsPageSize, setsPageSize, cardsPageSizeReady, setsPageSizeReady, preferencesReady, pathname]);

  /** ------------------------------------------------------------------
   *  Handle URL changes after initialization
   * ------------------------------------------------------------------ */
  useEffect(() => {
    if (!hasInit.current) return;

    const currentSearchString = search.toString();
    
    // Skip if URL hasn't changed
    if (currentSearchString === prevSearchParamsString.current) return;

    // Check if search params have been cleared (URL has no params or only contentType)
    const hasSearchParams = Array.from(search.entries()).some(
      ([key]) => key !== 'contentType'
    );

    if (!hasSearchParams) {
      // No URL params - try to restore from sessionStorage
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
    } else {
      // Always reset first to ensure clean state
      dispatch(resetAllSearches());
      
      // Parse the new URL state and update Redux
      const cardsUrlState = parseUrlToState(search, 'cards');
      const setsUrlState = parseUrlToState(search, 'sets');

      // Update cards state if there are card-specific params
      if (Object.keys(cardsUrlState).length > 0) {
        dispatch(
          setCardSearchParams({
            ...cardsUrlState,
            pageSize: cardsPageSize,
          }),
        );
      } else {
        // Even if no card params, still need to set pagination from localStorage
        dispatch(setCardPagination({ pageSize: cardsPageSize }));
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
            pageSize: setsPageSize,
          }),
        );
      } else {
        // Even if no set params, still need to set pagination from localStorage
        dispatch(setSetPagination({ pageSize: setsPageSize }));
      }
    }

    prevSearchParamsString.current = currentSearchString;
  }, [search, dispatch, cardsPageSize, setsPageSize]);

  /** ------------------------------------------------------------------
   *  When the *view type* changes, rewrite the URL
   * ------------------------------------------------------------------ */
  useEffect(() => {
    if (!hasInit.current || viewType === prevView.current) return;

    const params = new URLSearchParams(search);

    // Only add contentType if we're not on a set-specific page
    if (!isSetSpecificPage(pathname)) {
      params.set('contentType', viewType);
    }

    const url = params.toString() ? `${pathname}?${params}` : pathname;
    router.replace(url, { scroll: false });

    prevView.current = viewType;
  }, [viewType, search, pathname, router]);

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
        router.replace(url, { scroll: false });
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
  useEffect(() => {
    if (!hasInit.current) return;

    // Save current search state to sessionStorage
    saveSearchState(viewType, viewType === 'cards' ? cardState : setState);
  }, [viewType, cardState, setState]);

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
