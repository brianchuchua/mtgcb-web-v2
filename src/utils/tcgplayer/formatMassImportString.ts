'use client';

import { CardModel } from '@/api/browse/types';

export interface CardWithQuantity extends CardModel {
  neededQuantity?: number;
}

export const formatMassImportString = (
  cards: (CardModel | CardWithQuantity)[],
  quantity: number = 1,
  isDraftCube: boolean = false,
  draftCubeVariant: 'standard' | 'two-uncommon' = 'standard'
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
        // For draft cube, use quantities based on rarity and variant
        const rarity = card.rarity.toLowerCase();
        if (rarity === 'common') {
          cardQuantity = 4;
        } else if (rarity === 'uncommon') {
          cardQuantity = draftCubeVariant === 'two-uncommon' ? 2 : 4;
        } else {
          cardQuantity = 1; // rare or mythic
        }
      }

      return `${cardQuantity} ${cardName} [${setCode}]`;
    })
    .join('||');
};
