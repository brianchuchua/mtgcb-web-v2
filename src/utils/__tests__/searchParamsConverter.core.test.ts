import { BrowseSearchParams } from '@/types/browse';
import { buildApiParamsFromSearchParams } from '@/utils/searchParamsConverter';

const cardParams = (params: Partial<BrowseSearchParams>) =>
  buildApiParamsFromSearchParams(params as BrowseSearchParams, 'cards') as Record<string, unknown>;

const setParams = (params: Partial<BrowseSearchParams>) =>
  buildApiParamsFromSearchParams(params as BrowseSearchParams, 'sets') as Record<string, unknown>;

describe('buildApiParamsFromSearchParams — defaults', () => {
  it('defaults to cards mode', () => {
    const apiParams = buildApiParamsFromSearchParams({ oracleText: 'flying' } as BrowseSearchParams) as Record<
      string,
      unknown
    >;
    expect(apiParams).toEqual({ oracleText: 'flying' });
  });

  it('returns an empty object for empty params', () => {
    expect(cardParams({})).toEqual({});
    expect(setParams({})).toEqual({});
  });

  it('ignores paging, view and context params', () => {
    expect(
      cardParams({ currentPage: 3, pageSize: 50, viewMode: 'table', selectedGoalId: 4, selectedLocationId: 9 }),
    ).toEqual({});
  });
});

describe('buildApiParamsFromSearchParams — name and code', () => {
  it('passes name through for cards and sets', () => {
    expect(cardParams({ name: 'Bolt' })).toEqual({ name: 'Bolt' });
    expect(setParams({ name: 'Alpha' })).toEqual({ name: 'Alpha' });
  });

  it('omits an empty name', () => {
    expect(cardParams({ name: '' })).not.toHaveProperty('name');
  });

  it('passes code through for sets only', () => {
    expect(setParams({ code: 'LEA' })).toEqual({ code: 'LEA' });
    expect(cardParams({ code: 'LEA' })).not.toHaveProperty('code');
  });
});

describe('buildApiParamsFromSearchParams — sorting', () => {
  it('maps collectorNumber to its numeric column', () => {
    expect(cardParams({ sortBy: 'collectorNumber' })).toEqual({ sortBy: 'collectorNumberNumeric' });
  });

  it('maps mtgcbCollectorNumber to its numeric column', () => {
    expect(cardParams({ sortBy: 'mtgcbCollectorNumber' })).toEqual({ sortBy: 'mtgcbCollectorNumberNumeric' });
  });

  it.each(['name', 'releasedAt', 'market', 'powerNumeric', 'percentageCollected'] as const)(
    'passes %s through unchanged',
    (sortBy) => {
      expect(cardParams({ sortBy })).toEqual({ sortBy });
    },
  );

  it('renames sortOrder to sortDirection', () => {
    expect(cardParams({ sortOrder: 'desc' })).toEqual({ sortDirection: 'desc' });
    expect(setParams({ sortBy: 'name', sortOrder: 'asc' })).toEqual({ sortBy: 'name', sortDirection: 'asc' });
  });
});

describe('buildApiParamsFromSearchParams — card text filters', () => {
  it('passes oracleText and artist for cards', () => {
    expect(cardParams({ oracleText: 'draw a card', artist: 'Rebecca Guay' })).toEqual({
      oracleText: 'draw a card',
      artist: 'Rebecca Guay',
    });
  });

  it('drops card-only params in sets mode', () => {
    expect(
      setParams({
        oracleText: 'x',
        artist: 'y',
        oneResultPerCardName: true,
        includeBadDataOnly: true,
        isReserved: true,
        colors: { colors: ['W'], matchType: 'exactly' },
        types: { include: ['Creature'], exclude: [] },
        rarities: { include: ['1'], exclude: [] },
        sets: { include: ['5'], exclude: [] },
        stats: { powerNumeric: ['gte1'] },
        formatsLegal: { include: ['modern'], exclude: [] },
      }),
    ).toEqual({});
  });

  it('sends oneResultPerCardName and includeBadDataOnly only when true', () => {
    expect(cardParams({ oneResultPerCardName: true, includeBadDataOnly: true })).toEqual({
      oneResultPerCardName: true,
      includeBadDataOnly: true,
    });
    expect(cardParams({ oneResultPerCardName: false, includeBadDataOnly: false })).toEqual({});
  });
});

describe('buildApiParamsFromSearchParams — colors', () => {
  it.each(['exactly', 'atLeast', 'atMost'] as const)('sends %s under its own key', (matchType) => {
    expect(cardParams({ colors: { colors: ['W', 'U'], matchType } })).toEqual({
      colors_array: { [matchType]: ['W', 'U'] },
    });
  });

  it('sends colorless as exactly-empty and ignores any colours alongside it', () => {
    expect(cardParams({ colors: { colors: ['R'], matchType: 'atLeast', includeColorless: true } })).toEqual({
      colors_array: { exactly: [] },
    });
  });

  it('omits the filter when no colours are chosen', () => {
    expect(cardParams({ colors: { colors: [], matchType: 'exactly' } })).toEqual({});
  });
});

describe('buildApiParamsFromSearchParams — types and layouts', () => {
  it('sends type includes as AND, excludes as NOT', () => {
    expect(cardParams({ types: { include: ['Creature', 'Legendary'], exclude: ['Land'] } })).toEqual({
      type: { AND: ['Creature', 'Legendary'], NOT: ['Land'] },
    });
  });

  it('sends only the populated type side', () => {
    expect(cardParams({ types: { include: [], exclude: ['Land'] } })).toEqual({ type: { NOT: ['Land'] } });
    expect(cardParams({ types: { include: ['Elf'], exclude: [] } })).toEqual({ type: { AND: ['Elf'] } });
  });

  it('omits an empty type filter', () => {
    expect(cardParams({ types: { include: [], exclude: [] } })).toEqual({});
  });

  it('sends layout includes as OR, excludes as NOT', () => {
    expect(cardParams({ layouts: { include: ['split', 'flip'], exclude: ['token'] } })).toEqual({
      layout: { OR: ['split', 'flip'], NOT: ['token'] },
    });
  });

  it('omits an empty layout filter', () => {
    expect(cardParams({ layouts: { include: [], exclude: [] } })).toEqual({});
  });
});

describe('buildApiParamsFromSearchParams — rarities', () => {
  it('sends includes as OR equality tokens', () => {
    expect(cardParams({ rarities: { include: ['2', '3'], exclude: [] } })).toEqual({
      rarityNumeric: { OR: ['=2', '=3'] },
    });
  });

  it('sends excludes as AND inequality tokens', () => {
    expect(cardParams({ rarities: { include: [], exclude: ['1'] } })).toEqual({
      rarityNumeric: { AND: ['!=1'] },
    });
  });

  it('sends both sides together', () => {
    expect(cardParams({ rarities: { include: ['4'], exclude: ['1', '5'] } })).toEqual({
      rarityNumeric: { OR: ['=4'], AND: ['!=1', '!=5'] },
    });
  });

  it('omits an empty rarity filter', () => {
    expect(cardParams({ rarities: { include: [], exclude: [] } })).toEqual({});
  });
});

describe('buildApiParamsFromSearchParams — format legality', () => {
  it('uses legalIn by default', () => {
    expect(cardParams({ formatsLegal: { include: ['modern'], exclude: ['vintage'] } })).toEqual({
      legalIn: { OR: ['modern'], NOT: ['vintage'] },
    });
  });

  it('uses formatRelevantIn when banned cards are included', () => {
    expect(
      cardParams({ formatsLegal: { include: ['modern'], exclude: [] }, formatsLegalIncludeBanned: true }),
    ).toEqual({ formatRelevantIn: { OR: ['modern'] } });
  });

  it('sends an exclude-only filter', () => {
    expect(cardParams({ formatsLegal: { include: [], exclude: ['pauper'] } })).toEqual({
      legalIn: { NOT: ['pauper'] },
    });
  });

  it('sends nothing for an empty filter even with the banned toggle on', () => {
    expect(cardParams({ formatsLegal: { include: [], exclude: [] }, formatsLegalIncludeBanned: true })).toEqual({});
  });
});

describe('buildApiParamsFromSearchParams — sets', () => {
  it('sends set includes as OR of raw ids', () => {
    expect(cardParams({ sets: { include: ['10', '20'], exclude: [] } })).toEqual({ setId: { OR: ['10', '20'] } });
  });

  it('sends set excludes as AND of != ids', () => {
    expect(cardParams({ sets: { include: [], exclude: ['7'] } })).toEqual({ setId: { AND: ['!=7'] } });
  });

  it('sends both sides together', () => {
    expect(cardParams({ sets: { include: ['1'], exclude: ['2'] } })).toEqual({
      setId: { OR: ['1'], AND: ['!=2'] },
    });
  });

  it('omits an empty set filter', () => {
    expect(cardParams({ sets: { include: [], exclude: [] } })).toEqual({});
  });
});

describe('buildApiParamsFromSearchParams — stats', () => {
  it.each([
    ['gte3', '>=3'],
    ['gt3', '>3'],
    ['lte3', '<=3'],
    ['lt3', '<3'],
    ['eq3', '=3'],
    ['not3', '!=3'],
  ])('maps %s to %s', (condition, expected) => {
    expect(cardParams({ stats: { powerNumeric: [condition] } })).toEqual({ powerNumeric: { AND: [expected] } });
  });

  it('combines range conditions on a non-quantity stat with AND', () => {
    expect(cardParams({ stats: { convertedManaCost: ['gte1', 'lte3'] } })).toEqual({
      convertedManaCost: { AND: ['>=1', '<=3'] },
    });
  });

  it.each(['quantityAll', 'quantityReg', 'quantityFoil'])('combines %s conditions with OR', (attribute) => {
    expect(cardParams({ stats: { [attribute]: ['eq0', 'gte4'] } })).toEqual({ [attribute]: { OR: ['=0', '>=4'] } });
  });

  it('drops conditions with no value, and the stat when none remain', () => {
    expect(cardParams({ stats: { powerNumeric: ['gte', 'lte  '], toughnessNumeric: ['gte2', 'lt'] } })).toEqual({
      toughnessNumeric: { AND: ['>=2'] },
    });
  });

  it('drops conditions with an unknown operator', () => {
    expect(cardParams({ stats: { powerNumeric: ['between1'] } })).toEqual({});
  });

  it('omits a stat with an empty condition list', () => {
    expect(cardParams({ stats: { powerNumeric: [] } })).toEqual({});
  });

  it('keeps several stats independent', () => {
    expect(cardParams({ stats: { powerNumeric: ['gte2'], quantityReg: ['eq1'], market: ['lt5.5'] } })).toEqual({
      powerNumeric: { AND: ['>=2'] },
      quantityReg: { OR: ['=1'] },
      market: { AND: ['<5.5'] },
    });
  });
});

describe('buildApiParamsFromSearchParams — set filters', () => {
  it('wraps category values in quotes', () => {
    expect(setParams({ setCategories: { include: ['Normal'], exclude: ['Special'] } })).toEqual({
      category: { OR: ['"Normal"'], NOT: ['"Special"'] },
    });
  });

  it('wraps set type values in quotes', () => {
    expect(setParams({ setTypes: { include: ['core', 'draft innovation'], exclude: [] } })).toEqual({
      setType: { OR: ['"core"', '"draft innovation"'] },
    });
  });

  it('omits empty category and type filters', () => {
    expect(
      setParams({ setCategories: { include: [], exclude: [] }, setTypes: { include: [], exclude: [] } }),
    ).toEqual({});
  });

  it('passes completion status through unquoted', () => {
    expect(setParams({ completionStatus: { include: ['complete', 'partial'], exclude: ['empty'] } })).toEqual({
      completionStatus: { OR: ['complete', 'partial'], NOT: ['empty'] },
    });
  });

  it('omits an empty completion status filter', () => {
    expect(setParams({ completionStatus: { include: [], exclude: [] } })).toEqual({});
  });

  it('ignores set-only filters in cards mode', () => {
    expect(
      cardParams({
        setCategories: { include: ['Normal'], exclude: [] },
        setTypes: { include: ['core'], exclude: [] },
        completionStatus: { include: ['complete'], exclude: [] },
      }),
    ).toEqual({});
  });
});
