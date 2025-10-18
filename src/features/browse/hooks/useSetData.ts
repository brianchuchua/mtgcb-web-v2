import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useGetSetsQuery } from '@/api/browse/browseApi';
import { useGetCostToCompleteQuery } from '@/api/sets/setsApi';
import { mapApiSetsToSetItems } from '@/features/browse/mappers';
import { selectSelectedGoalId, selectShowGoals } from '@/redux/slices/browse';
import { useSetPriceType } from '@/hooks/useSetPriceType';
import { Set } from '@/types/sets';
import { buildApiParamsFromSearchParams } from '@/utils/searchParamsConverter';
import { getCollectionSetUrl } from '@/utils/collectionUrls';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setCompilationState } from '@/redux/slices/compilationSlice';

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
      sortDirection: params.sortDirection || ('desc' as const),
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
      const result = {
        ...baseArgs,
        userId,
        priceType: setPriceType,
        includeSubsetsInSets: includeSubsets,
        ...(selectedGoalId && { 
          goalId: selectedGoalId,
          ...(showGoals !== 'all' && { showGoals })
        }),
      };
      
      return result;
    }

    return baseArgs;
  }, [searchParams, pagination, userId, setPriceType, includeSubsets, selectedGoalId, showGoals]);

  const queryConfig = {
    refetchOnFocus: false,
    refetchOnReconnect: false,
  };

  const dispatch = useAppDispatch();
  const compilationState = useAppSelector((state) => state.compilation);

  const {
    data: setsSearchResult,
    isFetching: isLoading,
    error,
    refetch,
  } = useGetSetsQuery(apiArgs, {
    ...queryConfig,
    skip,
  });

  // Handle compilation state detection
  useEffect(() => {
    // Don't handle compilation state if this hook is skipped
    if (skip) return;
    
    // Only handle compilation if we actually have a goalId in the request
    const hasGoalInRequest = selectedGoalId && userId;
    
    if (setsSearchResult?.data?.compilationInProgress) {
      dispatch(setCompilationState({
        isCompiling: true,
        message: setsSearchResult.data.message || 'Your collection goal is being updated...',
        goalId: hasGoalInRequest ? selectedGoalId : null,
      }));
    } else if (hasGoalInRequest && compilationState.isCompiling && compilationState.goalId === selectedGoalId && setsSearchResult?.data) {
      // Only clear if we have a response AND it's not showing compilation
      dispatch(setCompilationState({
        isCompiling: false,
        message: null,
        goalId: null,
      }));
    }
  }, [setsSearchResult, selectedGoalId, userId, compilationState.isCompiling, compilationState.goalId, dispatch, skip]);

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
    refetch,
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
