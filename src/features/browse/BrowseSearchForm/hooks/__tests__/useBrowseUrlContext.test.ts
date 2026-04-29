import { renderHook } from '@testing-library/react';
import { useBrowseUrlContext } from '../useBrowseUrlContext';
import { mockNextNavigation, resetAllMocks } from '@/__tests__/utils/mockHelpers';

describe('useBrowseUrlContext', () => {
  afterEach(() => {
    resetAllMocks();
  });

  describe('userId from /collections/[userId]', () => {
    it('returns null for /collections/0 (the production bug)', () => {
      mockNextNavigation({ pathname: '/collections/0' });
      const { result } = renderHook(() => useBrowseUrlContext());
      expect(result.current.userId).toBeNull();
    });

    it('returns null for /collections/-1', () => {
      mockNextNavigation({ pathname: '/collections/-1' });
      const { result } = renderHook(() => useBrowseUrlContext());
      expect(result.current.userId).toBeNull();
    });

    it('returns null for /collections/abc', () => {
      mockNextNavigation({ pathname: '/collections/abc' });
      const { result } = renderHook(() => useBrowseUrlContext());
      expect(result.current.userId).toBeNull();
    });

    it('returns the parsed integer for /collections/42', () => {
      mockNextNavigation({ pathname: '/collections/42' });
      const { result } = renderHook(() => useBrowseUrlContext());
      expect(result.current.userId).toBe(42);
    });

    it('returns null when userId in path is 0 even with set slug', () => {
      mockNextNavigation({ pathname: '/collections/0/lea' });
      const { result } = renderHook(() => useBrowseUrlContext());
      expect(result.current.userId).toBeNull();
    });

    it('returns the parsed integer with set slug present', () => {
      mockNextNavigation({ pathname: '/collections/42/lea' });
      const { result } = renderHook(() => useBrowseUrlContext());
      expect(result.current.userId).toBe(42);
    });
  });

  describe('userId on non-collection pages', () => {
    it('returns null for /browse', () => {
      mockNextNavigation({ pathname: '/browse' });
      const { result } = renderHook(() => useBrowseUrlContext());
      expect(result.current.userId).toBeNull();
    });

    it('returns null for /browse/sets', () => {
      mockNextNavigation({ pathname: '/browse/sets' });
      const { result } = renderHook(() => useBrowseUrlContext());
      expect(result.current.userId).toBeNull();
    });
  });

  describe('userId from sessionStorage on /shared pages', () => {
    it('returns null when sessionStorage has userId 0', () => {
      sessionStorage.setItem('mtgcb_share_user', JSON.stringify('0'));
      mockNextNavigation({ pathname: '/shared/some-token' });
      const { result } = renderHook(() => useBrowseUrlContext());
      expect(result.current.userId).toBeNull();
    });

    it('returns the parsed integer when sessionStorage has a positive userId', () => {
      sessionStorage.setItem('mtgcb_share_user', JSON.stringify('42'));
      mockNextNavigation({ pathname: '/shared/some-token' });
      const { result } = renderHook(() => useBrowseUrlContext());
      expect(result.current.userId).toBe(42);
    });

    it('returns null when sessionStorage is empty', () => {
      mockNextNavigation({ pathname: '/shared/some-token' });
      const { result } = renderHook(() => useBrowseUrlContext());
      expect(result.current.userId).toBeNull();
    });
  });
});
