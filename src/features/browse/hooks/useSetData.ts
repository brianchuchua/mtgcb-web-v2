import { useRouter } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useGetSetsQuery } from '@/api/browse/browseApi';
import { useGetCostToCompleteQuery } from '@/api/sets/setsApi';
import { mapApiSetsToSetItems } from '@/features/browse/mappers';
import { selectSelectedGoalId, selectShowGoals } from '@/redux/slices/browseSlice';
import { useSetPriceType } from '@/hooks/useSetPriceType';
import { Set } from '@/types/sets';
import { buildApiParamsFromSearchParams } from '@/utils/searchParamsConverter';
import { getCollectionSetUrl } from '@/utils/collectionUrls';

interface UseSetDataProps {
  searchParams: any;
  pagination: {
    currentPage: number;
    pageSize: number;
  };
  skip: boolean;
  includeSubsets: boolean;
  skipCostToComplete?: boolean;
  userId?: number;
}

/**
 * Fetches and processes set data
 * Handles API params, cost-to-complete data, and transforms API data to view model
 */
export function useSetData({ searchParams, pagination, skip, includeSubsets, skipCostToComplete = false, userId }: UseSetDataProps) {
  const router = useRouter();
  const setPriceType = useSetPriceType();
  const selectedGoalId = useSelector(selectSelectedGoalId);
  const showGoals = useSelector(selectShowGoals);

  const apiArgs = useMemo(() => {
    const params = buildApiParamsFromSearchParams(searchParams, 'sets');
    const baseArgs = {
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

    // Add collection parameters if userId is provided
    if (userId) {
      return {
        ...baseArgs,
        userId,
        priceType: setPriceType,
        includeSubsetsInSets: includeSubsets,
        ...(selectedGoalId && { 
          goalId: selectedGoalId,
          ...(showGoals !== 'all' && { showGoals })
        }),
      };
    }

    return baseArgs;
  }, [searchParams, pagination, userId, setPriceType, includeSubsets, selectedGoalId, showGoals]);

  const queryConfig = {
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
      if (userId) {
        router.push(getCollectionSetUrl(userId, set.slug, selectedGoalId));
      } else {
        router.push(`/browse?includeSets=${set.id}`);
      }
    },
    [router, userId, selectedGoalId],
  );

  return {
    items,
    total,
    isLoading,
    error,
    apiArgs,
    costToComplete: costToCompleteData?.data,
    handleSetClick,
    username: setsSearchResult?.data?.username,
    collectionSummary: setsSearchResult?.data ? {
      totalCardsCollected: setsSearchResult.data.totalCardsCollected,
      uniquePrintingsCollected: setsSearchResult.data.uniquePrintingsCollected,
      numberOfCardsInMagic: setsSearchResult.data.numberOfCardsInMagic,
      percentageCollected: setsSearchResult.data.percentageCollected,
      totalValue: setsSearchResult.data.totalValue,
    } : undefined,
    goalSummary: setsSearchResult?.data?.goalSummary,
  };
}
