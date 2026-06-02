/**
 * Generates the URL for a card image with cache busting
 *
 * @param id - The unique identifier of the card
 * @returns The URL to the card image
 */
export const getCardImageUrl = (id: string): string => {
  return `https://r2.mtgcollectionbuilder.com/cards/images/normal/${id}.jpg?v=${process.env.NEXT_PUBLIC_IMAGE_CACHE_DATE || '20241220'}`;
};

/**
 * Back-face image URL for a card whose Card.backScryfallId is populated. R2 stores the
 * back at `{cardId}b.jpg` alongside the front `{cardId}.jpg` — same cache-busting param.
 * Callers should only build this URL when the card actually has a back image (otherwise
 * the request 404s, which is fine but pointless).
 */
export const getCardBackImageUrl = (id: string): string => {
  return `https://r2.mtgcollectionbuilder.com/cards/images/normal/${id}b.jpg?v=${process.env.NEXT_PUBLIC_IMAGE_CACHE_DATE || '20241220'}`;
};
