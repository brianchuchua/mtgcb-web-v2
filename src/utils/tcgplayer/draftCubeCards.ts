import { isBasicLand } from '@/utils/cards/isBasicLand';

// Draft cubes leave basic lands out: sets print too few for 8 players, so players bring their own.
export const removeBasicLandsForDraftCube = <T extends { type?: string | null }>(cards: T[]): T[] =>
  cards.filter((card) => !isBasicLand(card.type));
