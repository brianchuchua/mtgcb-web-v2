import { renderHook } from '@testing-library/react';
import { useNoteLinkUserId } from '../useNoteLinkUserId';
import { mockNextNavigation, resetAllMocks } from '@/__tests__/utils/mockHelpers';
import { useAuth } from '@/hooks/useAuth';

jest.mock('@/hooks/useAuth');

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const signedInAs = (userId: number | null) => {
  mockedUseAuth.mockReturnValue({
    user: userId === null ? null : ({ userId } as any),
    isAuthenticated: userId !== null,
    isLoading: false,
    logout: jest.fn(),
    updateUser: jest.fn(),
  } as any);
};

describe('useNoteLinkUserId', () => {
  afterEach(() => {
    resetAllMocks();
  });

  describe('on browse pages', () => {
    it('returns the signed-in reader own userId', () => {
      signedInAs(42);
      mockNextNavigation({ pathname: '/browse/sets/the-list' });
      const { result } = renderHook(() => useNoteLinkUserId());
      expect(result.current).toBe(42);
    });

    it('returns null when signed out', () => {
      signedInAs(null);
      mockNextNavigation({ pathname: '/browse/sets/the-list' });
      const { result } = renderHook(() => useNoteLinkUserId());
      expect(result.current).toBeNull();
    });

    it('returns null for an invalid userId in auth state', () => {
      signedInAs(0);
      mockNextNavigation({ pathname: '/browse/cards/sol-ring/71320' });
      const { result } = renderHook(() => useNoteLinkUserId());
      expect(result.current).toBeNull();
    });
  });

  describe('on collection pages', () => {
    it('stays in the collection being viewed rather than the reader own', () => {
      signedInAs(42);
      mockNextNavigation({ pathname: '/collections/9/the-list' });
      const { result } = renderHook(() => useNoteLinkUserId());
      expect(result.current).toBe(9);
    });

    it('uses the reader own userId when it is their own collection', () => {
      signedInAs(42);
      mockNextNavigation({ pathname: '/collections/42/the-list' });
      const { result } = renderHook(() => useNoteLinkUserId());
      expect(result.current).toBe(42);
    });

    it('works for a signed-out visitor viewing a public collection', () => {
      signedInAs(null);
      mockNextNavigation({ pathname: '/collections/9/cards/sol-ring/71320' });
      const { result } = renderHook(() => useNoteLinkUserId());
      expect(result.current).toBe(9);
    });

    it('returns null for /collections/0 instead of falling back to the reader own collection', () => {
      signedInAs(42);
      mockNextNavigation({ pathname: '/collections/0/the-list' });
      const { result } = renderHook(() => useNoteLinkUserId());
      expect(result.current).toBeNull();
    });
  });

  describe('on shared pages', () => {
    it('uses the shared collection owner once the token has resolved', () => {
      signedInAs(42);
      sessionStorage.setItem('mtgcb_share_user', JSON.stringify('9'));
      mockNextNavigation({ pathname: '/shared/abc123/the-list' });
      const { result } = renderHook(() => useNoteLinkUserId());
      expect(result.current).toBe(9);
    });

    it('returns null before the token has resolved rather than leaking the reader own collection', () => {
      signedInAs(42);
      mockNextNavigation({ pathname: '/shared/abc123/the-list' });
      const { result } = renderHook(() => useNoteLinkUserId());
      expect(result.current).toBeNull();
    });
  });
});
