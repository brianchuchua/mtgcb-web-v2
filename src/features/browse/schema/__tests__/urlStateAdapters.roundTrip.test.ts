import { convertStateToUrlParams, parseUrlToState } from '@/features/browse/schema/urlStateAdapters';
import { BrowseSearchParams } from '@/types/browse';

type Mode = 'cards' | 'sets';

const toParams = (state: Partial<BrowseSearchParams>, mode: Mode, isSetSpecificPage = false) =>
  convertStateToUrlParams(state as BrowseSearchParams, mode, isSetSpecificPage);

const parse = (query: string, mode: Mode) => parseUrlToState(new URLSearchParams(query), mode);

const roundTrip = (state: Partial<BrowseSearchParams>, mode: Mode) => parse(toParams(state, mode).toString(), mode);

const asObject = (params: URLSearchParams) => Object.fromEntries(params.entries());

describe('urlStateAdapters — text fields', () => {
  it('writes the card name as "name" and reads it back', () => {
    expect(asObject(toParams({ name: 'Lightning Bolt' }, 'cards'))).toEqual({ name: 'Lightning Bolt' });
    expect(roundTrip({ name: 'Lightning Bolt' }, 'cards')).toEqual({ name: 'Lightning Bolt' });
  });

  it('writes the set name as "setName" and reads it back', () => {
    expect(asObject(toParams({ name: 'Alpha' }, 'sets'))).toEqual({ setName: 'Alpha' });
    expect(roundTrip({ name: 'Alpha' }, 'sets')).toEqual({ name: 'Alpha' });
  });

  it('keeps the card and set name params apart', () => {
    expect(parse('name=Bolt', 'sets')).toEqual({});
    expect(parse('setName=Alpha', 'cards')).toEqual({});
  });

  it('round-trips code in sets mode only', () => {
    expect(roundTrip({ code: 'LEA' }, 'sets')).toEqual({ code: 'LEA' });
    expect(asObject(toParams({ code: 'LEA' }, 'cards'))).toEqual({});
    expect(parse('code=LEA', 'cards')).toEqual({});
  });

  it('round-trips oracleText and artist in cards mode only', () => {
    const state = { oracleText: 'draw a card', artist: 'Rebecca Guay' };
    expect(asObject(toParams(state, 'cards'))).toEqual(state);
    expect(roundTrip(state, 'cards')).toEqual(state);
    expect(asObject(toParams(state, 'sets'))).toEqual({});
  });

  it('round-trips text that needs URL encoding', () => {
    const state = { name: 'Æther Vial & "friends" | 100%' };
    expect(roundTrip(state, 'cards')).toEqual(state);
  });

  it('leaves empty strings out', () => {
    expect(asObject(toParams({ name: '', oracleText: '', artist: '' }, 'cards'))).toEqual({});
    expect(parse('name=&artist=', 'cards')).toEqual({});
  });
});

describe('urlStateAdapters — colors', () => {
  it('writes colours with their match type', () => {
    expect(asObject(toParams({ colors: { colors: ['W', 'U'], matchType: 'atLeast' } }, 'cards'))).toEqual({
      colors: 'W,U',
      colorMatchType: 'atLeast',
    });
  });

  it('round-trips each match type', () => {
    (['exactly', 'atLeast', 'atMost'] as const).forEach((matchType) => {
      expect(roundTrip({ colors: { colors: ['B', 'R', 'G'], matchType, includeColorless: false } }, 'cards')).toEqual({
        colors: { colors: ['B', 'R', 'G'], matchType, includeColorless: false },
      });
    });
  });

  it('writes colorless alone without a match type', () => {
    expect(
      asObject(toParams({ colors: { colors: [], matchType: 'exactly', includeColorless: true } }, 'cards')),
    ).toEqual({ colorless: 'true' });
  });

  it('round-trips colorless', () => {
    expect(roundTrip({ colors: { colors: [], matchType: 'exactly', includeColorless: true } }, 'cards')).toEqual({
      colors: { colors: [], matchType: 'exactly', includeColorless: true },
    });
  });

  it('defaults a missing match type to exactly', () => {
    expect(parse('colors=G', 'cards')).toEqual({ colors: { colors: ['G'], matchType: 'exactly', includeColorless: false } });
  });

  it('ignores a match type with no colours', () => {
    expect(parse('colorMatchType=atMost', 'cards')).toEqual({});
    expect(parse('colorless=false', 'cards')).toEqual({});
  });

  it('writes nothing for an empty colour filter', () => {
    expect(asObject(toParams({ colors: { colors: [], matchType: 'atLeast' } }, 'cards'))).toEqual({});
  });

  // Pinned current behaviour: the match type is not validated against the allowed values.
  it('passes an unknown match type through as-is', () => {
    expect(parse('colors=W&colorMatchType=bogus', 'cards')).toEqual({
      colors: { colors: ['W'], matchType: 'bogus', includeColorless: false },
    });
  });
});

describe('urlStateAdapters — include/exclude filters', () => {
  it.each([
    ['types', 'includeTypes', 'excludeTypes', 'cards'],
    ['layouts', 'includeLayouts', 'excludeLayouts', 'cards'],
    ['rarities', 'includeRarities', 'excludeRarities', 'cards'],
    ['sets', 'includeSets', 'excludeSets', 'cards'],
    ['formatsLegal', 'includeFormats', 'excludeFormats', 'cards'],
    ['setCategories', 'includeCategories', 'excludeCategories', 'sets'],
    ['setTypes', 'includeSetTypes', 'excludeSetTypes', 'sets'],
    ['completionStatus', 'includeCompletionStatus', 'excludeCompletionStatus', 'sets'],
  ] as const)('%s uses %s / %s with a pipe separator', (key, includeParam, excludeParam, mode) => {
    const value = { include: ['a b', 'c'], exclude: ['d'] };
    const params = toParams({ [key]: value }, mode);

    expect(asObject(params)).toEqual({ [includeParam]: 'a b|c', [excludeParam]: 'd' });
    expect(roundTrip({ [key]: value }, mode)).toEqual({ [key]: value });
  });

  it.each([
    ['types', 'sets'],
    ['rarities', 'sets'],
    ['sets', 'sets'],
    ['setCategories', 'cards'],
    ['completionStatus', 'cards'],
  ] as const)('ignores %s in %s mode', (key, mode) => {
    expect(asObject(toParams({ [key]: { include: ['x'], exclude: [] } }, mode))).toEqual({});
  });

  it('reads an include-only filter with an empty exclude list', () => {
    expect(parse('includeTypes=Creature', 'cards')).toEqual({ types: { include: ['Creature'], exclude: [] } });
  });

  it('reads an exclude-only filter with an empty include list', () => {
    expect(parse('excludeRarities=1', 'cards')).toEqual({ rarities: { include: [], exclude: ['1'] } });
  });

  it('writes nothing for an empty filter', () => {
    expect(asObject(toParams({ types: { include: [], exclude: [] } }, 'cards'))).toEqual({});
  });

  it('leaves sets out on a set-specific page but keeps other filters', () => {
    const params = toParams(
      { sets: { include: ['12'], exclude: [] }, types: { include: ['Elf'], exclude: [] } },
      'cards',
      true,
    );
    expect(asObject(params)).toEqual({ includeTypes: 'Elf' });
  });

  it('round-trips the include-banned toggle', () => {
    expect(asObject(toParams({ formatsLegalIncludeBanned: true }, 'cards'))).toEqual({ includeBannedFormats: 'true' });
    expect(parse('includeBannedFormats=true', 'cards')).toEqual({ formatsLegalIncludeBanned: true });
    expect(asObject(toParams({ formatsLegalIncludeBanned: false }, 'cards'))).toEqual({});
  });
});

describe('urlStateAdapters — stats', () => {
  it('packs stats as attribute=cond|cond joined by commas', () => {
    const params = toParams({ stats: { powerNumeric: ['gte1', 'lte3'], toughnessNumeric: ['gte2'] } }, 'cards');
    expect(params.get('stats')).toBe('powerNumeric=gte1|lte3,toughnessNumeric=gte2');
  });

  it('parses the packed format', () => {
    expect(parse('stats=power=gte1|lte3,toughness=gte2', 'cards')).toEqual({
      stats: { power: ['gte1', 'lte3'], toughness: ['gte2'] },
    });
  });

  it('round-trips stats', () => {
    const stats = { convertedManaCost: ['eq3'], quantityAll: ['eq0', 'gte4'] };
    expect(roundTrip({ stats }, 'cards')).toEqual({ stats });
  });

  it('skips attributes with no conditions', () => {
    expect(toParams({ stats: { powerNumeric: [], loyaltyNumeric: ['gt2'] } }, 'cards').get('stats')).toBe(
      'loyaltyNumeric=gt2',
    );
    expect(toParams({ stats: { powerNumeric: [] } }, 'cards').has('stats')).toBe(false);
  });

  it('ignores malformed groups', () => {
    expect(parse('stats=power,=gte1,toughness=lt4', 'cards')).toEqual({ stats: { toughness: ['lt4'] } });
    expect(parse('stats=junk', 'cards')).toEqual({});
  });

  it('does not apply stats to sets mode', () => {
    expect(parse('stats=power=gte1', 'sets')).toEqual({});
  });
});

describe('urlStateAdapters — booleans', () => {
  it('writes showSubsets only when it is turned off', () => {
    expect(asObject(toParams({ showSubsets: false }, 'sets'))).toEqual({ showSubsets: 'false' });
    expect(asObject(toParams({ showSubsets: true }, 'sets'))).toEqual({});
    expect(parse('showSubsets=false', 'sets')).toEqual({ showSubsets: false });
  });

  it('round-trips includeSubsetsInSets', () => {
    expect(roundTrip({ includeSubsetsInSets: true }, 'sets')).toEqual({ includeSubsetsInSets: true });
    expect(asObject(toParams({ includeSubsetsInSets: false }, 'sets'))).toEqual({});
  });

  it('writes oneResultPerCardName only when on', () => {
    expect(asObject(toParams({ oneResultPerCardName: true }, 'cards'))).toEqual({ oneResultPerCardName: 'true' });
    expect(asObject(toParams({ oneResultPerCardName: false }, 'cards'))).toEqual({});
    expect(parse('oneResultPerCardName=true', 'cards')).toEqual({ oneResultPerCardName: true });
  });

  it('reads any non-"true" value as false', () => {
    expect(parse('oneResultPerCardName=yes', 'cards')).toEqual({ oneResultPerCardName: false });
  });

  it('round-trips includeChildLocations', () => {
    expect(roundTrip({ includeChildLocations: true }, 'cards')).toEqual({ includeChildLocations: true });
  });
});

describe('urlStateAdapters — goal and location', () => {
  it('writes the goal as goalId in both modes', () => {
    expect(asObject(toParams({ selectedGoalId: 42 }, 'cards'))).toEqual({ goalId: '42' });
    expect(asObject(toParams({ selectedGoalId: 42 }, 'sets'))).toEqual({ goalId: '42' });
  });

  it('reads goalId as a number in both modes', () => {
    expect(parse('goalId=42', 'cards')).toEqual({ selectedGoalId: 42 });
    expect(parse('goalId=42', 'sets')).toEqual({ selectedGoalId: 42 });
  });

  it('leaves a null goal out', () => {
    expect(asObject(toParams({ selectedGoalId: null }, 'cards'))).toEqual({});
  });

  // Pinned current behaviour: a non-numeric goalId is not rejected.
  it('reads a non-numeric goalId as NaN', () => {
    expect(parse('goalId=abc', 'cards').selectedGoalId).toBeNaN();
  });

  it('writes and reads locationId in cards mode only', () => {
    expect(asObject(toParams({ selectedLocationId: 7 }, 'cards'))).toEqual({ locationId: '7' });
    expect(parse('locationId=7', 'cards')).toEqual({ selectedLocationId: 7 });
    expect(asObject(toParams({ selectedLocationId: 7 }, 'sets'))).toEqual({});
    expect(parse('locationId=7', 'sets')).toEqual({});
  });

  it('round-trips showGoals and drops the default', () => {
    expect(roundTrip({ showGoals: 'incomplete' }, 'cards')).toEqual({ showGoals: 'incomplete' });
    expect(asObject(toParams({ showGoals: 'all' }, 'sets'))).toEqual({});
  });

  it('drops an unknown showGoals value', () => {
    expect(parse('showGoals=maybe', 'cards')).toEqual({});
  });
});

describe('urlStateAdapters — params that never reach the URL', () => {
  it('never writes the page size, even when non-default', () => {
    expect(asObject(toParams({ pageSize: 100 }, 'cards'))).toEqual({});
    expect(asObject(toParams({ pageSize: 50 }, 'sets'))).toEqual({});
  });

  it('never writes viewMode or viewContentType', () => {
    const state = { viewMode: 'table', viewContentType: 'sets' } as Partial<BrowseSearchParams>;
    expect(asObject(toParams(state, 'cards'))).toEqual({});
  });

  it('skips undefined and null values', () => {
    expect(asObject(toParams({ name: undefined, selectedLocationId: null }, 'cards'))).toEqual({});
  });

  it('ignores keys with no schema entry', () => {
    const state = { currentPage: 3, somethingElse: 'x' } as Partial<BrowseSearchParams>;
    expect(asObject(toParams(state, 'cards'))).toEqual({});
  });

  it('reads the content type from the URL and drops unknown ones', () => {
    expect(parse('contentType=sets', 'sets')).toEqual({ viewContentType: 'sets' });
    expect(parse('contentType=decks', 'cards')).toEqual({});
  });

  it('drops an unknown sort value from the URL', () => {
    expect(parse('cardsSortBy=bogus&cardsSortOrder=sideways', 'cards')).toEqual({});
  });
});

describe('urlStateAdapters — full round trip', () => {
  it('round-trips a busy cards search', () => {
    const state: Partial<BrowseSearchParams> = {
      name: 'Elf',
      oracleText: 'untap',
      artist: 'Terese Nielsen',
      colors: { colors: ['G'], matchType: 'atLeast', includeColorless: false },
      types: { include: ['Creature'], exclude: ['Legendary'] },
      layouts: { include: ['normal'], exclude: [] },
      rarities: { include: ['2', '3'], exclude: [] },
      sets: { include: ['1'], exclude: ['2'] },
      formatsLegal: { include: ['modern'], exclude: [] },
      formatsLegalIncludeBanned: true,
      stats: { powerNumeric: ['gte1'] },
      oneResultPerCardName: true,
      selectedGoalId: 3,
      selectedLocationId: 9,
      sortBy: 'name',
      sortOrder: 'desc',
    };
    expect(roundTrip(state, 'cards')).toEqual(state);
  });

  it('round-trips a busy sets search', () => {
    const state: Partial<BrowseSearchParams> = {
      name: 'Dominaria',
      code: 'DOM',
      setCategories: { include: ['Normal'], exclude: [] },
      setTypes: { include: [], exclude: ['token'] },
      completionStatus: { include: ['complete'], exclude: [] },
      showSubsets: false,
      selectedGoalId: 5,
      sortBy: 'percentageCollected',
      sortOrder: 'asc',
    };
    expect(roundTrip(state, 'sets')).toEqual(state);
  });
});
