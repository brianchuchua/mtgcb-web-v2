import type { CollectionUpdateRequest } from './types';

interface CachedCardQuantities {
  id: string | number;
  quantityReg?: number;
  quantityFoil?: number;
}

/**
 * Applies a 'set' mode collection update to cached cards, in place (for use
 * inside an RTK Query updateQueryData draft).
 *
 * Card ids come back from the API as strings while update requests use
 * numbers, so ids are compared as strings. Only the fields present in the
 * update are written: a request that sends just quantityFoil must leave the
 * cached quantityReg alone.
 */
export function applyQuantityPatch(
  cards: CachedCardQuantities[],
  updates: CollectionUpdateRequest['cards'],
): void {
  for (const update of updates) {
    const card = cards.find((c) => String(c.id) === String(update.cardId));
    if (!card) continue;
    if (update.quantityReg !== undefined) card.quantityReg = update.quantityReg;
    if (update.quantityFoil !== undefined) card.quantityFoil = update.quantityFoil;
  }
}
