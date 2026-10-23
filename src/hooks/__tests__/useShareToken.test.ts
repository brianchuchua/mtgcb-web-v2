import { act, renderHook } from '@testing-library/react';
import { useShareToken } from '@/hooks/useShareToken';
import { encodeToken } from '@/utils/tokenEncoder';

let mockPathname = '/';
let mockSearchParams = new URLSearchParams();
jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearchParams,
}));

const TOKEN_KEY = 'mtgcb_share_token';
const USER_KEY = 'mtgcb_share_user';
const HEX_TOKEN = 'ffb676098ccc57db3c965976c4bb1515b7122fb086fe5db5562cdfa3cc832bd9';

const visit = (path: string) => {
  const [pathname, query = ''] = path.split('?');
  mockPathname = pathname;
  mockSearchParams = new URLSearchParams(query);
};

describe('useShareToken', () => {
  beforeEach(() => {
    sessionStorage.clear();
    visit('/');
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('on /shared/<token> links', () => {
    it('stores a hex token as-is and treats every collection as shared', () => {
      visit(`/shared/${HEX_TOKEN}/some-set`);
      const { result } = renderHook(() => useShareToken());

      expect(result.current.shareToken).toBe(HEX_TOKEN);
      expect(sessionStorage.getItem(TOKEN_KEY)).toBe(HEX_TOKEN);
      expect(result.current.isViewingSharedCollection(1)).toBe(true);
      expect(result.current.isViewingSharedCollection('999')).toBe(true);
    });

    it('decodes a shortened base62 token back to hex', () => {
      visit(`/shared/${encodeToken(HEX_TOKEN)}`);
      const { result } = renderHook(() => useShareToken());
      expect(result.current.shareToken).toBe(HEX_TOKEN);
      expect(sessionStorage.getItem(TOKEN_KEY)).toBe(HEX_TOKEN);
    });

    it('reads the owner id once the shared page has stored it', () => {
      jest.useFakeTimers();
      visit(`/shared/${HEX_TOKEN}`);
      const { result } = renderHook(() => useShareToken());
      expect(result.current.shareUserId).toBeNull();

      sessionStorage.setItem(USER_KEY, '1337');
      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current.shareUserId).toBe('1337');
    });

    it('stops polling for the owner id after five seconds', () => {
      jest.useFakeTimers();
      visit(`/shared/${HEX_TOKEN}`);
      const { result } = renderHook(() => useShareToken());

      act(() => {
        jest.advanceTimersByTime(5000);
      });
      sessionStorage.setItem(USER_KEY, '1337');
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.shareUserId).toBeNull();
    });
  });

  describe('on legacy /collections/<userId>?share=<token> links', () => {
    it('stores the token for that user only', () => {
      visit('/collections/42?share=tok123');
      const { result } = renderHook(() => useShareToken());

      expect(result.current.shareToken).toBe('tok123');
      expect(result.current.shareUserId).toBe('42');
      expect(sessionStorage.getItem(TOKEN_KEY)).toBe('tok123');
      expect(sessionStorage.getItem(USER_KEY)).toBe('42');
      expect(result.current.isViewingSharedCollection(42)).toBe(true);
      expect(result.current.isViewingSharedCollection('7')).toBe(false);
    });

    it('reuses the stored token when returning to the same collection without ?share', () => {
      sessionStorage.setItem(TOKEN_KEY, 'tok123');
      sessionStorage.setItem(USER_KEY, '42');
      visit('/collections/42/some-set');
      const { result } = renderHook(() => useShareToken());

      expect(result.current.shareToken).toBe('tok123');
      expect(result.current.isViewingSharedCollection(42)).toBe(true);
    });

    it("drops the stored token when visiting a different user's collection", () => {
      sessionStorage.setItem(TOKEN_KEY, 'tok123');
      sessionStorage.setItem(USER_KEY, '42');
      visit('/collections/7');
      const { result } = renderHook(() => useShareToken());

      expect(result.current.shareToken).toBeNull();
      expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull();
      expect(sessionStorage.getItem(USER_KEY)).toBeNull();
      expect(result.current.isViewingSharedCollection(7)).toBe(false);
    });

    it('keeps the stored token on pages outside a collection', () => {
      sessionStorage.setItem(TOKEN_KEY, 'tok123');
      sessionStorage.setItem(USER_KEY, '42');
      visit('/browse');
      const { result } = renderHook(() => useShareToken());

      expect(result.current.shareToken).toBe('tok123');
      expect(result.current.shareUserId).toBe('42');
    });
  });

  it('appends the share param with the right separator only when a token exists', () => {
    const withoutToken = renderHook(() => useShareToken());
    expect(withoutToken.result.current.appendShareParam('/collections/42')).toBe('/collections/42');
    expect(withoutToken.result.current.getShareParams()).toEqual({});
    expect(withoutToken.result.current.isViewingSharedCollection(42)).toBe(false);

    visit('/collections/42?share=tok123');
    const withToken = renderHook(() => useShareToken());
    expect(withToken.result.current.appendShareParam('/collections/42')).toBe('/collections/42?share=tok123');
    expect(withToken.result.current.appendShareParam('/collections/42?page=2')).toBe(
      '/collections/42?page=2&share=tok123',
    );
    expect(withToken.result.current.getShareParams()).toEqual({ share: 'tok123' });
  });

  it('clearShareToken forgets the token in state and storage', () => {
    visit('/collections/42?share=tok123');
    const { result } = renderHook(() => useShareToken());

    act(() => result.current.clearShareToken());

    expect(result.current.shareToken).toBeNull();
    expect(result.current.shareUserId).toBeNull();
    expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(sessionStorage.getItem(USER_KEY)).toBeNull();
  });
});
