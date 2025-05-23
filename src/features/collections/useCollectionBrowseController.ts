import { useEffect, useMemo } from 'react';
import { useGetCollectionSummaryQuery } from '@/api/collections/collectionsApi';
import { CollectionSetSummary } from '@/api/collections/types';
import { BrowseControllerResult } from '@/features/browse/types';
import { useBrowseController } from '@/features/browse/useBrowseController';
import { usePriceType } from '@/hooks/usePriceType';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setViewContentType } from '@/redux/slices/browseSlice';

interface UseCollectionBrowseControllerProps {
  userId: number;
}

export interface CollectionBrowseController extends BrowseControllerResult {
  collectionData: {
    userId: number;
    username: string;
    totalCardsCollected: number;
    uniquePrintingsCollected: number;
    numberOfCardsInMagic: number;
    percentageCollected: number;
    totalValue: number;
    collectionSets: Map<string, CollectionSetSummary>;
  } | null;
  isLoadingCollection: boolean;
}

export const useCollectionBrowseController = ({
  userId,
}: UseCollectionBrowseControllerProps): CollectionBrowseController => {
  const dispatch = useAppDispatch();
  const priceType = usePriceType();
  const includeSubsetsInSets = useAppSelector(
    (state) => state.browse.setsSearchParams.includeSubsetsInSets ?? false
  );
  const browseController = useBrowseController({ skipCostToComplete: true });
  
  // Use RTK Query with automatic caching
  const { data: collectionResponse, isLoading: isLoadingCollection } = useGetCollectionSummaryQuery({
    userId,
    priceType: priceType as 'market' | 'low' | 'average' | 'high',
    includeSubsetsInSets,
  });

  // Force view to sets for collections page
  useEffect(() => {
    dispatch(setViewContentType('sets'));
  }, [dispatch]);

  // Create a map of collection sets by setId for easy lookup
  const collectionSetsMap = useMemo(() => {
    if (!collectionResponse?.data?.sets) return new Map();
    
    const map = new Map<string, CollectionSetSummary>();
    collectionResponse.data.sets.forEach((set) => {
      map.set(set.setId, set);
    });
    return map;
  }, [collectionResponse]);

  const collectionData = useMemo(() => {
    if (!collectionResponse?.data) return null;
    
    return {
      userId: collectionResponse.data.userId,
      username: collectionResponse.data.username,
      totalCardsCollected: collectionResponse.data.totalCardsCollected,
      uniquePrintingsCollected: collectionResponse.data.uniquePrintingsCollected,
      numberOfCardsInMagic: collectionResponse.data.numberOfCardsInMagic,
      percentageCollected: collectionResponse.data.percentageCollected,
      totalValue: collectionResponse.data.totalValue,
      collectionSets: collectionSetsMap,
    };
  }, [collectionResponse, collectionSetsMap]);

  // Override the sets props to include collection data
  const enhancedSetsProps = useMemo(() => {
    return {
      ...browseController.setsProps,
      collectionData,
    };
  }, [browseController.setsProps, collectionData]);

  return {
    ...browseController,
    setsProps: enhancedSetsProps as typeof browseController.setsProps,
    collectionData,
    isLoadingCollection,
  };
};