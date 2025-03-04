/**
 * Generates a TCGPlayer affiliate link for a card
 * 
 * @param cardId - The TCGPlayer ID of the card
 * @param cardName - The name of the card (used as a fallback if no ID is provided)
 * @returns The affiliate link to TCGPlayer
 */
export const generateTCGPlayerLink = (cardId?: string | number | null, cardName?: string): string => {
  // If we have a TCGPlayer ID, link directly to the product
  if (cardId) {
    const targetUrl = `https://www.tcgplayer.com/product/${cardId}`;
    const affiliateLink = `https://tcgplayer.pxf.io/c/4944197/1830156/21018?u=${encodeURIComponent(targetUrl)}`;
    return affiliateLink;
  }
  
  // Otherwise, do a search for the card name
  if (cardName) {
    const targetUrl = `https://www.tcgplayer.com/search/magic/product?productLineName=magic&q=${encodeURIComponent(cardName)}`;
    const affiliateLink = `https://tcgplayer.pxf.io/c/4944197/1830156/21018?u=${encodeURIComponent(targetUrl)}`;
    return affiliateLink;
  }
  
  // If neither is provided, just link to TCGPlayer Magic homepage
  return `https://tcgplayer.pxf.io/c/4944197/1830156/21018?u=${encodeURIComponent('https://www.tcgplayer.com/magic')}`;
};