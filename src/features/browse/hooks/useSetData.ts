import { useRouter } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { useGetSetsQuery } from '@/api/browse/browseApi';
import { useGetCostToCompleteQuery } from '@/api/sets/setsApi';
import { mapApiSetsToSetItems } from '@/features/browse/mappers';
import { useSetPriceType } from '@/hooks/useSetPriceType';
import { Set } from '@/types/sets';
import { buildApiParamsFromSearchParams } from '@/utils/searchParamsConverter';

interface UseSetDataProps {
  searchParams: any;
  pagination: {
    currentPage: number;
    pageSize: number;
  };
  skip: boolean;
  includeSubsets: boolean;
  skipCostToComplete?: boolean;
}

/**
 * Fetches and processes set data
 * Handles API params, cost-to-complete data, and transforms API data to view model
 */
export function useSetData({ searchParams, pagination, skip, includeSubsets, skipCostToComplete = false }: UseSetDataProps) {
  const router = useRouter();
  const setPriceType = useSetPriceType();

  const apiArgs = useMemo(() => {
    const params = buildApiParamsFromSearchParams(searchParams, 'sets');
    return {
      ...params,
      limit: pagination.pageSize,
      offset: (pagination.currentPage - 1) * pagination.pageSize,
      sortBy: params.sortBy || 'releasedAt',
      sortDirection: params.sortDirection || ('asc' as const),
      select: [
        'name',
        'slug',
        'code',
        'setType',
        'category',
        'releasedAt',
        'cardCount',
        'isDraftable',
        'sealedProductUrl',
      ],
    };
  }, [searchParams, pagination]);

  const queryConfig = {
    refetchOnMountOrArgChange: false,
    refetchOnFocus: false,
    refetchOnReconnect: false,
  };

  const {
    data: setsSearchResult,
    isFetching: isLoading,
    error,
  } = useGetSetsQuery(apiArgs, {
    ...queryConfig,
    skip,
  });

  const { data: costToCompleteData } = useGetCostToCompleteQuery(
    {
      priceType: setPriceType,
      includeSubsetsInSets: includeSubsets,
    },
    { ...queryConfig, skip: skip || skipCostToComplete },
  );

  const items = useMemo(
    () => (setsSearchResult?.data ? mapApiSetsToSetItems(setsSearchResult.data.sets || []) : []),
    [setsSearchResult?.data],
  );

  const total = setsSearchResult?.data?.totalCount || 0;

  const handleSetClick = useCallback(
    (set: Set) => {
      router.push(`/browse?includeSets=${set.id}`);
    },
    [router],
  );

  return {
    items,
    total,
    isLoading,
    error,
    apiArgs,
    costToComplete: costToCompleteData?.data,
    handleSetClick,
  };
}
