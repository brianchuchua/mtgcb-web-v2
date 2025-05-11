import debounce from 'lodash.debounce';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { convertStateToUrlParams, parseUrlToState } from '@/features/browse/schema/urlStateAdapters';
import { useLocalStorage } from '@/hooks/useLocalStorage';
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

  const hasInit = useRef(false);
  const prevView = useRef(viewType);
  const lastUrlPushed = useRef<string | undefined>(undefined);

  // TODO: Consider using named functions for useEffects for readability
  /** ------------------------------------------------------------------
   *  Initialise Redux from the URL exactly once
   * ------------------------------------------------------------------ */
  useEffect(() => {
    if (hasInit.current) return;

    const initialView = search.get('contentType') === 'sets' ? 'sets' : 'cards';
    dispatch(setViewContentType(initialView));

    dispatch(setCardSearchParams({ ...parseUrlToState(search, 'cards'), currentPage: 1 }));
    dispatch(setSetSearchParams({ ...parseUrlToState(search, 'sets'), currentPage: 1 }));

    prevView.current = initialView;
    hasInit.current = true;
  }, [dispatch, search]);

  /** ------------------------------------------------------------------
   *  When the *view type* changes, rewrite the URL
   * ------------------------------------------------------------------ */
  useEffect(() => {
    if (!hasInit.current || viewType === prevView.current) return;

    const params = new URLSearchParams(search);
    params.set('contentType', viewType);
    params.delete('view'); // old viewMode param no longer valid

    const { pageSize = 24 } = viewType === 'cards' ? cardState : setState;
    const sizeKey = viewType === 'cards' ? 'cardsPageSize' : 'setsPageSize';
    pageSize !== 24 ? params.set(sizeKey, `${pageSize}`) : params.delete(sizeKey);

    const url = params.toString() ? `${pathname}?${params}` : pathname;
    router.replace(url, { scroll: false });

    prevView.current = viewType;
  }, [viewType, search, pathname, router, cardState, setState]);

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
   *  4️⃣  Reset currentPage ⇢ 1 when criteria change
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

  const updatePagination = useCallback(
    (update: Partial<BrowsePagination>) => dispatch(setPagination(update)),
    [dispatch],
  );

  const activeState = viewType === 'cards' ? cardState : setState;

  return {
    pagination: {
      currentPage: activeState.currentPage ?? 1,
      pageSize: activeState.pageSize ?? 24,
      viewMode,
    },
    updatePagination,
  };
}
