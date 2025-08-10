// Endpoints that should never have share tokens appended
const EXCLUDE_SHARE_TOKEN_ENDPOINTS = [
  '/user/share-link',
  '/auth/',
  '/user',
];

export const appendShareToken = (url: string, shareToken?: string | null): string => {
  if (!shareToken) return url;
  
  // Don't append share token to excluded endpoints
  const shouldExclude = EXCLUDE_SHARE_TOKEN_ENDPOINTS.some(endpoint => 
    url.includes(endpoint)
  );
  
  if (shouldExclude) {
    return url;
  }
  
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}share=${shareToken}`;
};

export const getShareTokenFromWindow = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  const pathSegments = window.location.pathname.split('/');
  
  // Check for new token-only URL format: /shared/[token]
  const sharedIndex = pathSegments.indexOf('shared');
  if (sharedIndex !== -1 && pathSegments[sharedIndex + 1]) {
    // Token is already stored in sessionStorage by useShareToken hook
    const storedToken = sessionStorage.getItem('mtgcb_share_token');
    if (storedToken) {
      return storedToken;
    }
  }
  
  // Legacy: Check query params
  const params = new URLSearchParams(window.location.search);
  const shareToken = params.get('share');
  
  if (shareToken) {
    return shareToken;
  }
  
  // Check sessionStorage for persisted share token
  const storedToken = sessionStorage.getItem('mtgcb_share_token');
  const storedUserId = sessionStorage.getItem('mtgcb_share_user');
  
  // Only return stored token if we're viewing the same user's collection
  const collectionsIndex = pathSegments.indexOf('collections');
  const currentUserId = collectionsIndex !== -1 ? pathSegments[collectionsIndex + 1] : null;
  
  if (storedToken && storedUserId === currentUserId) {
    return storedToken;
  }
  
  return null;
};

export const addShareParamToBody = <T extends Record<string, any>>(
  body: T,
  shareToken?: string | null
): T => {
  if (!shareToken) return body;
  
  return {
    ...body,
    share: shareToken,
  };
};