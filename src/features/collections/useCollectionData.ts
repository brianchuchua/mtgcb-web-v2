import { useGetCollectionSummaryQuery } from '@/api/collections/collectionsApi';
import { usePriceType } from '@/hooks/usePriceType';
import { useAppSelector } from '@/redux/hooks';

interface UseCollectionDataProps {
  userId: number;
}

export const useCollectionData = ({ userId }: UseCollectionDataProps) => {
  const priceType = usePriceType();
  const includeSubsetsInSets = useAppSelector(
    (state) => state.browse.setsSearchParams.includeSubsetsInSets ?? false
  );
  
  // Use RTK Query with automatic caching
  const { data: collectionResponse, isLoading } = useGetCollectionSummaryQuery({
    userId,
    priceType: priceType as 'market' | 'low' | 'average' | 'high',
    includeSubsetsInSets,
  });

  return {
    collectionResponse,
    isLoadingCollection: isLoading,
  };
};