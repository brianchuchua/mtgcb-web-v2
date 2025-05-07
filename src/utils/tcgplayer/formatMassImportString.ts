'use client';

import { CardModel } from '@/api/browse/types';

export const formatMassImportString = (cards: CardModel[], quantity: number = 1): string => {
  if (!cards || cards.length === 0) {
    return '';
  }

  return cards
    .map((card) => {
      const cardName = card.tcgplayerName || card.name;

      let setCode = '';
      if (card.tcgplayerSetCode) {
        setCode = card.tcgplayerSetCode;
      } else if (card.setName) {
        setCode = card.setName;
      } else {
        setCode = 'Unknown Set';
      }

      return `${quantity} ${cardName} [${setCode}]`;
    })
    .join('||');
};
