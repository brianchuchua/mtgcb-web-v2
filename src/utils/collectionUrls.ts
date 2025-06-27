/**
 * Utility functions for generating collection URLs
 */

/**
 * Generates a URL for a collection set page
 * @param userId - The user ID
 * @param setSlug - The set slug
 * @param goalId - Optional goal ID to include as a query parameter
 * @returns The generated URL string
 */
export function getCollectionSetUrl(userId: string | number, setSlug: string, goalId?: string | number | null): string {
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
  const baseUrl = `/collections/${userId}`;
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