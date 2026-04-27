'use client';

import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';
import { useRouter } from 'next/navigation';
import React from 'react';
import { useBrowseUrlContext } from '@/features/browse/BrowseSearchForm/hooks/useBrowseUrlContext';
import { generateCardSlug } from '@/utils/cards/generateCardSlug';
import { getCollectionCardUrl } from '@/utils/collectionUrls';
import { generateCardKingdomLink, generateTCGPlayerLink } from '@/utils/affiliateLinkBuilder';

/**
 * Shared buy-options menu — used by CardPrice (price-link click), CardImageDisplay
 * (image click on detail page), and CardItem (image click in grid contexts).
 *
 * Items rendered, in order:
 *  1. View Card Page — shown unless `hideViewCardOption` is true.
 *  2. TCGPlayer item(s) — split into "Buy on TCGPlayer (Regular)" + "Buy on TCGPlayer (Foil)"
 *     when both `tcgHasRegular` and `tcgHasFoil` are true; collapsed to a single
 *     "Buy on TCGPlayer" item otherwise.
 *  3. Card Kingdom item(s) — split into "Buy on Card Kingdom (Regular)" + "Buy on Card
 *     Kingdom (Foil)" when both URLs are populated; collapsed to a single
 *     "Buy on Card Kingdom" item otherwise; falls back to a CK catalog name search when no
 *     URLs but a cardName is available.
 */

export interface BuyOptionsMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  cardId?: string;
  cardName?: string;
  tcgplayerId?: number | string;
  /**
   * When both flags are true and a tcgplayerId is set, the menu renders two TCG items
   * ("Regular" + "Foil") with explicit `Printing=Normal` / `Printing=Foil` filters on the
   * URL. When only one is true, a single TCG item is shown filtered to that finish.
   * When neither is provided (the default), a single "Buy on TCGPlayer" item with no
   * printing filter is shown — preserving legacy behavior for callers that don't yet
   * know the per-finish price availability.
   */
  tcgHasRegular?: boolean;
  tcgHasFoil?: boolean;
  cardKingdomUrl?: string | null;
  cardKingdomFoilUrl?: string | null;
  /** Hides the "View Card Page" item — used on the card detail page. */
  hideViewCardOption?: boolean;
}

export const BuyOptionsMenu: React.FC<BuyOptionsMenuProps> = ({
  anchorEl,
  open,
  onClose,
  cardId,
  cardName,
  tcgplayerId,
  tcgHasRegular,
  tcgHasFoil,
  cardKingdomUrl = null,
  cardKingdomFoilUrl = null,
  hideViewCardOption = false,
}) => {
  const router = useRouter();
  const { isCollectionPage, userId } = useBrowseUrlContext();

  // TCG split: two items only when the caller explicitly tells us both finishes have
  // prices (preserves the legacy single-item behavior for callers that haven't been
  // updated yet — those should see a "Buy on TCGPlayer" with no printing filter).
  const tcgSplit = tcgHasRegular === true && tcgHasFoil === true;
  const tcgFoilOnly = tcgHasFoil === true && tcgHasRegular === false;
  const tcgRegularOnly = tcgHasRegular === true && tcgHasFoil === false;
  const showTcgItem = Boolean(tcgplayerId || cardName);

  const hasCkRegular = Boolean(cardKingdomUrl);
  const hasCkFoil = Boolean(cardKingdomFoilUrl);
  const hasCkUrl = hasCkRegular || hasCkFoil;

  const handleViewCard = () => {
    onClose();
    if (!cardId || !cardName) return;
    const cardSlug = generateCardSlug(cardName);
    const cardUrl =
      isCollectionPage && userId
        ? getCollectionCardUrl(userId, cardSlug, cardId)
        : `/browse/cards/${cardSlug}/${cardId}`;
    router.push(cardUrl);
  };

  const openInNewTab = (url: string) => {
    onClose();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleBuyOnTCGPlayer = () =>
    openInNewTab(generateTCGPlayerLink(tcgplayerId, cardName || ''));
  const handleBuyRegularOnTCG = () =>
    openInNewTab(generateTCGPlayerLink(tcgplayerId, cardName || '', 'normal'));
  const handleBuyFoilOnTCG = () =>
    openInNewTab(generateTCGPlayerLink(tcgplayerId, cardName || '', 'foil'));
  const handleBuyRegularOnCK = () =>
    openInNewTab(generateCardKingdomLink(cardKingdomUrl ?? null, cardName || ''));
  const handleBuyFoilOnCK = () =>
    openInNewTab(generateCardKingdomLink(cardKingdomFoilUrl ?? null, cardName || ''));
  const handleBuyOnCKFallback = () =>
    openInNewTab(generateCardKingdomLink(null, cardName || ''));

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
    >
      {!hideViewCardOption && cardId && cardName && (
        <MenuItem onClick={handleViewCard}>
          <ListItemIcon>
            <OpenInNewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Card Page</ListItemText>
        </MenuItem>
      )}
      {showTcgItem && tcgSplit && (
        <MenuItem
          onClick={handleBuyRegularOnTCG}
          data-testid="buy-regular-on-tcgplayer-menu-item"
        >
          <ListItemIcon>
            <ShoppingCartIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Buy on TCGPlayer (Regular)</ListItemText>
        </MenuItem>
      )}
      {showTcgItem && tcgSplit && (
        <MenuItem onClick={handleBuyFoilOnTCG} data-testid="buy-foil-on-tcgplayer-menu-item">
          <ListItemIcon>
            <ShoppingCartIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Buy on TCGPlayer (Foil)</ListItemText>
        </MenuItem>
      )}
      {showTcgItem && !tcgSplit && tcgRegularOnly && (
        <MenuItem onClick={handleBuyRegularOnTCG} data-testid="buy-on-tcgplayer-menu-item">
          <ListItemIcon>
            <ShoppingCartIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Buy on TCGPlayer</ListItemText>
        </MenuItem>
      )}
      {showTcgItem && !tcgSplit && tcgFoilOnly && (
        <MenuItem onClick={handleBuyFoilOnTCG} data-testid="buy-on-tcgplayer-menu-item">
          <ListItemIcon>
            <ShoppingCartIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Buy on TCGPlayer</ListItemText>
        </MenuItem>
      )}
      {showTcgItem && !tcgSplit && !tcgRegularOnly && !tcgFoilOnly && (
        <MenuItem onClick={handleBuyOnTCGPlayer} data-testid="buy-on-tcgplayer-menu-item">
          <ListItemIcon>
            <ShoppingCartIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Buy on TCGPlayer</ListItemText>
        </MenuItem>
      )}
      {hasCkRegular && hasCkFoil && (
        <MenuItem
          onClick={handleBuyRegularOnCK}
          data-testid="buy-regular-on-card-kingdom-menu-item"
        >
          <ListItemIcon>
            <ShoppingCartIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Buy on Card Kingdom (Regular)</ListItemText>
        </MenuItem>
      )}
      {hasCkRegular && hasCkFoil && (
        <MenuItem
          onClick={handleBuyFoilOnCK}
          data-testid="buy-foil-on-card-kingdom-menu-item"
        >
          <ListItemIcon>
            <ShoppingCartIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Buy on Card Kingdom (Foil)</ListItemText>
        </MenuItem>
      )}
      {hasCkRegular && !hasCkFoil && (
        <MenuItem onClick={handleBuyRegularOnCK} data-testid="buy-on-card-kingdom-menu-item">
          <ListItemIcon>
            <ShoppingCartIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Buy on Card Kingdom</ListItemText>
        </MenuItem>
      )}
      {!hasCkRegular && hasCkFoil && (
        <MenuItem onClick={handleBuyFoilOnCK} data-testid="buy-on-card-kingdom-menu-item">
          <ListItemIcon>
            <ShoppingCartIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Buy on Card Kingdom</ListItemText>
        </MenuItem>
      )}
      {!hasCkUrl && cardName && (
        <MenuItem onClick={handleBuyOnCKFallback} data-testid="buy-on-card-kingdom-menu-item">
          <ListItemIcon>
            <ShoppingCartIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Buy on Card Kingdom</ListItemText>
        </MenuItem>
      )}
    </Menu>
  );
};
