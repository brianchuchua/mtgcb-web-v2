import { convertStateToUrlParams, parseUrlToState } from '@/features/browse/schema/urlStateAdapters';
import { BrowseSearchParams } from '@/types/browse';

const parseCards = (query: string) => parseUrlToState(new URLSearchParams(query), 'cards');

const toCardParams = (state: Partial<BrowseSearchParams>) =>
  convertStateToUrlParams(state as BrowseSearchParams, 'cards');

/**
 * isFullArt is tri-state. The failure mode worth guarding is the boolean parse
 * collapsing "exclude" into "only": `isFullArt=false` must survive the URL round
 * trip as `false`, not `true` and not `undefined`.
 */
describe('urlStateAdapters — isFullArt', () => {
  it('parses isFullArt=true from the URL', () => {
    expect(parseCards('isFullArt=true')).toHaveProperty('isFullArt', true);
  });

  it('parses isFullArt=false as false, not true', () => {
    expect(parseCards('isFullArt=false')).toHaveProperty('isFullArt', false);
  });

  it('leaves isFullArt absent when the URL omits it', () => {
    expect(parseCards('cardName=Plains')).not.toHaveProperty('isFullArt');
  });

  it('serializes isFullArt true', () => {
    expect(toCardParams({ isFullArt: true }).get('isFullArt')).toBe('true');
  });

  it('serializes isFullArt false', () => {
    expect(toCardParams({ isFullArt: false }).get('isFullArt')).toBe('false');
  });

  it('omits isFullArt from the URL when unset', () => {
    expect(toCardParams({ isFullArt: undefined }).has('isFullArt')).toBe(false);
  });

  it.each([true, false])('round-trips isFullArt=%s through URL and back', (value) => {
    const query = toCardParams({ isFullArt: value }).toString();

    expect(parseCards(query)).toHaveProperty('isFullArt', value);
  });

  it('keeps isFullArt and isReserved independent across the round trip', () => {
    const query = toCardParams({ isFullArt: true, isReserved: false }).toString();
    const state = parseCards(query);

    expect(state).toHaveProperty('isFullArt', true);
    expect(state).toHaveProperty('isReserved', false);
  });

  it('does not apply isFullArt to sets mode', () => {
    expect(parseUrlToState(new URLSearchParams('isFullArt=true'), 'sets')).not.toHaveProperty('isFullArt');
  });
});

/**
 * Treatment filters are shareable via URL like every other browse filter. The
 * pipe separator and the quoting on border colours both have to survive a round
 * trip, since a mangled quote turns an exact match into a miss.
 */
describe('urlStateAdapters — treatments', () => {
  it('serializes border colour includes and excludes to their own params', () => {
    const params = toCardParams({
      borderColors: { include: ['"borderless"', '"gold"'], exclude: ['"black"'] },
    });

    expect(params.get('includeBorderColors')).toContain('borderless');
    expect(params.get('excludeBorderColors')).toContain('black');
  });

  it('round-trips border colours including their quoting', () => {
    const query = toCardParams({
      borderColors: { include: ['"borderless"'], exclude: ['"black"'] },
    }).toString();

    expect(parseCards(query).borderColors).toEqual({
      include: ['"borderless"'],
      exclude: ['"black"'],
    });
  });

  it('round-trips several frame effects unquoted', () => {
    const query = toCardParams({
      frameEffects: { include: ['extendedart', 'showcase'], exclude: ['inverted'] },
    }).toString();

    expect(parseCards(query).frameEffects).toEqual({
      include: ['extendedart', 'showcase'],
      exclude: ['inverted'],
    });
  });

  it('omits treatment params when the selections are empty', () => {
    const params = toCardParams({
      borderColors: { include: [], exclude: [] },
      frameEffects: { include: [], exclude: [] },
    });

    expect(params.has('includeBorderColors')).toBe(false);
    expect(params.has('includeFrameEffects')).toBe(false);
  });

  it('keeps treatments and the full art flag independent across a round trip', () => {
    const query = toCardParams({
      isFullArt: true,
      borderColors: { include: ['"borderless"'], exclude: [] },
      frameEffects: { include: ['showcase'], exclude: [] },
    }).toString();
    const state = parseCards(query);

    expect(state.isFullArt).toBe(true);
    expect(state.borderColors?.include).toEqual(['"borderless"']);
    expect(state.frameEffects?.include).toEqual(['showcase']);
  });

  it('does not apply treatments to sets mode', () => {
    const query = toCardParams({ frameEffects: { include: ['showcase'], exclude: [] } }).toString();

    expect(parseUrlToState(new URLSearchParams(query), 'sets')).not.toHaveProperty('frameEffects');
  });
});
