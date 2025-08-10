import { useEffect, useState, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { smartDecodeToken } from '@/utils/tokenEncoder';

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
  const [isSharedUrl, setIsSharedUrl] = useState(false);

  // Poll sessionStorage for userId updates when on shared URLs
  useEffect(() => {
    if (!pathname.startsWith('/shared/')) return;
    
    const checkForUserId = () => {
      const storedUserId = sessionStorage.getItem(SHARE_USER_KEY);
      if (storedUserId && storedUserId !== shareUserId) {
        setShareUserId(storedUserId);
      }
    };
    
    // Check immediately
    checkForUserId();
    
    // Poll every 500ms for up to 5 seconds
    const interval = setInterval(checkForUserId, 500);
    const timeout = setTimeout(() => clearInterval(interval), 5000);
    
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [pathname, shareUserId]);

  useEffect(() => {
    const pathSegments = pathname.split('/');
    
    // Check for new token-only URL format: /shared/[token]
    const sharedIndex = pathSegments.indexOf('shared');
    if (sharedIndex !== -1 && pathSegments[sharedIndex + 1]) {
      const encodedToken = pathSegments[sharedIndex + 1];
      const decodedToken = smartDecodeToken(encodedToken);
      
      // Store the token
      sessionStorage.setItem(SHARE_TOKEN_KEY, decodedToken);
      setShareToken(decodedToken);
      setIsSharedUrl(true);
      
      // Check if userId has been set by the shared page component
      const storedUserId = sessionStorage.getItem(SHARE_USER_KEY);
      if (storedUserId) {
        setShareUserId(storedUserId);
      }
      return;
    }
    
    setIsSharedUrl(false);
    
    // Legacy format: /collections/[userId]?share=[token]
    const token = searchParams.get('share');
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
    // First check if we have a share token
    if (!shareToken) return false;
    
    // For /shared/ URLs, we're always viewing a shared collection
    if (isSharedUrl) return true;
    
    // For legacy URLs, check if the userId matches
    const userIdStr = String(userId);
    return shareUserId === userIdStr;
  }, [shareToken, shareUserId, isSharedUrl]);

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