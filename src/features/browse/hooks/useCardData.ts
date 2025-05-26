import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { useCallback } from 'react';
import { useGetCardsQuery } from '@/api/browse/browseApi';
import { CardModel } from '@/api/browse/types';
import { mapApiCardsToCardItems } from '@/features/browse/mappers';
import { usePriceType } from '@/hooks/usePriceType';
import { generateCardUrl } from '@/utils/cards/generateCardSlug';
import { buildApiParamsFromSearchParams } from '@/utils/searchParamsConverter';

interface UseCardDataProps {
  searchParams: any;
  pagination: {
    currentPage: number;
    pageSize: number;
  };
  skip: boolean;
  userId?: number;
}

export function useCardData({ searchParams, pagination, skip, userId }: UseCardDataProps) {
  const router = useRouter();
  const priceType = usePriceType();

  const apiArgs = useMemo(() => {
    const params = buildApiParamsFromSearchParams(searchParams, 'cards');
    const selectFields: Array<keyof CardModel> = [
      'name',
      'setId',
      'setName',
      'tcgplayerId',
      'market',
      'low',
      'average',
      'high',
      'foil',
      'collectorNumber',
      'mtgcbCollectorNumber',
      'rarity',
      'rarityNumeric',
      'type',
      'artist',
      'manaCost',
      'convertedManaCost',
      'powerNumeric',
      'toughnessNumeric',
      'loyaltyNumeric',
      'releaseDate',
    ];
    
    // Add quantity fields when userId is present
    if (userId) {
      selectFields.push('quantityReg', 'quantityFoil');
    }
    
    return {
      ...params,
      ...(userId && { userId, priceType }),
      limit: pagination.pageSize,
      offset: (pagination.currentPage - 1) * pagination.pageSize,
      sortBy: params.sortBy || 'releasedAt',
      sortDirection: params.sortDirection || ('asc' as const),
      select: selectFields,
    };
  }, [searchParams, pagination, userId, priceType]);

  const queryConfig = {
    refetchOnMountOrArgChange: false,
    refetchOnFocus: false,
    refetchOnReconnect: false,
  };

  const {
    data: cardsSearchResult,
    isFetching: isLoading,
    error,
  } = useGetCardsQuery(apiArgs, {
    ...queryConfig,
    skip,
  });

  const items = useMemo(
    () => (cardsSearchResult?.data ? mapApiCardsToCardItems(cardsSearchResult.data.cards || []) : []),
    [cardsSearchResult?.data],
  );

  const total = cardsSearchResult?.data?.totalCount || 0;

  const displayItems = useMemo(() => {
    if (!isLoading) return items;

    return Array(pagination.pageSize)
      .fill(0)
      .map((_, index) => ({
        id: `skeleton-${index}`,
        name: '',
        setName: '',
        collectorNumber: '',
        rarity: '',
        isLoadingSkeleton: true,
      }));
  }, [items, isLoading, pagination.pageSize]);

  const handleCardClick = useCallback(
    (cardId: string, cardName?: string) => {
      if (cardName) {
        const cardUrl = generateCardUrl(cardName, cardId);
        router.push(cardUrl);
      } else {
        router.push(`/browse/cards/unknown/${cardId}`);
      }
    },
    [router],
  );

  return {
    items: displayItems,
    rawItems: items,
    total,
    isLoading,
    error,
    apiArgs,
    handleCardClick,
    username: cardsSearchResult?.data?.username,
    collectionSummary: cardsSearchResult?.data ? {
      totalCardsCollected: cardsSearchResult.data.totalCardsCollected,
      uniquePrintingsCollected: cardsSearchResult.data.uniquePrintingsCollected,
      numberOfCardsInMagic: cardsSearchResult.data.numberOfCardsInMagic,
      percentageCollected: cardsSearchResult.data.percentageCollected,
      totalValue: cardsSearchResult.data.totalValue,
    } : undefined,
  };
}
