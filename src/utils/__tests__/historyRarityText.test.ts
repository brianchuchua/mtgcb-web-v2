import { getHistoryRarityText } from '../historyRarityText';

describe('getHistoryRarityText', () => {
  it.each([
    [undefined, 5, 'cards'],
    ['all', 1, 'card'],
    ['mythic', 3, 'mythic cards'],
    ['common', 121, 'common cards'],
    ['special', 2, 'special cards'],
    ['basicLand', 20, 'basic lands'],
    ['basicLand', 1, 'basic land'],
    ['commonNoBasicLand', 101, 'common cards (excluding basic lands)'],
    ['commonNoBasicLand', 1, 'common card (excluding basic lands)'],
  ])('describes rarity %p with count %p as "%s"', (rarity, count, expected) => {
    expect(getHistoryRarityText(rarity, count)).toBe(expected);
  });
});
