/**
 * Generates the URL for a card image with cache busting
 *
 * @param id - The unique identifier of the card
 * @returns The URL to the card image
 */
export const getCardImageUrl = (id: string): string => {
  return `https://r2.mtgcollectionbuilder.com/cards/images/normal/${id}.jpg?v=${process.env.NEXT_PUBLIC_IMAGE_CACHE_DATE || '20241220'}`;
};
