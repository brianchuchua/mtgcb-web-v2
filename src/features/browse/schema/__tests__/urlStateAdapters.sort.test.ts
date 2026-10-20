import { convertStateToUrlParams, parseUrlToState } from '@/features/browse/schema/urlStateAdapters';
import { BrowseSearchParams } from '@/types/browse';

const toParams = (state: Partial<BrowseSearchParams>, mode: 'cards' | 'sets') =>
  convertStateToUrlParams(state as BrowseSearchParams, mode);

const parse = (query: string, mode: 'cards' | 'sets') => parseUrlToState(new URLSearchParams(query), mode);

/**
 * A sort in the URL wins. No sort in the URL means the viewer's own saved sort, so a fully
 * default sort stays out of the URL, and any other sort is written as a complete pair.
 */
describe('urlStateAdapters — sort', () => {
  it('leaves the default cards sort out of the URL', () => {
    const params = toParams({ sortBy: 'releasedAt', sortOrder: 'asc' }, 'cards');
    expect(params.has('cardsSortBy')).toBe(false);
    expect(params.has('cardsSortOrder')).toBe(false);
  });

  it('leaves the default sets sort out of the URL', () => {
    const params = toParams({ sortBy: 'releasedAt', sortOrder: 'desc' }, 'sets');
    expect(params.has('setsSortBy')).toBe(false);
    expect(params.has('setsSortOrder')).toBe(false);
  });

  it('writes the default order alongside a non-default column', () => {
    const params = toParams({ sortBy: 'artist', sortOrder: 'asc' }, 'cards');
    expect(params.get('cardsSortBy')).toBe('artist');
    expect(params.get('cardsSortOrder')).toBe('asc');
  });

  it('writes the default column alongside a non-default order', () => {
    const params = toParams({ sortBy: 'releasedAt', sortOrder: 'asc' }, 'sets');
    expect(params.get('setsSortBy')).toBe('releasedAt');
    expect(params.get('setsSortOrder')).toBe('asc');
  });

  it('still leaves other default params out when the sort is written', () => {
    const params = toParams({ sortBy: 'name', sortOrder: 'asc', showGoals: 'all' }, 'cards');
    expect(Array.from(params.keys()).sort()).toEqual(['cardsSortBy', 'cardsSortOrder']);
  });

  it('writes a non-default sort', () => {
    const params = toParams({ sortBy: 'name', sortOrder: 'desc' }, 'cards');
    expect(params.get('cardsSortBy')).toBe('name');
    expect(params.get('cardsSortOrder')).toBe('desc');
  });

  it.each([
    ['cards', 'name', 'desc'],
    ['cards', 'artist', 'asc'],
    ['sets', 'releasedAt', 'asc'],
    ['sets', 'category', 'asc'],
  ] as const)('round-trips a %s sort of %s %s', (mode, sortBy, sortOrder) => {
    const query = toParams({ sortBy, sortOrder }, mode).toString();
    expect(parse(query, mode)).toMatchObject({ sortBy, sortOrder });
  });

  it('leaves sort unset when the URL has none, so the saved sort applies', () => {
    expect(parse('name=bolt', 'cards')).not.toHaveProperty('sortBy');
    expect(parse('name=bolt', 'cards')).not.toHaveProperty('sortOrder');
  });
});
