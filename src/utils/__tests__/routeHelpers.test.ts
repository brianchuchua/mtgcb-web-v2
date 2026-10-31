import {
  isBrowsePage,
  isBrowseSetPage,
  isCollectionPage,
  isCollectionSetPage,
  isSetSpecificPage,
} from '@/utils/routeHelpers';

describe('routeHelpers', () => {
  it.each([
    // pathname, collection, collectionSet, browse, browseSet, setSpecific
    ['/browse', false, false, true, false, false],
    ['/browse/sets/foundations', false, false, true, true, true],
    ['/browse/sets/foundations/extra', false, false, true, false, false],
    ['/browse/sets', false, false, true, false, false],
    ['/browse/cards/lightning-bolt/123', false, false, true, false, false],
    ['/collections/123', true, false, false, false, false],
    ['/collections/123/foundations', true, true, false, false, true],
    ['/collections/123/cards/lightning-bolt/9', true, false, false, false, false],
    ['/collections/abc', false, false, false, false, false],
    ['/collections/edit-cards', false, false, false, false, false],
    ['/shared/token/foundations', false, false, false, false, true],
    ['/shared/token', false, false, false, false, false],
    ['/shared/token/cards/lightning-bolt/9', false, false, false, false, false],
    ['/', false, false, false, false, false],
  ])('%s', (pathname, collection, collectionSet, browse, browseSet, setSpecific) => {
    expect(isCollectionPage(pathname)).toBe(collection);
    expect(isCollectionSetPage(pathname)).toBe(collectionSet);
    expect(isBrowsePage(pathname)).toBe(browse);
    expect(isBrowseSetPage(pathname)).toBe(browseSet);
    expect(isSetSpecificPage(pathname)).toBe(setSpecific);
  });
});
