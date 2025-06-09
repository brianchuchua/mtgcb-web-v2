import { CardModel } from '@/api/browse/types';
import { CardItemProps } from '@/components/cards/CardItem';
import { Set } from '@/types/sets';

/**
 * Maps cards from the API to the format used by CardItem components
 */
export const mapApiCardsToCardItems = (cards: CardModel[]): CardItemProps[] => {
  return cards.map((card) => ({
    id: card.id,
    name: card.name,
    setId: card.setId,
    setName: card.setName,
    setSlug: card.setSlug,
    collectorNumber: card.collectorNumber,
    mtgcbCollectorNumber: card.mtgcbCollectorNumber || undefined,
    rarity: card.rarity,
    rarityNumeric: card.rarityNumeric,
    type: card.type,
    artist: card.artist || '',
    manaCost: card.manaCost || '',
    convertedManaCost: card.convertedManaCost?.toString() || '',
    powerNumeric: card.powerNumeric || undefined,
    toughnessNumeric: card.toughnessNumeric || undefined,
    loyaltyNumeric: card.loyaltyNumeric || undefined,
    market: card.market,
    low: card.low,
    average: card.average,
    high: card.high,
    foil: card.foil,
    prices: card.prices || {
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
    tcgplayerId: card.tcgplayerId !== null ? card.tcgplayerId : undefined,
    releaseDate: card.releaseDate,
    // Include quantity fields if present
    quantityReg: card.quantityReg,
    quantityFoil: card.quantityFoil,
    // Include goal progress fields if present
    goalTargetQuantityReg: card.goalTargetQuantityReg,
    goalTargetQuantityFoil: card.goalTargetQuantityFoil,
    goalTargetQuantityAll: card.goalTargetQuantityAll,
    goalRegMet: card.goalRegMet,
    goalFoilMet: card.goalFoilMet,
    goalAllMet: card.goalAllMet,
    goalFullyMet: card.goalFullyMet,
    goalRegNeeded: card.goalRegNeeded,
    goalFoilNeeded: card.goalFoilNeeded,
    goalAllNeeded: card.goalAllNeeded,
  }));
};

/**
 * Maps sets from the API to the format used by SetItem components
 */
export const mapApiSetsToSetItems = (sets: Set[]): Set[] => {
  // The SetModel from the API already matches our Set interface
  // This mapper exists for consistency and potential future transformations
  return sets.map((set) => ({
    ...set,
  }));
};
