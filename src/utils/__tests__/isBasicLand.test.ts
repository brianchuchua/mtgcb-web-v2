import { isBasicLand } from '../cards/isBasicLand';

describe('isBasicLand', () => {
  it.each(['Basic Land — Forest', 'Basic Snow Land — Island', 'Basic Land', 'basic land — plains'])(
    'treats "%s" as a basic land',
    (typeLine) => {
      expect(isBasicLand(typeLine)).toBe(true);
    },
  );

  it.each(['Land', 'Legendary Land', 'Snow Land', 'Basic Creature — Shapeshifter', 'Creature — Human', '', null, undefined])(
    'does not treat %p as a basic land',
    (typeLine) => {
      expect(isBasicLand(typeLine)).toBe(false);
    },
  );
});
