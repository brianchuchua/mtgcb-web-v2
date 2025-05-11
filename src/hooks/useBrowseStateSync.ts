import debounce from 'lodash.debounce';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { convertStateToUrlParams, parseUrlToState } from '@/features/browse/schema/urlStateAdapters';
import { useCardsPageSize } from '@/hooks/useCardsPageSize';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useSetsPageSize } from '@/hooks/useSetsPageSize';
import {
  selectCardSearchParams,
  selectSetSearchParams,
  selectViewContentType,
  setCardSearchParams,
  setPagination,
  setSetSearchParams,
  setViewContentType,
} from '@/redux/slices/browseSlice';
import { BrowsePagination } from '@/types/browse';

export function useBrowseStateSync() {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  const viewType = useSelector(selectViewContentType);
  const cardState = useSelector(selectCardSearchParams);
  const setState = useSelector(selectSetSearchParams);

  const [cardView] = useLocalStorage<'grid' | 'table'>('preferredCardViewMode', 'grid');
  const [setView] = useLocalStorage<'grid' | 'table'>('preferredSetViewMode', 'grid');
  const viewMode = viewType === 'cards' ? cardView : setView;

  const [cardsPageSize] = useCardsPageSize();
  const [setsPageSize] = useSetsPageSize();

  // Track if we need to update Redux state with localStorage values
  const hasLoadedFromLocalStorage = useRef(false);

  const hasInit = useRef(false);
  const prevView = useRef(viewType);
  const lastUrlPushed = useRef<string | undefined>(undefined);

  // TODO: Consider using named functions for useEffects for readability
  // TODO: Still not happy with the readability of this code
  /** ------------------------------------------------------------------
   *  Initialise Redux from the URL exactly once
   * ------------------------------------------------------------------ */
  useEffect(() => {
    if (hasInit.current) return;

    const initialView = search.get('contentType') === 'sets' ? 'sets' : 'cards';
    dispatch(setViewContentType(initialView));

    // Parse URL state but override pagination with localStorage values
    const cardsUrlState = parseUrlToState(search, 'cards');
    const setsUrlState = parseUrlToState(search, 'sets');

    // Initialize with localStorage values for page size
    dispatch(
      setCardSearchParams({
        ...cardsUrlState,
        currentPage: 1,
        pageSize: cardsPageSize,
      }),
    );

    dispatch(
      setSetSearchParams({
        ...setsUrlState,
        currentPage: 1,
        pageSize: setsPageSize,
      }),
    );

    prevView.current = initialView;
    hasInit.current = true;

    // Mark that we've already loaded from localStorage during initialization
    hasLoadedFromLocalStorage.current = true;
  }, [dispatch, search, cardsPageSize, setsPageSize]);

  /** ------------------------------------------------------------------
   *  When the *view type* changes, rewrite the URL
   * ------------------------------------------------------------------ */
  useEffect(() => {
    if (!hasInit.current || viewType === prevView.current) return;

    const params = new URLSearchParams(search);
    params.set('contentType', viewType);

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
      const params = convertStateToUrlParams(state, viewType);
      params.set('contentType', viewType);

      const url = params.toString() ? `${pathname}?${params}` : pathname;
      if (url !== lastUrlPushed.current) {
        lastUrlPushed.current = url;
        router.replace(url, { scroll: false });
      }
    }, 100);

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

  // Ensure Redux state reflects localStorage values
  useEffect(() => {
    if (!hasInit.current || hasLoadedFromLocalStorage.current) return;

    // Update Redux state with localStorage values
    const currentPageSize = viewType === 'cards' ? cardState.pageSize : setState.pageSize;
    const localStoragePageSize = viewType === 'cards' ? cardsPageSize : setsPageSize;

    // Only update if values differ
    if (currentPageSize !== localStoragePageSize) {
      dispatch(setPagination({ pageSize: localStoragePageSize }));
    }

    hasLoadedFromLocalStorage.current = true;
  }, [hasInit, viewType, cardState.pageSize, setState.pageSize, cardsPageSize, setsPageSize, dispatch]);

  const updatePagination = useCallback(
    (update: Partial<BrowsePagination>) => dispatch(setPagination(update)),
    [dispatch],
  );

  const activeState = viewType === 'cards' ? cardState : setState;

  const pageSize = viewType === 'cards' ? cardsPageSize : setsPageSize;

  return {
    pagination: {
      currentPage: activeState.currentPage ?? 1,
      pageSize: pageSize,
      viewMode,
    },
    updatePagination,
  };
}
