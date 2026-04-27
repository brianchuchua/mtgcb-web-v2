import {
  generateCardKingdomLink,
  generateTCGPlayerLink,
  generateTCGPlayerAffiliateLink,
  generateTCGPlayerSealedProductLink,
} from '../affiliateLinkBuilder';

describe('affiliateLinkBuilder', () => {
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
