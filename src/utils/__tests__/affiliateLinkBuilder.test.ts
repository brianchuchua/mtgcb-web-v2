import {
  generateCardKingdomLink,
  generateJourneysEndLink,
  generateTCGPlayerLink,
  generateTCGPlayerAffiliateLink,
  generateTCGPlayerSealedProductLink,
} from '../affiliateLinkBuilder';

describe('affiliateLinkBuilder', () => {
  describe('generateJourneysEndLink', () => {
    it('builds a direct product URL from a stored JE path with the referral code appended', () => {
      const url = generateJourneysEndLink('products/lightning-bolt-m10-nm');
      expect(url).toBe('https://journeysendgames.com/products/lightning-bolt-m10-nm?ref=mtgcb');
    });

    it('appends a subId when one is provided', () => {
      const url = generateJourneysEndLink('products/lightning-bolt-m10-nm', 'cardpage');
      expect(url).toBe(
        'https://journeysendgames.com/products/lightning-bolt-m10-nm?ref=mtgcb&subId=cardpage',
      );
    });

    it('uses & instead of ? when the stored path already has a query string', () => {
      const url = generateJourneysEndLink('pages/mtg-deck-builder?deck=abc123');
      expect(url).toBe('https://journeysendgames.com/pages/mtg-deck-builder?deck=abc123&ref=mtgcb');
    });

    it('strips a leading slash if one ever ends up in the DB', () => {
      const url = generateJourneysEndLink('/products/foo-nm');
      expect(url).toBe('https://journeysendgames.com/products/foo-nm?ref=mtgcb');
      expect(url).not.toContain('com//products');
    });

    it('falls back to a JE storefront search when no path is given but a card name is', () => {
      const url = generateJourneysEndLink(null, 'cardpage', 'Fireball');
      expect(url).toBe(
        'https://journeysendgames.com/a/search?type=product&q=Fireball&ref=mtgcb&subId=cardpage',
      );
    });

    it('URL-encodes card names in the search fallback', () => {
      const url = generateJourneysEndLink(null, undefined, "Aladdin's Lamp");
      expect(url).toBe(
        "https://journeysendgames.com/a/search?type=product&q=Aladdin's%20Lamp&ref=mtgcb",
      );
    });

    it('prefers the stored product path over the name-search fallback', () => {
      const url = generateJourneysEndLink('products/fireball-m25-nm', 'cardpage', 'Fireball');
      expect(url).toBe(
        'https://journeysendgames.com/products/fireball-m25-nm?ref=mtgcb&subId=cardpage',
      );
    });

    it('links to the storefront homepage with the ref code when neither path nor name is given', () => {
      expect(generateJourneysEndLink()).toBe('https://journeysendgames.com/?ref=mtgcb');
      expect(generateJourneysEndLink(null)).toBe('https://journeysendgames.com/?ref=mtgcb');
    });

    it('URL-encodes the subId', () => {
      const url = generateJourneysEndLink('products/foo-nm', 'set page');
      expect(url).toContain('subId=set%20page');
    });

    it('always carries the referral code regardless of call shape', () => {
      const calls = [
        generateJourneysEndLink('products/foo-nm'),
        generateJourneysEndLink('products/foo-nm', 'buymenu'),
        generateJourneysEndLink(),
      ];
      for (const url of calls) {
        expect(url).toContain('ref=mtgcb');
      }
    });
  });

  describe('generateCardKingdomLink', () => {
    const AFFILIATE_QUERY =
      '?partner=MTGCB&utm_source=MTGCB&utm_medium=affiliate&utm_campaign=MTGCB';

    it('builds a direct product URL from a stored CK path', () => {
      const url = generateCardKingdomLink('mtg/4th-edition/abomination', 'Abomination');
      expect(url).toBe(
        `https://www.cardkingdom.com/mtg/4th-edition/abomination${AFFILIATE_QUERY}`,
      );
    });

    it('uses the foil URL when caller passes the foil path', () => {
      const url = generateCardKingdomLink(
        'mtg/4th-edition/abomination-foil',
        'Abomination',
      );
      expect(url).toContain('/mtg/4th-edition/abomination-foil');
      expect(url).toContain(AFFILIATE_QUERY);
    });

    it('strips a leading slash if one ever ends up in the DB', () => {
      const url = generateCardKingdomLink('/mtg/4th-edition/abomination');
      expect(url).toBe(
        `https://www.cardkingdom.com/mtg/4th-edition/abomination${AFFILIATE_QUERY}`,
      );
      // No double slash before the path.
      expect(url).not.toContain('com//mtg');
    });

    it('falls back to a CK catalog search when no path is given but a card name is', () => {
      const url = generateCardKingdomLink(null, 'Lightning Bolt');
      expect(url).toContain('https://www.cardkingdom.com/catalog/search');
      expect(url).toContain(AFFILIATE_QUERY);
      expect(url).toContain('search=header');
      // encodeURIComponent leaves brackets literal — that's the URL CK actually parses.
      expect(url).toContain('filter[name]=Lightning%20Bolt');
    });

    it('URL-encodes spaces in card names', () => {
      const url = generateCardKingdomLink(null, 'Aether Vial');
      expect(url).toContain('Aether%20Vial');
    });

    it('preserves apostrophes in card names (encodeURIComponent leaves them literal)', () => {
      const url = generateCardKingdomLink(null, "Aladdin's Lamp");
      expect(url).toContain("Aladdin's%20Lamp");
    });

    it('returns the bare CK home URL when neither path nor name is provided', () => {
      const url = generateCardKingdomLink();
      expect(url).toBe(`https://www.cardkingdom.com/${AFFILIATE_QUERY}`);
    });

    it('treats explicit nulls the same as undefined for both arguments', () => {
      const url = generateCardKingdomLink(null, undefined);
      expect(url).toBe(`https://www.cardkingdom.com/${AFFILIATE_QUERY}`);
    });

    it('always preserves the affiliate query string regardless of call shape', () => {
      const calls = [
        generateCardKingdomLink('mtg/foo/bar'),
        generateCardKingdomLink(null, 'Some Card'),
        generateCardKingdomLink(),
        generateCardKingdomLink('mtg/foo/bar', 'Some Card'),
      ];
      for (const url of calls) {
        expect(url).toContain('partner=MTGCB');
        expect(url).toContain('utm_source=MTGCB');
        expect(url).toContain('utm_medium=affiliate');
        expect(url).toContain('utm_campaign=MTGCB');
      }
    });
  });

  describe('generateTCGPlayerLink (regression — should still work alongside CK)', () => {
    it('still builds a direct product URL when given a tcgplayerId', () => {
      const url = generateTCGPlayerLink(123456, 'Lightning Bolt');
      expect(url).toContain('tcgplayer.com%2Fproduct%2F123456');
    });

    it('still falls back to a name-based search when no id is given', () => {
      const url = generateTCGPlayerLink(null, 'Lightning Bolt');
      expect(url).toContain('search%2Fmagic%2Fproduct');
    });
  });

  describe('integration — TCG and CK builders produce different host URLs', () => {
    it('TCG goes to tcgplayer.pxf.io and CK goes to cardkingdom.com', () => {
      const tcg = generateTCGPlayerLink(123456, 'Lightning Bolt');
      const ck = generateCardKingdomLink('mtg/lea/lightning-bolt');
      expect(tcg).toContain('tcgplayer.pxf.io');
      expect(ck).toContain('cardkingdom.com');
      expect(tcg).not.toContain('cardkingdom.com');
      expect(ck).not.toContain('tcgplayer');
    });
  });
});
