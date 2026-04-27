/**
 * Unit tests for CardPricesSection — the card-detail-page price block used by
 * CardBrowseClient and CollectionCardClient. Covers the section headers,
 * collapsible behavior, equal-prominence buy buttons, split regular/foil CK buttons,
 * and embedded prices on each button.
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { CardPricesSection } from '../CardPricesSection';

const FULL_TCG_PRICES = {
  normal: { market: 1.5, low: 1.0, average: 1.25, high: 2.0 },
  foil: null,
};

describe('CardPricesSection', () => {
  describe('Section headers', () => {
    it('uses "TCGPlayer Prices" as the TCG block header', () => {
      render(
        <CardPricesSection
          priceData={FULL_TCG_PRICES}
          tcgplayerId={123456}
          cardName="Lightning Bolt"
          pricesUpdatedAt="2026-04-26T00:00:00Z"
        />,
      );
      expect(screen.getByText('TCGPlayer Prices')).toBeInTheDocument();
      // Plain "Prices" header should be gone.
      expect(screen.queryByText(/^Prices$/)).not.toBeInTheDocument();
    });

    it('uses "Card Kingdom Prices" as the CK block header', () => {
      render(
        <CardPricesSection
          priceData={FULL_TCG_PRICES}
          tcgplayerId={123456}
          cardName="Lightning Bolt"
          cardKingdomRetail="2.29"
          cardKingdomUrl="mtg/strixhaven/lightning-bolt"
        />,
      );
      expect(screen.getByText('Card Kingdom Prices')).toBeInTheDocument();
    });
  });

  describe('Collapsible behavior', () => {
    it('starts with the TCGPlayer detail block collapsed', () => {
      render(
        <CardPricesSection
          priceData={FULL_TCG_PRICES}
          tcgplayerId={123456}
          cardName="Lightning Bolt"
        />,
      );
      // Header is visible; detail block is not.
      expect(screen.getByText('TCGPlayer Prices')).toBeInTheDocument();
      expect(screen.queryByTestId('tcgplayer-prices-detail')).not.toBeInTheDocument();
      // The detail labels (Market/Low/etc.) should not appear yet.
      expect(screen.queryByText('Market')).not.toBeInTheDocument();
    });

    it('starts with the Card Kingdom detail block collapsed', () => {
      render(
        <CardPricesSection
          priceData={FULL_TCG_PRICES}
          tcgplayerId={123456}
          cardName="Lightning Bolt"
          cardKingdomRetail="2.29"
          cardKingdomFoil="3.49"
          cardKingdomUrl="mtg/strixhaven/lightning-bolt"
          cardKingdomFoilUrl="mtg/strixhaven/lightning-bolt-foil"
        />,
      );
      expect(screen.getByText('Card Kingdom Prices')).toBeInTheDocument();
      expect(screen.queryByTestId('card-kingdom-prices-detail')).not.toBeInTheDocument();
      expect(screen.queryByTestId('card-kingdom-nonfoil-price')).not.toBeInTheDocument();
      expect(screen.queryByTestId('card-kingdom-foil-price')).not.toBeInTheDocument();
    });

    it('expands the TCGPlayer block when its header is clicked', () => {
      render(
        <CardPricesSection
          priceData={FULL_TCG_PRICES}
          tcgplayerId={123456}
          cardName="Lightning Bolt"
        />,
      );
      fireEvent.click(screen.getByTestId('tcgplayer-prices-header'));
      expect(screen.getByTestId('tcgplayer-prices-detail')).toBeInTheDocument();
      expect(screen.getByText('Market')).toBeInTheDocument();
      // The market price renders in the detail block.
      expect(screen.getAllByText('$1.50').length).toBeGreaterThan(0);
    });

    it('expands the Card Kingdom block when its header is clicked', () => {
      render(
        <CardPricesSection
          priceData={FULL_TCG_PRICES}
          tcgplayerId={123456}
          cardName="Lightning Bolt"
          cardKingdomRetail="2.29"
          cardKingdomFoil="3.49"
          cardKingdomUrl="mtg/strixhaven/lightning-bolt"
          cardKingdomFoilUrl="mtg/strixhaven/lightning-bolt-foil"
        />,
      );
      fireEvent.click(screen.getByTestId('card-kingdom-prices-header'));
      expect(screen.getByTestId('card-kingdom-prices-detail')).toBeInTheDocument();
      expect(screen.getByTestId('card-kingdom-nonfoil-price')).toBeInTheDocument();
      expect(screen.getByTestId('card-kingdom-foil-price')).toBeInTheDocument();
    });
  });

  describe('TCG (regression — must keep working with CK changes)', () => {
    it('renders the "Buy on TCGPlayer" button when tcgplayerId is present', () => {
      render(
        <CardPricesSection
          priceData={FULL_TCG_PRICES}
          tcgplayerId={123456}
          cardName="Lightning Bolt"
        />,
      );
      const tcgButton = screen.getByRole('link', { name: /Buy on TCGPlayer/i });
      expect(tcgButton).toBeInTheDocument();
      expect(tcgButton).toHaveAttribute('href', expect.stringContaining('tcgplayer'));
    });
  });

  describe('Card Kingdom display', () => {
    it('does NOT render the CK block when no CK prices are provided', () => {
      // Note: a "Buy on Card Kingdom" button still renders (name-based search fallback),
      // mirroring the TCG button's always-on behavior. Only the CK price block is suppressed.
      render(
        <CardPricesSection
          priceData={FULL_TCG_PRICES}
          tcgplayerId={123456}
          cardName="Lightning Bolt"
        />,
      );
      expect(screen.queryByTestId('card-kingdom-prices')).not.toBeInTheDocument();
      expect(screen.queryByText('Card Kingdom Prices')).not.toBeInTheDocument();
    });
  });

  describe('Buy on Card Kingdom buttons (split regular vs foil)', () => {
    it('renders TWO CK buttons when both regular and foil URLs are present', () => {
      render(
        <CardPricesSection
          priceData={FULL_TCG_PRICES}
          tcgplayerId={123456}
          cardName="Lightning Bolt"
          cardKingdomRetail="2.29"
          cardKingdomFoil="3.49"
          cardKingdomUrl="mtg/strixhaven/lightning-bolt"
          cardKingdomFoilUrl="mtg/strixhaven/lightning-bolt-foil"
        />,
      );
      const regularButton = screen.getByTestId('buy-regular-on-card-kingdom-button');
      const foilButton = screen.getByTestId('buy-foil-on-card-kingdom-button');
      expect(regularButton).toBeInTheDocument();
      expect(foilButton).toBeInTheDocument();
      // No collapsed single button when both are split.
      expect(screen.queryByTestId('buy-on-card-kingdom-button')).not.toBeInTheDocument();
    });

    it('renders ONE CK button when only the regular URL is present', () => {
      render(
        <CardPricesSection
          priceData={FULL_TCG_PRICES}
          tcgplayerId={123456}
          cardName="Lightning Bolt"
          cardKingdomRetail="2.29"
          cardKingdomUrl="mtg/strixhaven/lightning-bolt"
        />,
      );
      expect(screen.getByTestId('buy-on-card-kingdom-button')).toBeInTheDocument();
      expect(screen.queryByTestId('buy-regular-on-card-kingdom-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('buy-foil-on-card-kingdom-button')).not.toBeInTheDocument();
    });

    it('renders ONE CK button for special-treatment Card rows (foil-only)', () => {
      render(
        <CardPricesSection
          priceData={FULL_TCG_PRICES}
          tcgplayerId={287654}
          cardName="Heroic Intervention (Rainbow Foil)"
          cardKingdomFoil="79.99"
          cardKingdomFoilUrl="mtg/secret-lair/heroic-intervention-rainbow-foil"
        />,
      );
      const ckButton = screen.getByTestId('buy-on-card-kingdom-button');
      expect(ckButton).toBeInTheDocument();
      expect(ckButton).toHaveAttribute(
        'href',
        expect.stringContaining('mtg/secret-lair/heroic-intervention-rainbow-foil'),
      );
    });

    it('falls back to a name-based CK search when no CK URL but card name is present', () => {
      render(
        <CardPricesSection
          priceData={FULL_TCG_PRICES}
          tcgplayerId={123456}
          cardName="Lightning Bolt"
        />,
      );
      const ckButton = screen.getByTestId('buy-on-card-kingdom-button');
      expect(ckButton).toBeInTheDocument();
      expect(ckButton).toHaveAttribute(
        'href',
        expect.stringContaining('cardkingdom.com/catalog/search'),
      );
    });
  });

  describe('Prices embedded in button labels', () => {
    it('TCG button shows the market price in its label', () => {
      render(
        <CardPricesSection
          priceData={FULL_TCG_PRICES}
          tcgplayerId={123456}
          cardName="Lightning Bolt"
        />,
      );
      expect(screen.getByRole('link', { name: 'Buy on TCGPlayer ($1.50)' })).toBeInTheDocument();
    });

    it('CK Regular and CK Foil buttons each carry their own price', () => {
      render(
        <CardPricesSection
          priceData={FULL_TCG_PRICES}
          tcgplayerId={123456}
          cardName="Lightning Bolt"
          cardKingdomRetail="2.29"
          cardKingdomFoil="3.49"
          cardKingdomUrl="mtg/strixhaven/lightning-bolt"
          cardKingdomFoilUrl="mtg/strixhaven/lightning-bolt-foil"
        />,
      );
      expect(
        screen.getByRole('link', { name: 'Buy on Card Kingdom (Regular) ($2.29)' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: 'Buy on Card Kingdom (Foil) ($3.49)' }),
      ).toBeInTheDocument();
    });

    it('Single CK button (regular-only) shows price without a "(Regular)" qualifier', () => {
      render(
        <CardPricesSection
          priceData={FULL_TCG_PRICES}
          tcgplayerId={123456}
          cardName="Lightning Bolt"
          cardKingdomRetail="2.29"
          cardKingdomUrl="mtg/strixhaven/lightning-bolt"
        />,
      );
      expect(screen.getByRole('link', { name: 'Buy on Card Kingdom ($2.29)' })).toBeInTheDocument();
    });

    it('Single CK button (foil-only) keeps the "(Foil)" qualifier on the label', () => {
      render(
        <CardPricesSection
          priceData={FULL_TCG_PRICES}
          tcgplayerId={287654}
          cardName="Heroic Intervention (Rainbow Foil)"
          cardKingdomFoil="79.99"
          cardKingdomFoilUrl="mtg/secret-lair/heroic-intervention-rainbow-foil"
        />,
      );
      expect(
        screen.getByRole('link', { name: 'Buy on Card Kingdom (Foil) ($79.99)' }),
      ).toBeInTheDocument();
    });

    it('TCG button label omits the price suffix when no TCG prices are available', () => {
      render(
        <CardPricesSection
          priceData={null}
          tcgplayerId={123456}
          cardName="Lightning Bolt"
        />,
      );
      // No price dollar-amount in the label.
      expect(screen.getByRole('link', { name: 'Buy on TCGPlayer' })).toBeInTheDocument();
    });
  });

  describe('TCG buy button split (regular vs foil)', () => {
    const BOTH_FINISHES = {
      normal: { market: 1.5, low: 1.0, average: null, high: null },
      foil: { market: 5.0, low: null, average: null, high: null },
    };

    it('renders TWO TCG buttons (Regular + Foil) when both finishes have prices', () => {
      render(
        <CardPricesSection
          priceData={BOTH_FINISHES}
          tcgplayerId={123456}
          cardName="Lightning Bolt"
        />,
      );
      const regular = screen.getByTestId('buy-regular-on-tcgplayer-button');
      const foil = screen.getByTestId('buy-foil-on-tcgplayer-button');
      expect(regular).toBeInTheDocument();
      expect(foil).toBeInTheDocument();
      // Each button label includes its own finish's price.
      expect(regular).toHaveTextContent('Buy on TCGPlayer (Regular) ($1.50)');
      expect(foil).toHaveTextContent('Buy on TCGPlayer (Foil) ($5.00)');
    });

    it('regular TCG button has Printing=Normal in the href; foil has Printing=Foil', () => {
      render(
        <CardPricesSection
          priceData={BOTH_FINISHES}
          tcgplayerId={123456}
          cardName="Lightning Bolt"
        />,
      );
      const regularHref = screen.getByTestId('buy-regular-on-tcgplayer-button').getAttribute('href') ?? '';
      const foilHref = screen.getByTestId('buy-foil-on-tcgplayer-button').getAttribute('href') ?? '';
      expect(regularHref).toContain('Printing%3DNormal');
      expect(foilHref).toContain('Printing%3DFoil');
    });

    it('renders ONE TCG button when only normal finish has prices (no split)', () => {
      render(
        <CardPricesSection
          priceData={{
            normal: { market: 1.5, low: 1.0, average: null, high: null },
            foil: null,
          }}
          tcgplayerId={123456}
          cardName="Lightning Bolt"
        />,
      );
      expect(screen.queryByTestId('buy-regular-on-tcgplayer-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('buy-foil-on-tcgplayer-button')).not.toBeInTheDocument();
      // The single button's label still embeds its price.
      expect(screen.getByRole('link', { name: 'Buy on TCGPlayer ($1.50)' })).toBeInTheDocument();
    });

    it('renders ONE TCG button when only foil finish has prices (no split, label keeps "(Foil)")', () => {
      render(
        <CardPricesSection
          priceData={{
            normal: null,
            foil: { market: 79.99, low: null, average: null, high: null },
          }}
          tcgplayerId={287654}
          cardName="Heroic Intervention (Rainbow Foil)"
        />,
      );
      expect(screen.queryByTestId('buy-regular-on-tcgplayer-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('buy-foil-on-tcgplayer-button')).not.toBeInTheDocument();
      // Foil-only single button keeps the "(Foil)" qualifier so the label is unambiguous.
      const button = screen.getByRole('link', { name: 'Buy on TCGPlayer (Foil) ($79.99)' });
      expect(button).toBeInTheDocument();
      // Foil-only single button still adds Printing=Foil so TCG filters listings.
      expect(button.getAttribute('href') ?? '').toContain('Printing%3DFoil');
    });
  });

  describe('Button alignment', () => {
    it('all buy buttons share left-aligned content for visual consistency', () => {
      // The label-text alignment fix uses MUI's `justifyContent: flex-start` instead of
      // the default centered button content. Verify the rendered button carries that
      // styling so labels of varying widths still line up at the start edge.
      render(
        <CardPricesSection
          priceData={{
            normal: { market: 1.5, low: 1.0, average: null, high: null },
            foil: { market: 5.0, low: null, average: null, high: null },
          }}
          tcgplayerId={123456}
          cardName="Lightning Bolt"
          cardKingdomRetail="2.29"
          cardKingdomFoil="3.49"
          cardKingdomUrl="mtg/x/y"
          cardKingdomFoilUrl="mtg/x/y-foil"
        />,
      );
      const buttons = [
        screen.getByTestId('buy-regular-on-tcgplayer-button'),
        screen.getByTestId('buy-foil-on-tcgplayer-button'),
        screen.getByTestId('buy-regular-on-card-kingdom-button'),
        screen.getByTestId('buy-foil-on-card-kingdom-button'),
      ];
      for (const btn of buttons) {
        // Inline styles from MUI sx are applied via class names; check the computed
        // style for justify-content. JSDOM should reflect the applied sx.
        const styles = window.getComputedStyle(btn);
        expect(styles.justifyContent).toBe('flex-start');
      }
    });
  });

  describe('Equal-prominence styling', () => {
    it('TCG and CK buttons share the same MUI variant for visual parity', () => {
      render(
        <CardPricesSection
          priceData={FULL_TCG_PRICES}
          tcgplayerId={123456}
          cardName="Lightning Bolt"
          cardKingdomRetail="2.29"
          cardKingdomFoil="3.49"
          cardKingdomUrl="mtg/strixhaven/lightning-bolt"
          cardKingdomFoilUrl="mtg/strixhaven/lightning-bolt-foil"
        />,
      );
      const tcgButton = screen.getByRole('link', { name: /Buy on TCGPlayer/i });
      const ckRegular = screen.getByTestId('buy-regular-on-card-kingdom-button');
      const ckFoil = screen.getByTestId('buy-foil-on-card-kingdom-button');
      expect(tcgButton.className).toMatch(/MuiButton-contained/);
      expect(ckRegular.className).toMatch(/MuiButton-contained/);
      expect(ckFoil.className).toMatch(/MuiButton-contained/);
    });
  });
});
