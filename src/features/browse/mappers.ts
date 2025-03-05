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
    setName: card.setName || undefined,
    collectorNumber: card.collectorNumber || undefined,
    rarity: card.rarity || undefined,
    tcgplayerId: card.tcgplayerId || undefined,

    // Handle price data
    prices: {
      // Normal price - check market, average, low in that order
      normal:
        card.market || card.average || card.low
          ? {
              value: parseFloat(card.market || card.average || card.low || '0'),
            }
          : undefined,

      // Foil price if available
      foil: card.foil ? { value: parseFloat(card.foil) } : undefined,
    },
  };
};

/**
 * Maps an array of API cards to CardItem props
 */
export const mapApiCardsToCardItems = (cards: CardModel[]): CardItemProps[] => {
  return cards.map(mapApiCardToCardItem);
};
