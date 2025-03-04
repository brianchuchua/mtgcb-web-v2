import { CardModel } from '@/api/browse/types';
import { CardItemProps } from '@/components/cards/CardItem';

/**
 * Maps a card from the API model to the CardItem component props
 */
export const mapApiCardToCardItem = (card: CardModel): CardItemProps => {
  return {
    id: card.id,
    name: card.name,
    setCode: card.tcgplayerSetCode?.toLowerCase() || card.setId?.toLowerCase(),
    setName: card.setId || undefined,
    collectorNumber: card.collectorNumber || undefined,
    rarity: card.rarity || undefined,

    // Handle price data
    price:
      card.market || card.average || card.low || card.foil
        ? {
            value: parseFloat(card.market || card.average || card.low || card.foil || '0'),
            isFoil: !!(
              !card.market &&
              !card.average &&
              !card.low &&
              card.foil &&
              card.canBeFoil &&
              !card.canBeNonFoil
            ),
          }
        : undefined,
  };
};

/**
 * Maps an array of API cards to CardItem props
 */
export const mapApiCardsToCardItems = (cards: CardModel[]): CardItemProps[] => {
  return cards.map(mapApiCardToCardItem);
};
