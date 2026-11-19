import { BrowseSearchParams } from '@/types/browse';
import { buildApiParamsFromSearchParams } from '@/utils/searchParamsConverter';

const cardParams = (searchParams: Partial<BrowseSearchParams>) =>
  buildApiParamsFromSearchParams(searchParams as BrowseSearchParams, 'cards') as Record<string, unknown>;

describe('buildApiParamsFromSearchParams — color identity', () => {
  it.each([
    ['exactly', { exactly: ['W', 'U'] }],
    ['atLeast', { atLeast: ['W', 'U'] }],
    ['atMost', { atMost: ['W', 'U'] }],
  ] as const)('writes %s under color_identities_array', (matchType, expected) => {
    const apiParams = cardParams({ colorIdentity: { colors: ['W', 'U'], matchType } });

    expect(apiParams.color_identities_array).toEqual(expected);
  });

  it('sends a colorless identity as exactly no colors', () => {
    const apiParams = cardParams({ colorIdentity: { colors: [], matchType: 'atMost', includeColorless: true } });

    expect(apiParams.color_identities_array).toEqual({ exactly: [] });
  });

  it('lets colorless win over listed colors', () => {
    const apiParams = cardParams({ colorIdentity: { colors: ['G'], matchType: 'exactly', includeColorless: true } });

    expect(apiParams.color_identities_array).toEqual({ exactly: [] });
  });

  it('omits the criterion when nothing is selected', () => {
    expect(cardParams({ colorIdentity: { colors: [], matchType: 'exactly' } })).not.toHaveProperty(
      'color_identities_array',
    );
    expect(cardParams({})).not.toHaveProperty('color_identities_array');
  });

  it('omits the criterion for a match type the API does not know', () => {
    const apiParams = cardParams({ colorIdentity: { colors: ['G'], matchType: 'bogus' as never } });

    expect(apiParams).not.toHaveProperty('color_identities_array');
  });

  // The two filters match different columns and must never write to each other's key.
  it('does not touch colors_array', () => {
    const apiParams = cardParams({ colorIdentity: { colors: ['G'], matchType: 'atLeast' } });

    expect(apiParams).not.toHaveProperty('colors_array');
  });

  it('leaves color identity out when only colors are set', () => {
    const apiParams = cardParams({ colors: { colors: ['G'], matchType: 'atLeast' } });

    expect(apiParams.colors_array).toEqual({ atLeast: ['G'] });
    expect(apiParams).not.toHaveProperty('color_identities_array');
  });

  it('sends both when both are set, each with its own match type', () => {
    const apiParams = cardParams({
      colors: { colors: [], matchType: 'exactly', includeColorless: true },
      colorIdentity: { colors: ['G', 'U'], matchType: 'atMost' },
    });

    expect(apiParams.colors_array).toEqual({ exactly: [] });
    expect(apiParams.color_identities_array).toEqual({ atMost: ['G', 'U'] });
  });

  it('is not sent for a sets search', () => {
    const apiParams = buildApiParamsFromSearchParams(
      { colorIdentity: { colors: ['G'], matchType: 'exactly' } } as BrowseSearchParams,
      'sets',
    );

    expect(apiParams).not.toHaveProperty('color_identities_array');
  });
});
