import { isCollectionPath } from '../useIsCollectionContext';
import { filterCollectionParams } from '@/utils/collectionContextFilter';

describe('isCollectionPath', () => {
  it.each([
    ['/collections/1337', true],
    ['/collections/1337/alpha', true],
    ['/shared/abc123', true],
    ['/shared/abc123/alpha', true],
    ['/shared/abc123/cards/black-lotus/1', true],
    ['/browse', false],
    ['/browse/sets/alpha', false],
    ['/', false],
    [null, false],
    [undefined, false],
  ])('%s -> %s', (pathname, expected) => {
    expect(isCollectionPath(pathname)).toBe(expected);
  });
});

describe('share links keep collection-only params', () => {
  const setParams = {
    completionStatus: { include: ['complete', 'partial'], exclude: [] },
    sortBy: 'percentageCollected',
    sortOrder: 'desc',
  } as const;

  it('keeps completionStatus and collection sorts on /shared/', () => {
    const filtered = filterCollectionParams({ ...setParams }, isCollectionPath('/shared/abc123'), 'sets');

    expect(filtered.completionStatus).toEqual(setParams.completionStatus);
    expect(filtered.sortBy).toBe('percentageCollected');
  });

  it('still strips them on /browse', () => {
    const filtered = filterCollectionParams({ ...setParams }, isCollectionPath('/browse'), 'sets');

    expect(filtered).not.toHaveProperty('completionStatus');
    expect(filtered.sortBy).toBe('releasedAt');
  });
});
