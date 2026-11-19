import { convertStateToUrlParams, parseUrlToState } from '@/features/browse/schema/urlStateAdapters';
import { BrowseSearchParams } from '@/types/browse';

const parseCards = (query: string) => parseUrlToState(new URLSearchParams(query), 'cards');

const toCardParams = (state: Partial<BrowseSearchParams>) =>
  convertStateToUrlParams(state as BrowseSearchParams, 'cards');

describe('urlStateAdapters — colorIdentity', () => {
  it('parses colors and match type', () => {
    expect(parseCards('colorIdentity=W,U&colorIdentityMatchType=atMost')).toHaveProperty('colorIdentity', {
      colors: ['W', 'U'],
      matchType: 'atMost',
      includeColorless: false,
    });
  });

  it('defaults the match type to exactly', () => {
    expect(parseCards('colorIdentity=G').colorIdentity).toMatchObject({ colors: ['G'], matchType: 'exactly' });
  });

  it('parses a colorless identity', () => {
    expect(parseCards('colorlessIdentity=true')).toHaveProperty('colorIdentity', {
      colors: [],
      matchType: 'exactly',
      includeColorless: true,
    });
  });

  it('ignores a match type with no colors', () => {
    expect(parseCards('colorIdentityMatchType=atMost')).not.toHaveProperty('colorIdentity');
  });

  it('serializes colors and match type', () => {
    const params = toCardParams({ colorIdentity: { colors: ['W', 'U'], matchType: 'atLeast' } });

    expect(params.get('colorIdentity')).toBe('W,U');
    expect(params.get('colorIdentityMatchType')).toBe('atLeast');
    expect(params.has('colorlessIdentity')).toBe(false);
  });

  it('serializes a colorless identity', () => {
    const params = toCardParams({ colorIdentity: { colors: [], matchType: 'exactly', includeColorless: true } });

    expect(params.get('colorlessIdentity')).toBe('true');
    expect(params.has('colorIdentity')).toBe(false);
  });

  it.each([
    [{ colors: ['B', 'R', 'G'], matchType: 'exactly' as const, includeColorless: false }],
    [{ colors: ['W'], matchType: 'atLeast' as const, includeColorless: false }],
    [{ colors: ['U', 'G'], matchType: 'atMost' as const, includeColorless: false }],
    [{ colors: [], matchType: 'exactly' as const, includeColorless: true }],
  ])('round-trips %j through the URL and back', (colorIdentity) => {
    const query = toCardParams({ colorIdentity }).toString();

    expect(parseCards(query)).toHaveProperty('colorIdentity', colorIdentity);
  });

  /**
   * Colors and color identity are different columns with similar names; none of
   * the three URL params of one may be read as the other.
   */
  it('stays independent of colors', () => {
    const query = toCardParams({
      colors: { colors: [], matchType: 'exactly', includeColorless: true },
      colorIdentity: { colors: ['G'], matchType: 'atLeast' },
    }).toString();
    const state = parseCards(query);

    expect(state).toHaveProperty('colors', { colors: [], matchType: 'exactly', includeColorless: true });
    expect(state).toHaveProperty('colorIdentity', { colors: ['G'], matchType: 'atLeast', includeColorless: false });
  });

  it('is not read from a colors-only URL', () => {
    const state = parseCards('colors=W,U&colorMatchType=atMost&colorless=true');

    expect(state).toHaveProperty('colors');
    expect(state).not.toHaveProperty('colorIdentity');
  });

  it('does not read colors from a color-identity-only URL', () => {
    const state = parseCards('colorIdentity=W,U&colorIdentityMatchType=atMost');

    expect(state).not.toHaveProperty('colors');
  });

  it('does not apply to sets mode', () => {
    expect(parseUrlToState(new URLSearchParams('colorIdentity=W'), 'sets')).not.toHaveProperty('colorIdentity');
    expect(
      convertStateToUrlParams(
        { colorIdentity: { colors: ['W'], matchType: 'exactly' } } as BrowseSearchParams,
        'sets',
      ).toString(),
    ).toBe('');
  });
});
