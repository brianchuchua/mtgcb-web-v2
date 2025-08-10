import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useGetCardsQuery } from '@/api/browse/browseApi';
import { CardModel } from '@/api/browse/types';
import { mapApiCardsToCardItems } from '@/features/browse/mappers';
import { selectSelectedGoalId, selectShowGoals, selectSelectedLocationId, selectIncludeChildLocations } from '@/redux/slices/browseSlice';
import { usePriceType } from '@/hooks/usePriceType';
import { generateCardUrl } from '@/utils/cards/generateCardSlug';
import { buildApiParamsFromSearchParams } from '@/utils/searchParamsConverter';
import { useCardDisplaySettings, useCollectionSettings } from '@/contexts/DisplaySettingsContext';
import { getCollectionCardUrl } from '@/utils/collectionUrls';

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
  const selectedGoalId = useSelector(selectSelectedGoalId);
  const showGoals = useSelector(selectShowGoals);
  const selectedLocationId = useSelector(selectSelectedLocationId);
  const includeChildLocations = useSelector(selectIncludeChildLocations);
  const cardDisplaySettings = useCardDisplaySettings();
  const collectionSettings = useCollectionSettings();

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
      'canBeFoil',
      'canBeNonFoil',
    ];
    
    // Add quantity fields when userId is present
    if (userId) {
      selectFields.push('quantityReg', 'quantityFoil');
      if (cardDisplaySettings.locationsIsVisible || collectionSettings.tableLocationsIsVisible) {
        selectFields.push('locations');
      }
    }
    
    // Add goal progress fields when goal is selected
    if (selectedGoalId && userId) {
      selectFields.push(
        'goalTargetQuantityReg',
        'goalTargetQuantityFoil',
        'goalTargetQuantityAll',
        'goalRegMet',
        'goalFoilMet',
        'goalAllMet',
        'goalFullyMet',
        'goalRegNeeded',
        'goalFoilNeeded',
        'goalAllNeeded',
        // Cross-set goal tracking fields
        'goalMetByOtherSets',
        'goalContributingSetIds',
        'goalContributingVersions'
      );
    }
    
    return {
      ...params,
      ...(userId && { 
        userId, 
        priceType,
        includeLocations: cardDisplaySettings.locationsIsVisible || collectionSettings.tableLocationsIsVisible
      }),
      ...(selectedGoalId && userId && { 
        goalId: selectedGoalId,
        showGoalProgress: true,
        ...(showGoals !== 'all' && { showGoals })
      }),
      ...(selectedLocationId && userId && { 
        locationId: selectedLocationId,
        includeChildLocations
      }),
      limit: pagination.pageSize,
      offset: (pagination.currentPage - 1) * pagination.pageSize,
      sortBy: params.sortBy || 'releasedAt',
      sortDirection: params.sortDirection || ('asc' as const),
      select: selectFields,
    };
  }, [searchParams, pagination, userId, priceType, selectedGoalId, showGoals, selectedLocationId, includeChildLocations, cardDisplaySettings.locationsIsVisible, collectionSettings.tableLocationsIsVisible]);

  const queryConfig = {
    refetchOnFocus: false,
    refetchOnReconnect: false,
  };

  const {
    data: cardsSearchResult,
    isLoading,
    isFetching,
    error,
  } = useGetCardsQuery(apiArgs, {
    ...queryConfig,
    skip,
  });

  const items = useMemo(
    () => {
      if (cardsSearchResult?.data) {
        return mapApiCardsToCardItems(cardsSearchResult.data.cards || []);
      }
      return [];
    },
    // Include a more specific dependency that will change when data updates
    [cardsSearchResult?.data?.cards],
  );

  const total = cardsSearchResult?.data?.totalCount || 0;

  const displayItems = items;

  const handleCardClick = useCallback(
    (cardId: string, cardName?: string) => {
      // Generate the slug part of the URL
      const cardSlug = cardName ? cardName.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') : 'unknown';
      
      // Context-aware navigation: if we have a userId, navigate to collection context
      const cardUrl = userId 
        ? getCollectionCardUrl(userId, cardSlug, cardId)
        : `/browse/cards/${cardSlug}/${cardId}`;
      
      router.push(cardUrl);
    },
    [router, userId],
  );

  return {
    items: displayItems,
    rawItems: items,
    total,
    isLoading: isLoading && !cardsSearchResult, // Only true on initial load
    isFetching,
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
    goalSummary: cardsSearchResult?.data?.goalSummary,
  };
}
