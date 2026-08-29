import { BrowseSearchParams } from '@/types/browse';
import { buildApiParamsFromSearchParams } from '@/utils/searchParamsConverter';

const cardParams = (params: Partial<BrowseSearchParams>) =>
  buildApiParamsFromSearchParams(params as BrowseSearchParams, 'cards') as Record<string, unknown>;

describe('buildApiParamsFromSearchParams — frame styles', () => {
  it('sends includes as an OR', () => {
    const apiParams = cardParams({ frameStyles: { include: ['1993', '1997'], exclude: [] } });

    expect(apiParams).toHaveProperty('frameStyle', { OR: ['1993', '1997'] });
  });

  it('sends excludes as a NOT', () => {
    const apiParams = cardParams({ frameStyles: { include: [], exclude: ['2015'] } });

    expect(apiParams).toHaveProperty('frameStyle', { NOT: ['2015'] });
  });

  it('sends both sides together', () => {
    const apiParams = cardParams({ frameStyles: { include: ['1997'], exclude: ['2015'] } });

    expect(apiParams).toHaveProperty('frameStyle', { OR: ['1997'], NOT: ['2015'] });
  });

  /**
   * Border colours are quoted for an exact match; the frame era is matched
   * exactly by the API itself, so quoting it here would search for a value with
   * literal quotes in it and return nothing.
   */
  it('sends the raw token, unquoted', () => {
    const apiParams = cardParams({ frameStyles: { include: ['1997'], exclude: [] } });

    expect(JSON.stringify(apiParams.frameStyle)).not.toContain('\\"');
  });

  it('omits the filter when nothing is selected', () => {
    expect(cardParams({ frameStyles: { include: [], exclude: [] } })).not.toHaveProperty('frameStyle');
    expect(cardParams({})).not.toHaveProperty('frameStyle');
  });

  it('writes to frameStyle, not frameEffects', () => {
    const apiParams = cardParams({
      frameStyles: { include: ['1997'], exclude: [] },
      frameEffects: { include: ['showcase'], exclude: [] },
    });

    expect(apiParams).toHaveProperty('frameStyle', { OR: ['1997'] });
    expect(apiParams).toHaveProperty('frameEffects', { OR: ['showcase'] });
  });
});

describe('buildApiParamsFromSearchParams — release date', () => {
  /**
   * Both bounds are inclusive. The API reads a bare year as the whole year, so
   * `<=2021` runs through Dec 31 2021 — pairing `>=` with `<=` is what makes a
   * two-year window mean both years entirely.
   */
  it('sends a two-sided window as an inclusive AND range', () => {
    const apiParams = cardParams({ releaseDate: { from: '2019', to: '2021' } });

    expect(apiParams).toHaveProperty('releasedAt', { AND: ['>=2019', '<=2021'] });
  });

  it('sends a from-only window as a single token', () => {
    expect(cardParams({ releaseDate: { from: '2019' } })).toHaveProperty('releasedAt', '>=2019');
  });

  it('sends a to-only window as a single token', () => {
    expect(cardParams({ releaseDate: { to: '2003-07' } })).toHaveProperty('releasedAt', '<=2003-07');
  });

  it('passes month and day precision through unchanged', () => {
    const apiParams = cardParams({ releaseDate: { from: '2019-07-12', to: '2020-01' } });

    expect(apiParams).toHaveProperty('releasedAt', { AND: ['>=2019-07-12', '<=2020-01'] });
  });

  it('omits the filter when neither bound is set', () => {
    expect(cardParams({ releaseDate: {} })).not.toHaveProperty('releasedAt');
    expect(cardParams({})).not.toHaveProperty('releasedAt');
  });
});

/**
 * The patron request: "collect every retro frame card". Neither filter expresses
 * it alone, so the pair has to arrive at the API together and untangled.
 */
describe('buildApiParamsFromSearchParams — the retro frame query', () => {
  it('sends the frame era and the date bound as separate criteria', () => {
    const apiParams = cardParams({
      frameStyles: { include: ['1993', '1997'], exclude: [] },
      releaseDate: { from: '2019' },
    });

    expect(apiParams).toHaveProperty('frameStyle', { OR: ['1993', '1997'] });
    expect(apiParams).toHaveProperty('releasedAt', '>=2019');
  });

  it('leaves the other treatment filters alone', () => {
    const apiParams = cardParams({
      frameStyles: { include: ['1997'], exclude: [] },
      releaseDate: { from: '2019' },
      borderColors: { include: ['borderless'], exclude: [] },
      isFullArt: true,
    });

    expect(apiParams).toHaveProperty('borderColor', { OR: ['borderless'] });
    expect(apiParams).toHaveProperty('isFullArt', true);
  });
});
