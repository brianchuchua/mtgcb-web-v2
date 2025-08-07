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
  
  const params = new URLSearchParams(window.location.search);
  const shareToken = params.get('share');
  
  if (shareToken) {
    return shareToken;
  }
  
  // Check sessionStorage for persisted share token
  const storedToken = sessionStorage.getItem('mtgcb_share_token');
  const storedUserId = sessionStorage.getItem('mtgcb_share_user');
  
  // Only return stored token if we're viewing the same user's collection
  const pathSegments = window.location.pathname.split('/');
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