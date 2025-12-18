/**
 * Generates a TCGPlayer affiliate link for a card
 *
 * @param tcgplayerId - The TCGPlayer ID of the card
 * @param cardName - The name of the card (used as a fallback if no ID is provided)
 * @param isFoil - Whether to filter for foil printings
 * @returns The affiliate link to TCGPlayer
 */
export const generateTCGPlayerLink = (tcgplayerId?: string | number | null, cardName?: string, isFoil?: boolean): string => {
  const foilParam = isFoil ? 'Printing=Foil' : '';

  // If we have a TCGPlayer ID, link directly to the product
  if (tcgplayerId) {
    const targetUrl = foilParam
      ? `https://www.tcgplayer.com/product/${tcgplayerId}?${foilParam}`
      : `https://www.tcgplayer.com/product/${tcgplayerId}`;
    const affiliateLink = `https://tcgplayer.pxf.io/c/4944197/1830156/21018?u=${encodeURIComponent(targetUrl)}`;
    return affiliateLink;
  }

  // Otherwise, do a search for the card name
  if (cardName) {
    const targetUrl = `https://www.tcgplayer.com/search/magic/product?productLineName=magic&q=${encodeURIComponent(cardName)}${foilParam ? `&${foilParam}` : ''}`;
    const affiliateLink = `https://tcgplayer.pxf.io/c/4944197/1830156/21018?u=${encodeURIComponent(targetUrl)}`;
    return affiliateLink;
  }

  // If neither is provided, just link to TCGPlayer Magic homepage
  return `https://tcgplayer.pxf.io/c/4944197/1830156/21018?u=${encodeURIComponent('https://www.tcgplayer.com/magic')}`;
};

/**
 * Generates a TCGPlayer affiliate link for a direct TCGPlayer URL
 * 
 * @param url - Direct TCGPlayer URL to wrap with affiliate parameters
 * @returns The affiliate link to TCGPlayer
 */
export const generateTCGPlayerAffiliateLink = (url: string): string => {
  if (!url) {
    return `https://tcgplayer.pxf.io/c/4944197/1830156/21018?u=${encodeURIComponent('https://www.tcgplayer.com/magic')}`;
  }
  
  return `https://tcgplayer.pxf.io/c/4944197/1830156/21018?u=${encodeURIComponent(url)}`;
};

/**
 * Generates a TCGPlayer affiliate link for a sealed product
 * 
 * @param sealedProductUrl - The TCGPlayer URL for the sealed product
 * @param setName - The name of the set (used as a fallback if no URL is provided)
 * @returns The affiliate link to TCGPlayer
 */
export const generateTCGPlayerSealedProductLink = (sealedProductUrl?: string | null, setName?: string): string => {
  // If we have a direct URL, use it with the affiliate wrapper
  if (sealedProductUrl) {
    return generateTCGPlayerAffiliateLink(sealedProductUrl);
  }

  // Otherwise, do a search for the set name with "sealed" as a qualifier
  if (setName) {
    const searchQuery = `${setName} sealed`;
    const targetUrl = `https://www.tcgplayer.com/search/magic/product?productLineName=magic&q=${encodeURIComponent(searchQuery)}`;
    return generateTCGPlayerAffiliateLink(targetUrl);
  }

  // If neither is provided, just link to TCGPlayer sealed products page
  return generateTCGPlayerAffiliateLink('https://www.tcgplayer.com/search/magic/product?productLineName=magic&productTypeName=Sealed%20Products');
};
