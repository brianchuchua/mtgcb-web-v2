/**
 * Unit tests for BuyOptionsMenu — the shared menu used by CardPrice (price-link click),
 * CardImageDisplay (detail-page image click), and CardItem (grid image click).
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { BuyOptionsMenu } from '../BuyOptionsMenu';

const renderMenu = (props: Partial<React.ComponentProps<typeof BuyOptionsMenu>> = {}) => {
  // Anchor on the body so MUI Menu has somewhere to position. Doesn't matter for tests.
  const anchorEl = document.body;
  return render(
    <BuyOptionsMenu
      anchorEl={anchorEl}
      open={true}
      onClose={() => {}}
      cardId="123"
      cardName="Lightning Bolt"
      tcgplayerId={123456}
      {...props}
    />,
  );
};

describe('BuyOptionsMenu', () => {
  describe('default item composition', () => {
    it('shows View Card Page + Buy on TCGPlayer when no CK URLs are present', () => {
      renderMenu({ cardKingdomUrl: null, cardKingdomFoilUrl: null });
      expect(screen.getByText('View Card Page')).toBeInTheDocument();
      expect(screen.getByText('Buy on TCGPlayer')).toBeInTheDocument();
      // CK fallback (name-based search) renders since cardName is provided.
      expect(screen.getByTestId('buy-on-card-kingdom-menu-item')).toBeInTheDocument();
    });

    it('hides View Card Page when hideViewCardOption is true', () => {
      renderMenu({ hideViewCardOption: true });
      expect(screen.queryByText('View Card Page')).not.toBeInTheDocument();
      expect(screen.getByText('Buy on TCGPlayer')).toBeInTheDocument();
    });
  });

  describe('Card Kingdom items', () => {
    it('renders TWO CK items ("Regular" + "Foil") when both URLs are present', () => {
      renderMenu({
        cardKingdomUrl: 'mtg/foo/bar',
        cardKingdomFoilUrl: 'mtg/foo/bar-foil',
      });
      expect(screen.getByTestId('buy-regular-on-card-kingdom-menu-item')).toBeInTheDocument();
      expect(screen.getByTestId('buy-foil-on-card-kingdom-menu-item')).toBeInTheDocument();
      expect(screen.getByText('Buy on Card Kingdom (Regular)')).toBeInTheDocument();
      expect(screen.getByText('Buy on Card Kingdom (Foil)')).toBeInTheDocument();
      // No collapsed single CK item when both are split.
      expect(screen.queryByTestId('buy-on-card-kingdom-menu-item')).not.toBeInTheDocument();
    });

    it('renders ONE CK item when only the regular URL is present', () => {
      renderMenu({ cardKingdomUrl: 'mtg/foo/bar', cardKingdomFoilUrl: null });
      expect(screen.getByTestId('buy-on-card-kingdom-menu-item')).toBeInTheDocument();
      expect(screen.queryByTestId('buy-regular-on-card-kingdom-menu-item')).not.toBeInTheDocument();
      expect(screen.queryByTestId('buy-foil-on-card-kingdom-menu-item')).not.toBeInTheDocument();
    });

    it('renders ONE CK item when only the foil URL is present (special-treatment Card row)', () => {
      renderMenu({ cardKingdomUrl: null, cardKingdomFoilUrl: 'mtg/secret-lair/foo-rainbow-foil' });
      expect(screen.getByTestId('buy-on-card-kingdom-menu-item')).toBeInTheDocument();
      expect(screen.queryByTestId('buy-regular-on-card-kingdom-menu-item')).not.toBeInTheDocument();
      expect(screen.queryByTestId('buy-foil-on-card-kingdom-menu-item')).not.toBeInTheDocument();
    });

    it('falls back to a name-based search when no CK URL is set but cardName is', () => {
      renderMenu({
        cardKingdomUrl: null,
        cardKingdomFoilUrl: null,
        cardName: 'Lightning Bolt',
      });
      expect(screen.getByTestId('buy-on-card-kingdom-menu-item')).toBeInTheDocument();
    });

    it('omits the CK item entirely when neither URL nor card name is available', () => {
      renderMenu({
        cardKingdomUrl: null,
        cardKingdomFoilUrl: null,
        cardName: undefined,
        cardId: undefined,
      });
      expect(screen.queryByTestId('buy-on-card-kingdom-menu-item')).not.toBeInTheDocument();
      expect(screen.queryByTestId('buy-regular-on-card-kingdom-menu-item')).not.toBeInTheDocument();
      expect(screen.queryByTestId('buy-foil-on-card-kingdom-menu-item')).not.toBeInTheDocument();
    });
  });

  describe('TCGPlayer split (regular vs foil)', () => {
    it('renders TWO TCG items when both tcgHasRegular and tcgHasFoil are true', () => {
      renderMenu({ tcgHasRegular: true, tcgHasFoil: true });
      expect(screen.getByTestId('buy-regular-on-tcgplayer-menu-item')).toBeInTheDocument();
      expect(screen.getByTestId('buy-foil-on-tcgplayer-menu-item')).toBeInTheDocument();
      expect(screen.getByText('Buy on TCGPlayer (Regular)')).toBeInTheDocument();
      expect(screen.getByText('Buy on TCGPlayer (Foil)')).toBeInTheDocument();
      // No collapsed single item when both are split.
      expect(screen.queryByTestId('buy-on-tcgplayer-menu-item')).not.toBeInTheDocument();
    });

    it('renders ONE TCG item when only tcgHasRegular is true', () => {
      renderMenu({ tcgHasRegular: true, tcgHasFoil: false });
      expect(screen.getByTestId('buy-on-tcgplayer-menu-item')).toBeInTheDocument();
      expect(screen.queryByTestId('buy-regular-on-tcgplayer-menu-item')).not.toBeInTheDocument();
      expect(screen.queryByTestId('buy-foil-on-tcgplayer-menu-item')).not.toBeInTheDocument();
    });

    it('renders ONE TCG item when only tcgHasFoil is true (foil-only)', () => {
      renderMenu({ tcgHasRegular: false, tcgHasFoil: true });
      expect(screen.getByTestId('buy-on-tcgplayer-menu-item')).toBeInTheDocument();
      expect(screen.queryByTestId('buy-regular-on-tcgplayer-menu-item')).not.toBeInTheDocument();
      expect(screen.queryByTestId('buy-foil-on-tcgplayer-menu-item')).not.toBeInTheDocument();
    });

    it('renders ONE plain "Buy on TCGPlayer" item when neither flag is provided (legacy callers)', () => {
      renderMenu({ tcgHasRegular: undefined, tcgHasFoil: undefined });
      expect(screen.getByTestId('buy-on-tcgplayer-menu-item')).toBeInTheDocument();
      expect(screen.getByText('Buy on TCGPlayer')).toBeInTheDocument();
    });
  });

  describe('TCGPlayer item visibility', () => {
    it('shows the TCG item when tcgplayerId is provided', () => {
      renderMenu({ tcgplayerId: 123456 });
      expect(screen.getByText('Buy on TCGPlayer')).toBeInTheDocument();
    });

    it('shows the TCG item when only cardName is provided (search fallback)', () => {
      renderMenu({ tcgplayerId: undefined, cardName: 'Lightning Bolt' });
      expect(screen.getByText('Buy on TCGPlayer')).toBeInTheDocument();
    });

    it('omits the TCG item when neither tcgplayerId nor cardName is provided', () => {
      renderMenu({ tcgplayerId: undefined, cardName: undefined, cardId: undefined });
      expect(screen.queryByText('Buy on TCGPlayer')).not.toBeInTheDocument();
    });
  });
});
