/**
 * Generates a URL-friendly slug from a card name
 * @param cardName - The name of the card (pureName)
 * @returns A URL-friendly slug
 */
export function generateCardSlug(cardName: string): string {
  return cardName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generates a full card URL with slug and ID
 * @param cardName - The name of the card (pureName)
 * @param cardId - The ID of the card
 * @returns A full card URL path
 */
export function generateCardUrl(cardName: string, cardId: string): string {
  const slug = generateCardSlug(cardName);
  return `/browse/cards/${slug}/${cardId}`;
}