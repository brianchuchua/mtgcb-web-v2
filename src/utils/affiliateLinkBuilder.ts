/**
 * Card Kingdom affiliate URL parameters. Hardcoded per
 * docs/future-features/CARD_KINGDOM_INTEGRATION_PLAN.md §9 — mirrors how the
 * TCGPlayer affiliate code is hardcoded throughout this file.
 */
const CK_AFFILIATE_PARAMS =
  '?partner=MTGCB&utm_source=MTGCB&utm_medium=affiliate&utm_campaign=MTGCB';

const CK_BASE_URL = 'https://www.cardkingdom.com';

/**
 * Generates a Card Kingdom affiliate link.
 *
 * @param ckUrl - The CK product path stored in Card.cardKingdomUrl /
 *   cardKingdomFoilUrl, e.g. "mtg/4th-edition/abomination". The caller picks
 *   nonfoil or foil based on display context.
 * @param cardName - Fallback for cards without a known CK product path.
 * @returns A full URL with affiliate tracking appended.
 */
export const generateCardKingdomLink = (
  ckUrl?: string | null,
  cardName?: string,
): string => {
  if (ckUrl) {
    // Defensive: strip a leading slash if one ever ends up in the DB.
    const path = ckUrl.startsWith('/') ? ckUrl.slice(1) : ckUrl;
    return `${CK_BASE_URL}/${path}${CK_AFFILIATE_PARAMS}`;
  }
  if (cardName) {
    const q = encodeURIComponent(cardName);
    // CK's catalog search format. Affiliate params still go on as the leading
    // query-string segment, then the search filter is appended.
    return `${CK_BASE_URL}/catalog/search${CK_AFFILIATE_PARAMS}&search=header&filter[name]=${q}`;
  }
  return `${CK_BASE_URL}/${CK_AFFILIATE_PARAMS}`;
};

export type TcgPrinting = 'foil' | 'normal';

/**
 * Generates a TCGPlayer affiliate link for a card.
 *
 * @param tcgplayerId - The TCGPlayer ID of the card
 * @param cardName - Card name (fallback when no ID is provided)
 * @param printing - Printing filter:
 *   - `'foil'` (or legacy `true`): adds `?Printing=Foil` so TCG only shows foil listings
 *   - `'normal'`: adds `?Printing=Normal` so TCG only shows nonfoil listings
 *   - `undefined` (or legacy `false`): no filter — TCG shows all printings (mixed)
 * @returns The affiliate link to TCGPlayer
 */
export const generateTCGPlayerLink = (
  tcgplayerId?: string | number | null,
  cardName?: string,
  printing?: TcgPrinting | boolean,
): string => {
  // Backwards-compat: legacy callers pass `true`/`false` for the old `isFoil` boolean.
  const printingFilter =
    printing === 'foil' || printing === true
      ? 'Printing=Foil'
      : printing === 'normal'
        ? 'Printing=Normal'
        : '';

  // If we have a TCGPlayer ID, link directly to the product
  if (tcgplayerId) {
    const targetUrl = printingFilter
      ? `https://www.tcgplayer.com/product/${tcgplayerId}?${printingFilter}`
      : `https://www.tcgplayer.com/product/${tcgplayerId}`;
    const affiliateLink = `https://tcgplayer.pxf.io/c/4944197/1830156/21018?u=${encodeURIComponent(targetUrl)}`;
    return affiliateLink;
  }

  // Otherwise, do a search for the card name
  if (cardName) {
    const targetUrl = `https://www.tcgplayer.com/search/magic/product?productLineName=magic&q=${encodeURIComponent(cardName)}${printingFilter ? `&${printingFilter}` : ''}`;
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
