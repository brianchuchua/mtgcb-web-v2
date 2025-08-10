/**
 * Utility functions for generating collection URLs
 */

import { smartEncodeToken } from '@/utils/tokenEncoder';

// Track if we're in token-only mode (will be set by ShareModeContext)
let isTokenOnlyMode = false;
let shareToken: string | null = null;

export function setShareModeConfig(tokenOnly: boolean, token: string | null) {
  isTokenOnlyMode = tokenOnly;
  shareToken = token;
}

/**
 * Generates a URL for a collection set page
 * @param userId - The user ID
 * @param setSlug - The set slug
 * @param goalId - Optional goal ID to include as a query parameter
 * @returns The generated URL string
 */
export function getCollectionSetUrl(userId: string | number, setSlug: string, goalId?: string | number | null): string {
  // If we're in token-only mode, use the token-based URL
  if (isTokenOnlyMode && shareToken) {
    const encodedToken = smartEncodeToken(shareToken);
    const baseUrl = `/shared/${encodedToken}/${setSlug}`;
    
    if (goalId) {
      return `${baseUrl}?goalId=${goalId}`;
    }
    
    return baseUrl;
  }
  
  // Otherwise use the standard URL
  const baseUrl = `/collections/${userId}/${setSlug}`;
  
  if (goalId) {
    return `${baseUrl}?goalId=${goalId}`;
  }
  
  return baseUrl;
}

interface CollectionUrlParams {
  userId: number;
  contentType?: 'cards' | 'sets';
  goalId?: number | null;
}

/**
 * Generates a URL for a collection page
 * @param params - The parameters for generating the URL
 * @returns The generated URL string
 */
export function getCollectionUrl({ userId, contentType, goalId }: CollectionUrlParams): string {
  // If we're in token-only mode, use the token-based URL
  const baseUrl = isTokenOnlyMode && shareToken 
    ? `/shared/${smartEncodeToken(shareToken)}`
    : `/collections/${userId}`;
    
  const params = new URLSearchParams();
  
  if (contentType) {
    params.append('contentType', contentType);
  }
  
  if (goalId) {
    params.append('goalId', goalId.toString());
  }
  
  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Generates a URL for a collection card page
 * @param userId - The user ID
 * @param cardSlug - The card slug
 * @param cardId - The card ID
 * @returns The generated URL string
 */
export function getCollectionCardUrl(userId: string | number, cardSlug: string, cardId: string | number): string {
  // If we're in token-only mode, use the token-based URL
  if (isTokenOnlyMode && shareToken) {
    const encodedToken = smartEncodeToken(shareToken);
    return `/shared/${encodedToken}/cards/${cardSlug}/${cardId}`;
  }
  
  // Otherwise use the standard URL
  return `/collections/${userId}/cards/${cardSlug}/${cardId}`;
}