'use client';

import { useEffect, useState } from 'react';
import { useGetCardsQuery } from '@/api/browse/browseApi';
import { CardApiParams, CardModel } from '@/api/browse/types';

export type CountType = 'all' | 'mythic' | 'rare' | 'uncommon' | 'common' | 'draftcube';

interface UseFetchCardsForMassImportProps {
  setId: string;
  countType: CountType;
  enabled?: boolean;
  includeSubsetsInSets?: boolean;
}

export const useFetchCardsForMassImport = ({
  setId,
  countType,
  enabled = false,
  includeSubsetsInSets = false,
}: UseFetchCardsForMassImportProps) => {
  const [cardsWithTcgId, setCardsWithTcgId] = useState<CardModel[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const params: CardApiParams = {
    select: ['name', 'tcgplayerName', 'setName', 'setId', 'tcgplayerId', 'rarity', 'code', 'tcgplayerSetCode'],
    limit: 500,
    setId: {
      OR: [setId],
    },
  };

  const {
    data: response,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetCardsQuery(params, {
    skip: !enabled,
  });

  useEffect(() => {
    if (!enabled || !response?.data?.cards) return;

    setIsProcessing(true);

    try {
      let filteredByRarity = response.data.cards;

      if (countType !== 'all' && countType !== 'draftcube') {
        filteredByRarity = response.data.cards.filter(
          (card) => card.rarity && card.rarity.toLowerCase() === countType.toLowerCase(),
        );
      }

      const filteredCards = filteredByRarity.filter((card) => card.tcgplayerId);

      setCardsWithTcgId(filteredCards.length > 0 ? filteredCards : []);
    } catch (err) {
      setCardsWithTcgId([]);
    } finally {
      setIsProcessing(false);
    }
  }, [response, enabled, setId, countType]);

  return {
    cards: cardsWithTcgId,
    isLoading: isFetching || isProcessing,
    isError,
    error,
    refetch,
  };
};
