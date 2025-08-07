import { useEffect, useState, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const SHARE_TOKEN_KEY = 'mtgcb_share_token';
const SHARE_USER_KEY = 'mtgcb_share_user';

export interface ShareTokenData {
  token: string;
  userId: string;
}

export const useShareToken = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [shareUserId, setShareUserId] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('share');
    const pathSegments = pathname.split('/');
    const collectionsIndex = pathSegments.indexOf('collections');
    const userId = collectionsIndex !== -1 ? pathSegments[collectionsIndex + 1] : null;

    if (token && userId) {
      sessionStorage.setItem(SHARE_TOKEN_KEY, token);
      sessionStorage.setItem(SHARE_USER_KEY, userId);
      setShareToken(token);
      setShareUserId(userId);
    } else if (userId) {
      const storedToken = sessionStorage.getItem(SHARE_TOKEN_KEY);
      const storedUserId = sessionStorage.getItem(SHARE_USER_KEY);
      
      if (storedToken && storedUserId === userId) {
        setShareToken(storedToken);
        setShareUserId(storedUserId);
      } else {
        clearShareToken();
      }
    } else {
      const storedToken = sessionStorage.getItem(SHARE_TOKEN_KEY);
      const storedUserId = sessionStorage.getItem(SHARE_USER_KEY);
      
      if (storedToken && storedUserId) {
        setShareToken(storedToken);
        setShareUserId(storedUserId);
      }
    }
  }, [pathname, searchParams]);

  const clearShareToken = useCallback(() => {
    sessionStorage.removeItem(SHARE_TOKEN_KEY);
    sessionStorage.removeItem(SHARE_USER_KEY);
    setShareToken(null);
    setShareUserId(null);
  }, []);

  const isViewingSharedCollection = useCallback((userId: string | number) => {
    const userIdStr = String(userId);
    return shareToken !== null && shareUserId === userIdStr;
  }, [shareToken, shareUserId]);

  const appendShareParam = useCallback((url: string) => {
    if (!shareToken) return url;
    
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}share=${shareToken}`;
  }, [shareToken]);

  const getShareParams = useCallback((): Record<string, string> => {
    if (!shareToken) return {};
    return { share: shareToken };
  }, [shareToken]);

  return {
    shareToken,
    shareUserId,
    isViewingSharedCollection,
    clearShareToken,
    appendShareParam,
    getShareParams,
  };
};