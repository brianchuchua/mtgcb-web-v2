import debounce from 'lodash.debounce';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';
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
  const urlSearchParams = useSearchParams();

  const viewContentType = useSelector(selectViewContentType);
  const cardSearchParams = useSelector(selectCardSearchParams);
  const setSearchParams = useSelector(selectSetSearchParams);

  const [preferredCardViewMode] = useLocalStorage<'grid' | 'table'>('preferredCardViewMode', 'grid');
  const [preferredSetViewMode] = useLocalStorage<'grid' | 'table'>('preferredSetViewMode', 'grid');

  const currentViewMode = viewContentType === 'cards' ? preferredCardViewMode : preferredSetViewMode;

  const prevUrlRef = useRef<string | null>(null);

  const initializedRef = useRef(false);
  const prevContentTypeRef = useRef(viewContentType);

  useEffect(() => {
    if (initializedRef.current) return;

    const contentTypeParam = urlSearchParams.get('contentType');
    const effectiveContentType = contentTypeParam === 'sets' ? 'sets' : 'cards';

    dispatch(setViewContentType(effectiveContentType));

    const cardParams = parseUrlToState(urlSearchParams, 'cards');

    dispatch(setCardSearchParams(cardParams));

    const setParams = parseUrlToState(urlSearchParams, 'sets');

    dispatch(setSetSearchParams(setParams));

    initializedRef.current = true;
    prevContentTypeRef.current = effectiveContentType;
  }, [urlSearchParams, dispatch]);

  useEffect(() => {
    if (!initializedRef.current) return;

    if (viewContentType !== prevContentTypeRef.current) {
      const params = new URLSearchParams(urlSearchParams.toString());

      params.set('contentType', viewContentType);

      params.delete('view');

      const newContentTypeParam = viewContentType === 'cards' ? 'cardsPage' : 'setsPage';
      const newContentTypeSizeParam = viewContentType === 'cards' ? 'cardsPageSize' : 'setsPageSize';

      const currentParams = viewContentType === 'cards' ? cardSearchParams : setSearchParams;
      const currentPage = currentParams.currentPage || 1;
      const pageSize = currentParams.pageSize || 24;

      if (currentPage > 1) {
        params.set(newContentTypeParam, currentPage.toString());
      } else {
        params.delete(newContentTypeParam);
      }

      if (pageSize !== 24) {
        params.set(newContentTypeSizeParam, pageSize.toString());
      } else {
        params.delete(newContentTypeSizeParam);
      }

      const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.replace(newUrl, { scroll: false });

      prevContentTypeRef.current = viewContentType;
    }
  }, [viewContentType, urlSearchParams, pathname, router, cardSearchParams, setSearchParams]);

  useEffect(() => {
    if (!initializedRef.current) return;

    if (viewContentType !== prevContentTypeRef.current) return;

    const updateUrl = debounce(() => {
      const searchState = viewContentType === 'cards' ? cardSearchParams : setSearchParams;

      const newParams = convertStateToUrlParams(searchState, viewContentType);

      newParams.set('contentType', viewContentType);

      const newSearch = newParams.toString();
      const currentSearch = urlSearchParams.toString();

      if (newSearch !== currentSearch) {
        const newUrl = newSearch ? `${pathname}?${newSearch}` : pathname;

        if (newUrl !== prevUrlRef.current) {
          prevUrlRef.current = newUrl;
          router.replace(newUrl, { scroll: false });
        }
      }
    }, 100);

    updateUrl();
    return () => updateUrl.cancel();
  }, [viewContentType, cardSearchParams, setSearchParams, router, pathname, urlSearchParams]);

  const updatePagination = useCallback(
    (paginationUpdates: Partial<BrowsePagination>) => {
      dispatch(
        setPagination({
          currentPage: paginationUpdates.currentPage,
          pageSize: paginationUpdates.pageSize,
        }),
      );
    },
    [dispatch],
  );

  const currentSearchParams = viewContentType === 'cards' ? cardSearchParams : setSearchParams;

  return {
    pagination: {
      currentPage: currentSearchParams.currentPage || 1,
      pageSize: currentSearchParams.pageSize || 24,
      viewMode: currentViewMode,
    },
    updatePagination,
  };
}
