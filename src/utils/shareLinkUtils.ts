import { smartEncodeToken } from '@/utils/tokenEncoder';

/**
 * Convert a relative share URL from the API to an absolute URL
 * @param relativeUrl The relative URL from the API (e.g., "/collections/123?share=token")
 * @returns The absolute URL (e.g., "https://localhost:3000/collections/123?share=token")
 */
export const getAbsoluteShareUrl = (relativeUrl: string): string => {
  if (typeof window === 'undefined') {
    // Server-side rendering - return relative URL
    return relativeUrl;
  }

  // Client-side - prepend current origin
  const origin = window.location.origin;
  return `${origin}${relativeUrl}`;
};

/**
 * The /shared/<token> link for a private collection. The API still returns the old
 * "/collections/123?share=<token>" form, so take the token from that.
 * @param apiShareUrl The share URL from the API
 * @param origin e.g. "https://www.mtgcollectionbuilder.com"
 * @param viewQuery The current page's query string, to share the current view; any share param is dropped
 */
export const buildTokenShareUrl = (apiShareUrl: string, origin: string, viewQuery = ''): string => {
  const token = apiShareUrl.split('?share=')[1];
  if (!token) return `${origin}${apiShareUrl}`;

  const query = viewQuery.replace(/[?&]share=[^&]+/g, '').replace(/^[?&]/, '');
  return `${origin}/shared/${smartEncodeToken(token)}${query ? `?${query}` : ''}`;
};
