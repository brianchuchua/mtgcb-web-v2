import debounce from 'lodash.debounce';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectSearchParams } from '@/redux/slices/browseSlice';

export const useSyncBrowseUrl = () => {
  const searchParams = useSelector(selectSearchParams);
  const router = useRouter();
  const pathname = usePathname();
  const currentSearchParams = useSearchParams();

  useEffect(() => {
    const updateUrl = debounce(() => {
      const params = new URLSearchParams();

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

      const newSearch = params.toString();
      const currentSearch = currentSearchParams.toString();

      // Only update URL if the params have actually changed
      if (newSearch !== currentSearch) {
        const newUrl = newSearch ? `${pathname}?${newSearch}` : pathname;
        router.replace(newUrl, { scroll: false });
      }
    }, 300);

    updateUrl();
    return () => updateUrl.cancel();
  }, [searchParams, router, pathname, currentSearchParams]);
};