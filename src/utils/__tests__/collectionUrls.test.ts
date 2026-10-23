import {
  getArtistSearchUrl,
  getCollectionCardUrl,
  getCollectionSetUrl,
  getCollectionUrl,
  setShareModeConfig,
} from '@/utils/collectionUrls';
import { smartEncodeToken } from '@/utils/tokenEncoder';

const HEX_TOKEN = 'ffb676098ccc57db3c965976c4bb1515b7122fb086fe5db5562cdfa3cc832bd9';
const ENCODED = smartEncodeToken(HEX_TOKEN);

afterEach(() => {
  setShareModeConfig(false, null);
});

describe('normal mode', () => {
  it('builds a collection set url', () => {
    expect(getCollectionSetUrl(5, 'foundations')).toBe('/collections/5/foundations');
    expect(getCollectionSetUrl('5', 'foundations', 12)).toBe('/collections/5/foundations?goalId=12');
  });

  it.each([null, undefined, 0])('omits a goalId of %p from the set url', (goalId) => {
    expect(getCollectionSetUrl(5, 'foundations', goalId)).toBe('/collections/5/foundations');
  });

  it('builds a collection url with optional contentType and goalId', () => {
    expect(getCollectionUrl({ userId: 5 })).toBe('/collections/5');
    expect(getCollectionUrl({ userId: 5, contentType: 'cards' })).toBe('/collections/5?contentType=cards');
    expect(getCollectionUrl({ userId: 5, goalId: 7 })).toBe('/collections/5?goalId=7');
    expect(getCollectionUrl({ userId: 5, contentType: 'sets', goalId: 7 })).toBe(
      '/collections/5?contentType=sets&goalId=7',
    );
    expect(getCollectionUrl({ userId: 5, goalId: null })).toBe('/collections/5');
  });

  it('builds a collection card url', () => {
    expect(getCollectionCardUrl(5, 'lightning-bolt', 123)).toBe('/collections/5/cards/lightning-bolt/123');
  });

  it('builds an artist search inside the collection when a user is given', () => {
    expect(getArtistSearchUrl('John Avon', 5)).toBe('/collections/5?contentType=cards&artist=John%20Avon');
    expect(getArtistSearchUrl('John Avon', '5')).toBe('/collections/5?contentType=cards&artist=John%20Avon');
  });

  it.each([undefined, null, 0, ''])('builds an artist search on browse when the user is %p', (userId) => {
    expect(getArtistSearchUrl('John Avon', userId)).toBe('/browse?contentType=cards&artist=John%20Avon');
  });

  it('encodes artist names with reserved characters', () => {
    expect(getArtistSearchUrl('Foo & Bar')).toBe('/browse?contentType=cards&artist=Foo%20%26%20Bar');
  });
});

describe('share-token mode', () => {
  beforeEach(() => {
    setShareModeConfig(true, HEX_TOKEN);
  });

  it('uses the encoded token for the set url and ignores the user id', () => {
    expect(getCollectionSetUrl(5, 'foundations')).toBe(`/shared/${ENCODED}/foundations`);
    expect(getCollectionSetUrl(5, 'foundations', 12)).toBe(`/shared/${ENCODED}/foundations?goalId=12`);
  });

  it('uses the encoded token for the collection url', () => {
    expect(getCollectionUrl({ userId: 5 })).toBe(`/shared/${ENCODED}`);
    expect(getCollectionUrl({ userId: 5, contentType: 'cards', goalId: 7 })).toBe(
      `/shared/${ENCODED}?contentType=cards&goalId=7`,
    );
  });

  it('uses the encoded token for the card url', () => {
    expect(getCollectionCardUrl(5, 'lightning-bolt', 123)).toBe(`/shared/${ENCODED}/cards/lightning-bolt/123`);
  });

  it('keeps an artist search inside the shared collection', () => {
    expect(getArtistSearchUrl('John Avon', 5)).toBe(`/shared/${ENCODED}?contentType=cards&artist=John%20Avon`);
  });

  it('does not re-encode a token that is not hex', () => {
    setShareModeConfig(true, 'shortToken');

    expect(getCollectionUrl({ userId: 5 })).toBe('/shared/shortToken');
  });
});

describe('share-mode config without a usable token', () => {
  it('falls back to normal urls when token-only mode has no token', () => {
    setShareModeConfig(true, null);

    expect(getCollectionUrl({ userId: 5 })).toBe('/collections/5');
    expect(getCollectionSetUrl(5, 'foundations')).toBe('/collections/5/foundations');
    expect(getCollectionCardUrl(5, 'bolt', 1)).toBe('/collections/5/cards/bolt/1');
  });

  it('falls back to normal urls when a token is set but token-only mode is off', () => {
    setShareModeConfig(false, HEX_TOKEN);

    expect(getCollectionUrl({ userId: 5 })).toBe('/collections/5');
    expect(getCollectionCardUrl(5, 'bolt', 1)).toBe('/collections/5/cards/bolt/1');
  });
});
