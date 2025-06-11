'use client';

import { useCallback, useState } from 'react';
import { useLazyGetCardsQuery, useLazyGetSetsQuery } from '@/api/browse/browseApi';
import { CardWithQuantity } from '@/utils/tcgplayer/formatMassImportString';

export type CountType = 'all' | 'mythic' | 'rare' | 'uncommon' | 'common' | 'draftcube';

interface UseFetchCardsForMassImportProps {
  setId: string;
  countType: CountType;
  includeSubsetsInSets?: boolean;
  userId?: number;
  count?: number;
  goalId?: number;
  priceType?: 'market' | 'low' | 'average' | 'high';
}

export const useFetchCardsForMassImport = ({
  setId,
  countType,
  includeSubsetsInSets = false,
  userId,
  count = 1,
  goalId,
  priceType = 'market',
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
            parentSetId: setId,
          },
          true, // Force refetch
        );

        if (setsResult?.data?.data?.sets && setsResult?.data?.data?.sets?.length > 0) {
          const subsetIds = setsResult.data.data.sets.map((set) => set.id);
          allSetIds = [setId, ...subsetIds];
        }
      }

      // Fetch all cards with pagination support
      let allCards: any[] = [];
      let offset = 0;
      const limit = 500;
      let hasMore = true;

      while (hasMore) {
        const cardsResult = await getCards(
          {
            select: userId 
              ? ['id', 'name', 'tcgplayerName', 'setName', 'setId', 'tcgplayerId', 'rarity', 'code', 'tcgplayerSetCode', 'quantityReg', 'quantityFoil']
              : ['id', 'name', 'tcgplayerName', 'setName', 'setId', 'tcgplayerId', 'rarity', 'code', 'tcgplayerSetCode'],
            limit,
            offset,
            setId: {
              OR: allSetIds,
            },
            // Add rarity filter for non-all and non-draftcube types
            ...(countType !== 'all' && countType !== 'draftcube' && {
              rarity: countType,
            }),
            // Add userId, goalId, and priceType if provided
            ...(userId && { userId }),
            ...(userId && goalId && { goalId }),
            ...(userId && { priceType }),
          },
          true, // Force refetch
        );

        if (!cardsResult.data?.data?.cards) {
          break;
        }

        allCards = [...allCards, ...cardsResult.data.data.cards];
        
        // Check if there are more cards to fetch
        const totalCount = cardsResult.data.data.totalCount || 0;
        offset += limit;
        hasMore = offset < totalCount;
      }

      if (allCards.length === 0) {
        return [];
      }

      // If userId is provided, filter out cards based on ownership
      if (userId) {
        // Map cards to include needed quantities
        const cardsWithNeededQuantities: CardWithQuantity[] = [];
        
        allCards.forEach(card => {
          // Count both regular and foil cards
          const ownedQuantity = (card.quantityReg || 0) + (card.quantityFoil || 0);
          
          let targetQuantity = count; // Use the count parameter (1 for Buy 1x, 4 for Buy 4x)
          
          // For draft cube, determine target quantity based on rarity
          if (countType === 'draftcube') {
            const rarity = card.rarity?.toLowerCase();
            targetQuantity = (rarity === 'common' || rarity === 'uncommon') ? 4 : 1;
          }
          
          const neededQuantity = targetQuantity - ownedQuantity;
          
          // Only include cards where we need more copies
          if (neededQuantity > 0) {
            cardsWithNeededQuantities.push({
              ...card,
              neededQuantity: neededQuantity,
            });
          }
        });
        
        return cardsWithNeededQuantities;
      }

      return allCards;
    } catch (error) {
      return [];
    } finally {
      setIsProcessing(false);
    }
  }, [setId, countType, includeSubsetsInSets, userId, count, goalId, priceType, getSets, getCards]);

  return {
    fetchCards,
    isLoading: isLoadingSets || isLoadingCards || isProcessing,
    isError: !!setsError || !!cardsError,
  };
};
