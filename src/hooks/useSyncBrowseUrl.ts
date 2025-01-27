import debounce from 'lodash.debounce';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectSearchParams } from '@/redux/slices/browseSlice';

export const useSyncBrowseUrl = () => {
  const searchParams = useSelector(selectSearchParams);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const updateUrl = debounce(() => {
      const params = new URLSearchParams();

      if (searchParams.name) {
        params.set('name', searchParams.name);
      }
      
      if (searchParams.oracleText) {
        params.set('oracleText', searchParams.oracleText);
      }

      const search = params.toString();
      const newUrl = search ? `${pathname}?${search}` : pathname;

      router.replace(newUrl, { scroll: false });
    }, 400);

    updateUrl();
    return () => updateUrl.cancel();
  }, [searchParams, router, pathname]);
};