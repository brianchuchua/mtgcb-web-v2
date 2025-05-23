'use client';

import { CardModel } from '@/api/browse/types';

export interface CardWithQuantity extends CardModel {
  neededQuantity?: number;
}

export const formatMassImportString = (
  cards: (CardModel | CardWithQuantity)[], 
  quantity: number = 1,
  isDraftCube: boolean = false
): string => {
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

      let cardQuantity = quantity;
      
      // Use neededQuantity if provided (for collection context)
      if ('neededQuantity' in card && card.neededQuantity !== undefined) {
        cardQuantity = card.neededQuantity;
      } else if (isDraftCube && card.rarity) {
        // For draft cube, use 4x for commons/uncommons and 1x for rares/mythics
        const rarity = card.rarity.toLowerCase();
        cardQuantity = (rarity === 'common' || rarity === 'uncommon') ? 4 : 1;
      }

      return `${cardQuantity} ${cardName} [${setCode}]`;
    })
    .join('||');
};
