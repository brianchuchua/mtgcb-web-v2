import {
  normalizeCardSearchParams,
  normalizeSearchText,
  normalizeSetSearchParams,
} from '../searchTextParams';

describe('normalizeSearchText', () => {
  it.each([
    ['Lightning Bolt', 'Lightning Bolt'],
    ['Lightning Bolt ', 'Lightning Bolt'],
    ['  Lightning Bolt', 'Lightning Bolt'],
    ['Lightning  Bolt', 'Lightning Bolt'],
    ['Lightning \t Bolt', 'Lightning Bolt'],
    ['draw a  card', 'draw a card'],
    ['   ', ''],
  ])('%j -> %j', (input, expected) => {
    expect(normalizeSearchText(input)).toBe(expected);
  });
});

describe('normalizeCardSearchParams', () => {
  it('cleans name, rules text and artist and leaves other params alone', () => {
    const result = normalizeCardSearchParams({
      name: ' Lightning  Bolt ',
      oracleText: 'draw  a card ',
      artist: 'Christopher  Moeller',
      limit: 20,
    });
    expect(result).toEqual({
      name: 'Lightning Bolt',
      oracleText: 'draw a card',
      artist: 'Christopher Moeller',
      limit: 20,
    });
  });

  it('does not add missing fields', () => {
    expect(normalizeCardSearchParams({ limit: 20 })).toEqual({ limit: 20 });
  });
});

describe('normalizeSetSearchParams', () => {
  it('cleans set name and code', () => {
    expect(normalizeSetSearchParams({ name: 'Modern  Horizons 3 ', code: ' mh3 ' })).toEqual({
      name: 'Modern Horizons 3',
      code: 'mh3',
    });
  });
});
