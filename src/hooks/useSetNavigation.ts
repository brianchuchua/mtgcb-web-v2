import { useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useGetSetsNavigationQuery } from '@/api/browse/browseApi';

interface UseSetNavigationOptions {
  currentSetId?: string;
  baseUrl?: string;
  preserveParams?: Record<string, string | number | undefined>;
}

export const useSetNavigation = (options: UseSetNavigationOptions) => {
  const { currentSetId, baseUrl, preserveParams = {} } = options;
  const router = useRouter();

  const { data: navigationData, isLoading } = useGetSetsNavigationQuery(
    {
      sortBy: 'releasedAt',
      sortDirection: 'desc',
    },
    {
      skip: !currentSetId,
    },
  );

  const { previousSet, nextSet } = useMemo(() => {
    if (!navigationData?.data?.sets || !currentSetId) {
      return { previousSet: null, nextSet: null };
    }

    const allSets = navigationData.data.sets;
    const currentIndex = allSets.findIndex((s) => s.id === currentSetId);

    if (currentIndex === -1) {
      return { previousSet: null, nextSet: null };
    }

    return {
      previousSet: currentIndex > 0 ? allSets[currentIndex - 1] : null,
      nextSet: currentIndex < allSets.length - 1 ? allSets[currentIndex + 1] : null,
    };
  }, [navigationData, currentSetId]);

  const handleSetNavigation = useCallback(
    (slug: string) => {
      const params = new URLSearchParams();
      Object.entries(preserveParams).forEach(([key, value]) => {
        if (value !== undefined) {
          params.set(key, value.toString());
        }
      });
      const queryString = params.toString();
      
      const url = baseUrl 
        ? `${baseUrl}/${slug}${queryString ? `?${queryString}` : ''}`
        : `/browse/sets/${slug}${queryString ? `?${queryString}` : ''}`;
      
      router.push(url);
    },
    [router, baseUrl, preserveParams],
  );

  return {
    previousSet,
    nextSet,
    handleSetNavigation,
    isLoading,
  };
};