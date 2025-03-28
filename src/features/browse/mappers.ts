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
    mtgcbCollectorNumber: card.mtgcbCollectorNumber || undefined,
    rarity: card.rarity || undefined,
    tcgplayerId: card.tcgplayerId || undefined,
    powerNumeric: card.powerNumeric || undefined,
    toughnessNumeric: card.toughnessNumeric || undefined,
    loyaltyNumeric: card.loyaltyNumeric || undefined,

    // Raw price values directly from API
    market: card.market,
    low: card.low,
    average: card.average,
    high: card.high,
    foil: card.foil,

    // New format price data
    prices: {
      normal: {
        market: card.market ? parseFloat(card.market) : null,
        low: card.low ? parseFloat(card.low) : null,
        average: card.average ? parseFloat(card.average) : null,
        high: card.high ? parseFloat(card.high) : null,
      },
      foil: card.foil
        ? {
            market: parseFloat(card.foil),
            low: null,
            average: null,
            high: null,
          }
        : null,
    },
  };
};

/**
 * Maps an array of API cards to CardItem props
 */
export const mapApiCardsToCardItems = (cards: CardModel[]): CardItemProps[] => {
  return cards.map(mapApiCardToCardItem);
};
