import { buildApiParamsFromSearchParams } from '@/utils/searchParamsConverter';
import { BrowseSearchParams } from '@/types/browse';

const setParams = (params: Partial<BrowseSearchParams>) =>
  buildApiParamsFromSearchParams(params as BrowseSearchParams, 'sets') as Record<string, unknown>;

describe('buildApiParamsFromSearchParams — show subsets', () => {
  /**
   * A set counts as a subset if it has a parent OR belongs to a subset group.
   * Secret Lair drops only carry subsetGroupId, so sending parentSetId alone
   * left all of them in the list with the toggle off.
   */
  it('sends both subset predicates when showSubsets is false', () => {
    const apiParams = setParams({ showSubsets: false });

    expect(apiParams).toHaveProperty('parentSetId', null);
    expect(apiParams).toHaveProperty('subsetGroupId', null);
  });

  it('sends neither predicate when showSubsets is true', () => {
    const apiParams = setParams({ showSubsets: true });

    expect(apiParams).not.toHaveProperty('parentSetId');
    expect(apiParams).not.toHaveProperty('subsetGroupId');
  });

  it('sends neither predicate when showSubsets is unset', () => {
    const apiParams = setParams({});

    expect(apiParams).not.toHaveProperty('parentSetId');
    expect(apiParams).not.toHaveProperty('subsetGroupId');
  });

  it('leaves other set filters untouched', () => {
    const apiParams = setParams({ showSubsets: false, name: 'Dominaria' });

    expect(apiParams).toHaveProperty('name', 'Dominaria');
    expect(apiParams).toHaveProperty('parentSetId', null);
    expect(apiParams).toHaveProperty('subsetGroupId', null);
  });

  it('does not add subset predicates to card searches', () => {
    const apiParams = buildApiParamsFromSearchParams(
      { showSubsets: false } as BrowseSearchParams,
      'cards',
    ) as Record<string, unknown>;

    expect(apiParams).not.toHaveProperty('parentSetId');
    expect(apiParams).not.toHaveProperty('subsetGroupId');
  });
});

const cardParams = (params: Partial<BrowseSearchParams>) =>
  buildApiParamsFromSearchParams(params as BrowseSearchParams, 'cards') as Record<string, unknown>;

describe('buildApiParamsFromSearchParams — full art', () => {
  /**
   * isFullArt is tri-state: undefined means "don't filter", so it must be omitted
   * from the payload entirely rather than sent as false (which would exclude every
   * full art card from an unfiltered browse).
   */
  it('omits isFullArt when unset', () => {
    expect(cardParams({})).not.toHaveProperty('isFullArt');
  });

  it('sends isFullArt true for "Full Art only"', () => {
    expect(cardParams({ isFullArt: true })).toHaveProperty('isFullArt', true);
  });

  it('sends isFullArt false for "Exclude Full Art"', () => {
    expect(cardParams({ isFullArt: false })).toHaveProperty('isFullArt', false);
  });

  it('carries isFullArt alongside isReserved without either clobbering the other', () => {
    const apiParams = cardParams({ isFullArt: true, isReserved: false });

    expect(apiParams).toHaveProperty('isFullArt', true);
    expect(apiParams).toHaveProperty('isReserved', false);
  });
});

describe('buildApiParamsFromSearchParams — card treatments', () => {
  it('omits both treatment filters when unset', () => {
    const apiParams = cardParams({});

    expect(apiParams).not.toHaveProperty('borderColor');
    expect(apiParams).not.toHaveProperty('frameEffects');
  });

  it('omits a treatment filter that is present but empty', () => {
    const apiParams = cardParams({
      borderColors: { include: [], exclude: [] },
      frameEffects: { include: [], exclude: [] },
    });

    expect(apiParams).not.toHaveProperty('borderColor');
    expect(apiParams).not.toHaveProperty('frameEffects');
  });

  it('sends border colour includes as OR', () => {
    const apiParams = cardParams({ borderColors: { include: ['"borderless"'], exclude: [] } });

    expect(apiParams.borderColor).toEqual({ OR: ['"borderless"'] });
  });

  it('sends border colour excludes as NOT', () => {
    const apiParams = cardParams({ borderColors: { include: [], exclude: ['"black"'] } });

    expect(apiParams.borderColor).toEqual({ NOT: ['"black"'] });
  });

  it('sends both sides of a border colour filter together', () => {
    const apiParams = cardParams({
      borderColors: { include: ['"borderless"', '"gold"'], exclude: ['"black"'] },
    });

    expect(apiParams.borderColor).toEqual({ OR: ['"borderless"', '"gold"'], NOT: ['"black"'] });
  });

  it('sends frame effect includes as OR', () => {
    const apiParams = cardParams({ frameEffects: { include: ['extendedart'], exclude: [] } });

    expect(apiParams.frameEffects).toEqual({ OR: ['extendedart'] });
  });

  /**
   * Frame effects must stay unquoted. They share one text column holding a Postgres
   * array literal, so the API matches them as a substring; a quoted value asks the
   * whole column to equal that one effect and misses every multi-effect card.
   */
  it('leaves frame effect values unquoted', () => {
    const apiParams = cardParams({
      frameEffects: { include: ['extendedart', 'showcase'], exclude: ['inverted'] },
    });

    const frameEffects = apiParams.frameEffects as { OR: string[]; NOT: string[] };

    for (const value of [...frameEffects.OR, ...frameEffects.NOT]) {
      expect(value).not.toMatch(/"/);
    }
  });

  it('keeps border colours and frame effects independent', () => {
    const apiParams = cardParams({
      borderColors: { include: ['"borderless"'], exclude: [] },
      frameEffects: { include: ['showcase'], exclude: [] },
    });

    expect(apiParams.borderColor).toEqual({ OR: ['"borderless"'] });
    expect(apiParams.frameEffects).toEqual({ OR: ['showcase'] });
  });

  it('carries treatments alongside the full art filter', () => {
    const apiParams = cardParams({
      isFullArt: false,
      borderColors: { include: ['"borderless"'], exclude: [] },
    });

    expect(apiParams).toHaveProperty('isFullArt', false);
    expect(apiParams.borderColor).toEqual({ OR: ['"borderless"'] });
  });
});
