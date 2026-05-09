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

      // Only TCGPlayer's own abbreviation is trusted here. MTG CB's setCode and the
      // human-readable setName both risk silent mismatches — TCGPlayer would either buy the
      // wrong printing (name-match) or accept a similar-but-wrong abbreviation. When the
      // canonical code is missing, emit a literal "[Unknown Set Code]" so TCGPlayer fails to
      // match and the user notices, rather than ending up with the wrong card.
      const setCode = card.tcgplayerSetCode || 'Unknown Set Code';

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
