import debounce from 'lodash.debounce';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectSearchParams, selectViewContentType } from '@/redux/slices/browseSlice';
import { BrowsePagination } from '@/types/browse';

export const useSyncBrowseUrl = () => {
  const searchParams = useSelector(selectSearchParams);
  const viewContentType = useSelector(selectViewContentType);
  const router = useRouter();
  const pathname = usePathname();
  const currentSearchParams = useSearchParams();

  // Use local pagination instead of from redux
  const [pagination, setPagination] = useState<BrowsePagination>({
    currentPage: parseInt(currentSearchParams.get(viewContentType === 'cards' ? 'cardsPage' : 'setsPage') || '1', 10),
    pageSize: parseInt(
      currentSearchParams.get(viewContentType === 'cards' ? 'cardsPageSize' : 'setsPageSize') || '24',
      10,
    ),
    viewMode: currentSearchParams.get('view') === 'table' ? 'table' : 'grid',
  });

  const prevUrlRef = useRef<string | null>(null);

  const createUrlParams = useCallback(() => {
    // Create new params each time
    // Don't preserve old params - this ensures we properly switch between the two naming formats
    const params = new URLSearchParams();

    // Set content type if we're in sets view (consistent with browse page)
    if (viewContentType === 'sets') {
      params.set('contentType', 'sets');
    }

    // Search params - use different parameter names depending on content type
    if (searchParams.name) {
      if (viewContentType === 'sets') {
        // For sets view, use setName parameter
        params.set('setName', searchParams.name);
      } else {
        // For cards view, use name parameter
        params.set('name', searchParams.name);
      }
    } else {
      // Clear both name parameters if no search name is present
      params.delete('name');
      params.delete('setName');
    }

    if (searchParams.oracleText) {
      params.set('oracleText', searchParams.oracleText);
    }

    if (searchParams.colors) {
      if (searchParams.colors.includeColorless) {
        params.set('colorless', 'true');
      } else if (searchParams.colors.colors.length > 0) {
        params.set('colors', searchParams.colors.colors.join(','));
        params.set('colorMatchType', searchParams.colors.matchType);
      }
    }

    if (searchParams.types) {
      if (searchParams.types.include.length > 0) {
        params.set('includeTypes', searchParams.types.include.join('|'));
      }
      if (searchParams.types.exclude.length > 0) {
        params.set('excludeTypes', searchParams.types.exclude.join('|'));
      }
    }

    if (searchParams.stats) {
      // Format each stat group as: attribute=condition1|condition2
      const statParams = Object.entries(searchParams.stats)
        .filter(([_, conditions]) => conditions.length > 0)
        .map(([attribute, conditions]) => `${attribute}=${conditions.join('|')}`);

      if (statParams.length > 0) {
        params.set('stats', statParams.join(','));
      }
    }

    // Pagination params with content-type specific parameters
    if (pagination.currentPage > 1) {
      params.set(viewContentType === 'cards' ? 'cardsPage' : 'setsPage', pagination.currentPage.toString());
    }

    if (pagination.pageSize !== 24) {
      // Only add if not default
      params.set(viewContentType === 'cards' ? 'cardsPageSize' : 'setsPageSize', pagination.pageSize.toString());
    }

    if (pagination.viewMode !== 'grid') {
      // Only add if not default
      params.set('view', pagination.viewMode);
    }

    return params;
  }, [searchParams, pagination, viewContentType]);

  useEffect(() => {
    const updateUrl = debounce(() => {
      const params = createUrlParams();
      const newSearch = params.toString();
      const currentSearch = currentSearchParams.toString();

      if (newSearch !== currentSearch) {
        const newUrl = newSearch ? `${pathname}?${newSearch}` : pathname;

        if (newUrl !== prevUrlRef.current) {
          prevUrlRef.current = newUrl;
          router.replace(newUrl, { scroll: false });
        }
      }
    }, 300);

    updateUrl();
    return () => updateUrl.cancel();
  }, [createUrlParams, router, pathname, currentSearchParams, viewContentType]);
};
