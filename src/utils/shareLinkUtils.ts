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