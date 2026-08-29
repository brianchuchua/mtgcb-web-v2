import { convertStateToUrlParams, parseUrlToState } from '@/features/browse/schema/urlStateAdapters';
import { BrowseSearchParams } from '@/types/browse';

const parseCards = (query: string) => parseUrlToState(new URLSearchParams(query), 'cards');

const toCardParams = (state: Partial<BrowseSearchParams>) =>
  convertStateToUrlParams(state as BrowseSearchParams, 'cards');

describe('urlStateAdapters — frameStyles', () => {
  it('parses included frame styles', () => {
    expect(parseCards('includeFrameStyles=1993|1997')).toHaveProperty('frameStyles', {
      include: ['1993', '1997'],
      exclude: [],
    });
  });

  it('parses excluded frame styles', () => {
    expect(parseCards('excludeFrameStyles=2015')).toHaveProperty('frameStyles', {
      include: [],
      exclude: ['2015'],
    });
  });

  it('serializes both sides', () => {
    const params = toCardParams({ frameStyles: { include: ['1997'], exclude: ['2015'] } });

    expect(params.get('includeFrameStyles')).toBe('1997');
    expect(params.get('excludeFrameStyles')).toBe('2015');
  });

  it('round-trips through the URL and back', () => {
    const query = toCardParams({ frameStyles: { include: ['1993', '1997'], exclude: [] } }).toString();

    expect(parseCards(query)).toHaveProperty('frameStyles', { include: ['1993', '1997'], exclude: [] });
  });

  /**
   * Frame style and frame effect are different columns with similar names; the
   * URL params must not collide.
   */
  it('stays independent of frameEffects', () => {
    const query = toCardParams({
      frameStyles: { include: ['1997'], exclude: [] },
      frameEffects: { include: ['showcase'], exclude: [] },
    }).toString();
    const state = parseCards(query);

    expect(state).toHaveProperty('frameStyles', { include: ['1997'], exclude: [] });
    expect(state).toHaveProperty('frameEffects', { include: ['showcase'], exclude: [] });
  });

  it('does not apply frame styles to sets mode', () => {
    expect(parseUrlToState(new URLSearchParams('includeFrameStyles=1997'), 'sets')).not.toHaveProperty(
      'frameStyles',
    );
  });
});

describe('urlStateAdapters — releaseDate', () => {
  it('parses both bounds', () => {
    expect(parseCards('releasedAfter=2019&releasedBefore=2021')).toHaveProperty('releaseDate', {
      from: '2019',
      to: '2021',
    });
  });

  /**
   * A one-sided window is a normal state — "everything printed since 2019" is
   * the retro frame query — so a lone bound must survive on its own rather than
   * being dropped for want of a partner.
   */
  it('parses a from-only window', () => {
    expect(parseCards('releasedAfter=2019')).toHaveProperty('releaseDate', { from: '2019' });
  });

  it('parses a to-only window', () => {
    expect(parseCards('releasedBefore=2003-07')).toHaveProperty('releaseDate', { to: '2003-07' });
  });

  it('leaves releaseDate absent when neither bound is present', () => {
    expect(parseCards('cardName=Plains')).not.toHaveProperty('releaseDate');
  });

  it('serializes both bounds', () => {
    const params = toCardParams({ releaseDate: { from: '2019-01', to: '2021-12-31' } });

    expect(params.get('releasedAfter')).toBe('2019-01');
    expect(params.get('releasedBefore')).toBe('2021-12-31');
  });

  it('omits the bound that is not set', () => {
    const params = toCardParams({ releaseDate: { from: '2019' } });

    expect(params.get('releasedAfter')).toBe('2019');
    expect(params.has('releasedBefore')).toBe(false);
  });

  it.each([
    [{ from: '2019', to: '2021' }],
    [{ from: '2019' }],
    [{ to: '2021' }],
    [{ from: '2019-07-12', to: '2019-07-12' }],
  ])('round-trips %p through the URL and back', (releaseDate) => {
    const query = toCardParams({ releaseDate }).toString();

    expect(parseCards(query)).toHaveProperty('releaseDate', releaseDate);
  });

  it('survives alongside the frame style filter it is meant to be paired with', () => {
    const query = toCardParams({
      frameStyles: { include: ['1997'], exclude: [] },
      releaseDate: { from: '2019' },
    }).toString();
    const state = parseCards(query);

    expect(state).toHaveProperty('frameStyles', { include: ['1997'], exclude: [] });
    expect(state).toHaveProperty('releaseDate', { from: '2019' });
  });

  it('does not apply the release date to sets mode', () => {
    expect(parseUrlToState(new URLSearchParams('releasedAfter=2019'), 'sets')).not.toHaveProperty('releaseDate');
  });
});
