'use client';

import { useCallback, useState } from 'react';
import { useLazyGetCardsQuery, useLazyGetSetsQuery } from '@/api/browse/browseApi';

export type CountType = 'all' | 'mythic' | 'rare' | 'uncommon' | 'common' | 'draftcube';

interface UseFetchCardsForMassImportProps {
  setId: string;
  countType: CountType;
  includeSubsetsInSets?: boolean;
}

export const useFetchCardsForMassImport = ({
  setId,
  countType,
  includeSubsetsInSets = false,
}: UseFetchCardsForMassImportProps) => {
  const [isProcessing, setIsProcessing] = useState(false);

  // Use lazy query hooks from RTK Query
  const [getSets, { isLoading: isLoadingSets, error: setsError }] = useLazyGetSetsQuery();
  const [getCards, { isLoading: isLoadingCards, error: cardsError }] = useLazyGetCardsQuery();

  const fetchCards = useCallback(async () => {
    setIsProcessing(true);

    try {
      let allSetIds = [setId];

      // If we need to include subsets AND this is not a draft cube, fetch them first
      // Draft cubes should only be from the main set, never include subsets
      if (includeSubsetsInSets && countType !== 'draftcube') {
        const setsResult = await getSets(
          {
            [setId]: true,
            limit: 100,
          },
          true, // Force refetch
        );

        if (setsResult.data && setsResult.data.data && setsResult.data.data.sets && setsResult.data.data.sets.length > 0) {
          const subsetIds = setsResult.data.data.sets.map((set) => set.id);
          allSetIds = [setId, ...subsetIds];
        }
      }

      // Now fetch cards with all the relevant setIds
      const cardsResult = await getCards(
        {
          select: ['name', 'tcgplayerName', 'setName', 'setId', 'tcgplayerId', 'rarity', 'code', 'tcgplayerSetCode'],
          limit: 500,
          setId: {
            OR: allSetIds,
          },
        },
        true, // Force refetch
      );

      if (!cardsResult.data?.data?.cards) {
        return [];
      }

      // Filter by rarity if needed
      let filteredByRarity = cardsResult.data.data.cards;
      if (countType !== 'all' && countType !== 'draftcube') {
        filteredByRarity = cardsResult.data.data.cards.filter(
          (card) => card.rarity && card.rarity.toLowerCase() === countType.toLowerCase(),
        );
      }

      const filteredCards = filteredByRarity;
      return filteredCards;
    } catch (error) {
      return [];
    } finally {
      setIsProcessing(false);
    }
  }, [setId, countType, includeSubsetsInSets, getSets, getCards]);

  return {
    fetchCards,
    isLoading: isLoadingSets || isLoadingCards || isProcessing,
    isError: !!setsError || !!cardsError,
  };
};
