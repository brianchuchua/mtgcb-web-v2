import { applyQuantityPatch } from '../applyQuantityPatch';

describe('applyQuantityPatch', () => {
  const makeCards = () => [
    { id: '604', quantityReg: 0, quantityFoil: 2 },
    { id: '898', quantityReg: 1, quantityFoil: 0 },
  ];

  it('matches a numeric cardId against the string ids the API returns', () => {
    const cards = makeCards();
    applyQuantityPatch(cards, [{ cardId: 604, quantityReg: 3 }]);
    expect(cards[0].quantityReg).toBe(3);
  });

  it('leaves the field that was not sent alone', () => {
    const cards = makeCards();
    applyQuantityPatch(cards, [{ cardId: 604, quantityReg: 3 }]);
    expect(cards[0].quantityFoil).toBe(2);

    applyQuantityPatch(cards, [{ cardId: 898, quantityFoil: 5 }]);
    expect(cards[1]).toEqual({ id: '898', quantityReg: 1, quantityFoil: 5 });
  });

  it('writes both fields when both are sent, including zero', () => {
    const cards = makeCards();
    applyQuantityPatch(cards, [{ cardId: 604, quantityReg: 0, quantityFoil: 0 }]);
    expect(cards[0]).toEqual({ id: '604', quantityReg: 0, quantityFoil: 0 });
  });

  it('ignores cards that are not in the list', () => {
    const cards = makeCards();
    applyQuantityPatch(cards, [{ cardId: 12345, quantityReg: 9 }]);
    expect(cards).toEqual(makeCards());
  });

  it('applies several updates in one call', () => {
    const cards = makeCards();
    applyQuantityPatch(cards, [
      { cardId: 604, quantityReg: 4 },
      { cardId: 898, quantityReg: 2 },
    ]);
    expect(cards.map((c) => c.quantityReg)).toEqual([4, 2]);
  });
});
