import pluralize from '@/utils/pluralize';

// "20 basic lands", "101 common cards (excluding basic lands)", "5 cards" for a history entry.
export const getHistoryRarityText = (rarity: string | undefined, count: number): string => {
  const cardWord = pluralize(count, 'card');
  if (!rarity || rarity === 'all') {
    return cardWord;
  }
  if (rarity === 'basicLand') {
    return pluralize(count, 'basic land');
  }
  if (rarity === 'commonNoBasicLand') {
    return `common ${cardWord} (excluding basic lands)`;
  }
  return `${rarity} ${cardWord}`;
};
