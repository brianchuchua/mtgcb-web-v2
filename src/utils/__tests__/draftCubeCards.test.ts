import { removeBasicLandsForDraftCube } from '../tcgplayer/draftCubeCards';

describe('removeBasicLandsForDraftCube', () => {
  it('drops basic lands, snow basics and Wastes but keeps every other card', () => {
    const cards = [
      { id: 1, rarity: 'common', type: 'Creature — Human Soldier' },
      { id: 2, rarity: 'common', type: 'Basic Land — Plains' },
      { id: 3, rarity: 'common', type: 'Basic Snow Land — Island' },
      { id: 4, rarity: 'common', type: 'Basic Land' },
      { id: 5, rarity: 'common', type: 'Land' },
      { id: 6, rarity: 'rare', type: 'Basic Land — Forest' },
      { id: 7, rarity: 'uncommon', type: null },
    ];

    expect(removeBasicLandsForDraftCube(cards).map((card) => card.id)).toEqual([1, 5, 7]);
  });

  it('returns an empty list unchanged', () => {
    expect(removeBasicLandsForDraftCube([])).toEqual([]);
  });
});
