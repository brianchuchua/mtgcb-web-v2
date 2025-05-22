import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { useCallback } from 'react';
import { useGetCardsQuery } from '@/api/browse/browseApi';
import { CardModel } from '@/api/browse/types';
import { mapApiCardsToCardItems } from '@/features/browse/mappers';
import { generateCardUrl } from '@/utils/cards/generateCardSlug';
import { buildApiParamsFromSearchParams } from '@/utils/searchParamsConverter';

interface UseCardDataProps {
  searchParams: any;
  pagination: {
    currentPage: number;
    pageSize: number;
  };
  skip: boolean;
}

export function useCardData({ searchParams, pagination, skip }: UseCardDataProps) {
  const router = useRouter();

  const apiArgs = useMemo(() => {
    const params = buildApiParamsFromSearchParams(searchParams, 'cards');
    return {
      ...params,
      limit: pagination.pageSize,
      offset: (pagination.currentPage - 1) * pagination.pageSize,
      sortBy: params.sortBy || 'releasedAt',
      sortDirection: params.sortDirection || ('asc' as const),
      select: [
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
      ] as Array<keyof CardModel>,
    };
  }, [searchParams, pagination]);

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
  };
}
