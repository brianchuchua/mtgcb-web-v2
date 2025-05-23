'use client';

import { useCallback, useState } from 'react';
import { useLazyGetCardsQuery, useLazyGetSetsQuery } from '@/api/browse/browseApi';
import { useLazyGetCollectionCardsQuery } from '@/api/collections/collectionsApi';
import { CollectionCard } from '@/api/collections/types';
import { CardWithQuantity } from '@/utils/tcgplayer/formatMassImportString';

export type CountType = 'all' | 'mythic' | 'rare' | 'uncommon' | 'common' | 'draftcube';

interface UseFetchCardsForMassImportProps {
  setId: string;
  countType: CountType;
  includeSubsetsInSets?: boolean;
  userId?: number;
  count?: number;
}

export const useFetchCardsForMassImport = ({
  setId,
  countType,
  includeSubsetsInSets = false,
  userId,
  count = 1,
}: UseFetchCardsForMassImportProps) => {
  const [isProcessing, setIsProcessing] = useState(false);

  // Use lazy query hooks from RTK Query
  const [getSets, { isLoading: isLoadingSets, error: setsError }] = useLazyGetSetsQuery();
  const [getCards, { isLoading: isLoadingCards, error: cardsError }] = useLazyGetCardsQuery();
  const [getCollectionCards, { isLoading: isLoadingCollection, error: collectionError }] = useLazyGetCollectionCardsQuery();

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

      // Now fetch cards with all the relevant setIds
      const cardsResult = await getCards(
        {
          select: ['id', 'name', 'tcgplayerName', 'setName', 'setId', 'tcgplayerId', 'rarity', 'code', 'tcgplayerSetCode'],
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

      // If userId is provided, fetch collection data and filter out owned cards
      if (userId) {
        const collectionResult = await getCollectionCards(
          {
            userId: userId,
            setId: Number(setId),
            includeSubsetsInSets: includeSubsetsInSets && countType !== 'draftcube',
          },
          true, // Force refetch
        );

        if (collectionResult?.data?.data?.cards) {
          const collectionCards = collectionResult.data.data.cards;
          
          // Create a map of owned cards by cardId with quantities
          const ownedCardsMap = new Map<number, CollectionCard>();
          collectionCards.forEach(card => {
            ownedCardsMap.set(card.cardId, card);
          });

          // Map cards to include needed quantities
          const cardsWithNeededQuantities: CardWithQuantity[] = [];
          
          filteredByRarity.forEach(card => {
            const ownedCard = ownedCardsMap.get(Number(card.id));
            // Count both regular and foil cards
            const ownedQuantity = (ownedCard?.quantityReg || 0) + (ownedCard?.quantityFoil || 0);
            
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
      }

      return filteredByRarity;
    } catch (error) {
      return [];
    } finally {
      setIsProcessing(false);
    }
  }, [setId, countType, includeSubsetsInSets, userId, count, getSets, getCards, getCollectionCards]);

  return {
    fetchCards,
    isLoading: isLoadingSets || isLoadingCards || isLoadingCollection || isProcessing,
    isError: !!setsError || !!cardsError || !!collectionError,
  };
};
