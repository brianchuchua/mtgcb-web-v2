import { CardModel } from '@/api/browse/types';
import { mapApiCardsToCardItems, mapApiSetsToSetItems } from '@/features/browse/mappers';
import { Set } from '@/types/sets';

const makeCard = (overrides: Partial<CardModel> = {}): CardModel =>
  ({
    id: '1',
    name: 'Grizzly Bears',
    scryfallId: 'abc',
    setId: '10',
    setName: 'Alpha',
    setSlug: 'alpha',
    setCode: 'LEA',
    rarity: 'common',
    rarityNumeric: 2,
    collectorNumber: '200',
    mtgcbCollectorNumber: null,
    type: 'Creature — Bear',
    artist: null,
    manaCost: null,
    convertedManaCost: null,
    powerNumeric: null,
    toughnessNumeric: null,
    loyaltyNumeric: null,
    tcgplayerId: null,
    market: null,
    low: null,
    average: null,
    high: null,
    foil: null,
    releaseDate: null,
    ...overrides,
  }) as CardModel;

const mapOne = (overrides: Partial<CardModel> = {}) => mapApiCardsToCardItems([makeCard(overrides)])[0];

describe('mapApiCardsToCardItems — identity and text fields', () => {
  it('copies identity fields through', () => {
    expect(mapOne()).toMatchObject({
      id: '1',
      name: 'Grizzly Bears',
      setId: '10',
      setName: 'Alpha',
      setSlug: 'alpha',
      collectorNumber: '200',
      rarity: 'common',
      rarityNumeric: 2,
      type: 'Creature — Bear',
    });
  });

  it('turns null artist and mana cost into empty strings', () => {
    expect(mapOne()).toMatchObject({ artist: '', manaCost: '', convertedManaCost: '' });
  });

  it('keeps artist, mana cost and a stringified CMC when present', () => {
    expect(mapOne({ artist: 'Jeff A. Menges', manaCost: '{1}{G}', convertedManaCost: 2 })).toMatchObject({
      artist: 'Jeff A. Menges',
      manaCost: '{1}{G}',
      convertedManaCost: '2',
    });
  });

  it('keeps a zero CMC as "0"', () => {
    expect(mapOne({ convertedManaCost: 0 }).convertedManaCost).toBe('0');
  });

  it('turns a null MTG CB collector number into undefined', () => {
    expect(mapOne().mtgcbCollectorNumber).toBeUndefined();
    expect(mapOne({ mtgcbCollectorNumber: '5a' }).mtgcbCollectorNumber).toBe('5a');
  });

  it('turns a null tcgplayerId into undefined and keeps a real one', () => {
    expect(mapOne().tcgplayerId).toBeUndefined();
    expect(mapOne({ tcgplayerId: '12345' }).tcgplayerId).toBe('12345');
  });
});

describe('mapApiCardsToCardItems — power, toughness, loyalty', () => {
  it('turns null stats into undefined', () => {
    const item = mapOne();
    expect(item.powerNumeric).toBeUndefined();
    expect(item.toughnessNumeric).toBeUndefined();
    expect(item.loyaltyNumeric).toBeUndefined();
  });

  // The API sends these as numeric strings ("0.0000"), so a 0-power creature survives the
  // `|| undefined` fallback. It would only be lost if the API ever sent a bare number.
  it('keeps zero stats sent as strings', () => {
    const item = mapOne({ powerNumeric: '0.0000', toughnessNumeric: '0', loyaltyNumeric: '0.0000' });
    expect(item.powerNumeric).toBe('0.0000');
    expect(item.toughnessNumeric).toBe('0');
    expect(item.loyaltyNumeric).toBe('0.0000');
  });

  it('keeps non-zero stats', () => {
    expect(mapOne({ powerNumeric: '2.0000', toughnessNumeric: '2.0000' })).toMatchObject({
      powerNumeric: '2.0000',
      toughnessNumeric: '2.0000',
    });
  });
});

describe('mapApiCardsToCardItems — prices', () => {
  it('uses the API prices object when present', () => {
    const prices = { normal: { market: 1, low: 0.5, average: 0.8, high: 2 }, foil: null };
    expect(mapOne({ prices, market: '9.99' }).prices).toBe(prices);
  });

  it('builds prices from the flat string fields when the prices object is missing', () => {
    expect(mapOne({ market: '1.50', low: '1.00', average: '1.25', high: '3.00', foil: '7.25' }).prices).toEqual({
      normal: { market: 1.5, low: 1, average: 1.25, high: 3 },
      foil: { market: 7.25, low: null, average: null, high: null },
    });
  });

  it('uses null for missing flat prices and no foil block without a foil price', () => {
    expect(mapOne({ market: '2.00' }).prices).toEqual({
      normal: { market: 2, low: null, average: null, high: null },
      foil: null,
    });
  });

  it('keeps the raw flat price strings too', () => {
    expect(mapOne({ market: '1.50', foil: '7.25' })).toMatchObject({ market: '1.50', foil: '7.25' });
  });
});

describe('mapApiCardsToCardItems — collection, goals and flags', () => {
  it('defaults store URLs and back face to null', () => {
    expect(mapOne()).toMatchObject({
      cardKingdomUrl: null,
      cardKingdomFoilUrl: null,
      journeysEndUrl: null,
      journeysEndFoilUrl: null,
      backScryfallId: null,
    });
  });

  it('passes store URLs and back face through', () => {
    expect(
      mapOne({
        cardKingdomUrl: '/ck',
        cardKingdomFoilUrl: '/ck-foil',
        journeysEndUrl: '/je',
        journeysEndFoilUrl: '/je-foil',
        backScryfallId: 'back',
      } as Partial<CardModel>),
    ).toMatchObject({
      cardKingdomUrl: '/ck',
      cardKingdomFoilUrl: '/ck-foil',
      journeysEndUrl: '/je',
      journeysEndFoilUrl: '/je-foil',
      backScryfallId: 'back',
    });
  });

  it('marks a card deprecated only when the API says exactly true', () => {
    expect(mapOne().deprecated).toBe(false);
    expect(mapOne({ deprecated: true } as Partial<CardModel>).deprecated).toBe(true);
    expect(mapOne({ deprecated: 'yes' } as unknown as Partial<CardModel>).deprecated).toBe(false);
  });

  it('passes quantities, goal fields and capabilities through untouched', () => {
    const overrides = {
      quantityReg: 0,
      quantityFoil: 3,
      goalTargetQuantityReg: 4,
      goalTargetQuantityFoil: 1,
      goalTargetQuantityAll: null,
      goalRegMet: false,
      goalFoilMet: true,
      goalAllMet: false,
      goalFullyMet: false,
      goalRegNeeded: 4,
      goalFoilNeeded: 0,
      goalAllNeeded: 0,
      goalMetByOtherSets: true,
      canBeFoil: true,
      canBeNonFoil: false,
      locations: [{ locationId: 1, locationName: 'Binder', quantityReg: 1, quantityFoil: 0 }],
    } as unknown as Partial<CardModel>;

    expect(mapOne(overrides)).toMatchObject(overrides as object);
  });

  it('maps every card and keeps order', () => {
    const items = mapApiCardsToCardItems([makeCard({ id: 'a' }), makeCard({ id: 'b' })]);
    expect(items.map((item) => item.id)).toEqual(['a', 'b']);
    expect(mapApiCardsToCardItems([])).toEqual([]);
  });
});

describe('mapApiSetsToSetItems', () => {
  it('returns shallow copies with the same fields', () => {
    const sets = [{ id: '1', name: 'Alpha', slug: 'alpha' }] as unknown as Set[];
    const mapped = mapApiSetsToSetItems(sets);
    expect(mapped).toEqual(sets);
    expect(mapped[0]).not.toBe(sets[0]);
  });
});
