import { addShareParamToBody, appendShareToken, getShareTokenFromWindow } from '@/api/utils/shareTokenUtils';

const TOKEN_KEY = 'mtgcb_share_token';
const USER_KEY = 'mtgcb_share_user';

const goTo = (url: string) => window.history.pushState({}, '', url);

describe('appendShareToken', () => {
  it.each([null, undefined, ''])('returns the url unchanged when the token is %p', (token) => {
    expect(appendShareToken('/cards/search', token)).toBe('/cards/search');
  });

  it('starts a query string when the url has none', () => {
    expect(appendShareToken('/cards/search', 'tok')).toBe('/cards/search?share=tok');
  });

  it('extends an existing query string', () => {
    expect(appendShareToken('/collection/summary?userId=5', 'tok')).toBe('/collection/summary?userId=5&share=tok');
  });

  it.each(['/user/share-link', '/auth/me', '/auth/login', '/user', '/user?foo=1'])(
    'never appends to excluded endpoint %s',
    (url) => {
      expect(appendShareToken(url, 'tok')).toBe(url);
    },
  );

  // Exclusion is substring-based, so anything containing "/user" is skipped too (current behavior).
  it('also skips endpoints that merely contain "/user"', () => {
    expect(appendShareToken('/users/resolve-share-token', 'tok')).toBe('/users/resolve-share-token');
  });
});

describe('getShareTokenFromWindow', () => {
  beforeEach(() => {
    sessionStorage.clear();
    goTo('/');
  });

  afterAll(() => {
    sessionStorage.clear();
    goTo('/');
  });

  it('returns the stored token on a /shared/ page', () => {
    sessionStorage.setItem(TOKEN_KEY, 'stored');
    goTo('/shared/abc123');

    expect(getShareTokenFromWindow()).toBe('stored');
  });

  it('prefers the stored token over ?share= on a /shared/ page', () => {
    sessionStorage.setItem(TOKEN_KEY, 'stored');
    goTo('/shared/abc123/some-set?share=query');

    expect(getShareTokenFromWindow()).toBe('stored');
  });

  it('falls back to ?share= on a /shared/ page with nothing stored', () => {
    goTo('/shared/abc123?share=query');

    expect(getShareTokenFromWindow()).toBe('query');
  });

  it('reads the legacy ?share= query param', () => {
    goTo('/collections/5?share=query');

    expect(getShareTokenFromWindow()).toBe('query');
  });

  it('prefers ?share= over a stored token on a collection page', () => {
    sessionStorage.setItem(TOKEN_KEY, 'stored');
    sessionStorage.setItem(USER_KEY, '5');
    goTo('/collections/5?share=query');

    expect(getShareTokenFromWindow()).toBe('query');
  });

  it('returns the stored token when viewing the same user collection', () => {
    sessionStorage.setItem(TOKEN_KEY, 'stored');
    sessionStorage.setItem(USER_KEY, '5');
    goTo('/collections/5/some-set');

    expect(getShareTokenFromWindow()).toBe('stored');
  });

  it('ignores the stored token on a different user collection', () => {
    sessionStorage.setItem(TOKEN_KEY, 'stored');
    sessionStorage.setItem(USER_KEY, '5');
    goTo('/collections/6');

    expect(getShareTokenFromWindow()).toBeNull();
  });

  it('ignores the stored token outside a collection', () => {
    sessionStorage.setItem(TOKEN_KEY, 'stored');
    sessionStorage.setItem(USER_KEY, '5');
    goTo('/browse');

    expect(getShareTokenFromWindow()).toBeNull();
  });

  // A token stored without its user id matches the null "current user" of a non-collection page (current behavior).
  it('returns a stored token with no stored user on a non-collection page', () => {
    sessionStorage.setItem(TOKEN_KEY, 'stored');
    goTo('/browse');

    expect(getShareTokenFromWindow()).toBe('stored');
  });

  it('returns null when nothing is available', () => {
    goTo('/collections/5');

    expect(getShareTokenFromWindow()).toBeNull();
  });

  it('treats unavailable sessionStorage as empty', () => {
    const getItem = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    goTo('/shared/abc123?share=query');

    expect(getShareTokenFromWindow()).toBe('query');

    getItem.mockRestore();
  });
});

describe('addShareParamToBody', () => {
  it('adds the share token to the body', () => {
    expect(addShareParamToBody({ limit: 20 }, 'tok')).toEqual({ limit: 20, share: 'tok' });
  });

  it('returns the same body when there is no token', () => {
    const body = { limit: 20 };

    expect(addShareParamToBody(body, null)).toBe(body);
    expect(addShareParamToBody(body)).toBe(body);
  });

  it('does not mutate the original body', () => {
    const body = { limit: 20 };
    addShareParamToBody(body, 'tok');

    expect(body).toEqual({ limit: 20 });
  });
});
