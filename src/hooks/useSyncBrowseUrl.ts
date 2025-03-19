import debounce from 'lodash.debounce';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectSearchParams } from '@/redux/slices/browseSlice';
import { BrowsePagination } from '@/types/browse';

export const useSyncBrowseUrl = () => {
  const searchParams = useSelector(selectSearchParams);
  const router = useRouter();
  const pathname = usePathname();
  const currentSearchParams = useSearchParams();
  
  // Use local pagination instead of from redux
  const [pagination, setPagination] = useState<BrowsePagination>({
    currentPage: parseInt(currentSearchParams.get('page') || '1', 10),
    pageSize: parseInt(currentSearchParams.get('pageSize') || '24', 10),
    viewMode: currentSearchParams.get('view') === 'table' ? 'table' : 'grid'
  });
  
  const prevUrlRef = useRef<string | null>(null);

  const createUrlParams = useCallback(() => {
    const params = new URLSearchParams();

    // Search params
    if (searchParams.name) {
      params.set('name', searchParams.name);
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
        .map(([attribute, conditions]) => 
          `${attribute}=${conditions.join('|')}`
        );
      
      if (statParams.length > 0) {
        params.set('stats', statParams.join(','));
      }
    }

    // Pagination params
    if (pagination.currentPage > 1) {
      params.set('page', pagination.currentPage.toString());
    }
    
    if (pagination.pageSize !== 24) { // Only add if not default
      params.set('pageSize', pagination.pageSize.toString());
    }
    
    if (pagination.viewMode !== 'grid') { // Only add if not default
      params.set('view', pagination.viewMode);
    }

    return params;
  }, [searchParams, pagination]);

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
  }, [createUrlParams, router, pathname, currentSearchParams]);
};