'use client';

import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {
  Box,
  IconButton,
  Popover,
  Skeleton,
  Typography,
} from '@mui/material';
import React, { MouseEvent, useState } from 'react';
import { PriceType } from '@/types/pricing';
import { generateTCGPlayerLink } from '@/utils/affiliateLinkBuilder';
import { pickFoilDisplayPrice, pickNormalDisplayPrice } from '@/utils/pricing/displayPrice';
import { BuyOptionsMenu } from './BuyOptionsMenu';

interface CardPriceProps {
  prices: {
    normal?: {
      market?: number | null;
      low?: number | null;
      average?: number | null;
      high?: number | null;
    } | null;
    foil?: {
      market?: number | null;
      low?: number | null;
      average?: number | null;
      high?: number | null;
    } | null;
  } | null;
  isFoil?: boolean;
  isLoading?: boolean;
  priceType?: PriceType; // Main display price type
  centered?: boolean; // Whether to center the price text or not (default: true)
  cardId?: string; // Card ID for navigation
  cardName?: string; // Card name for TCGPlayer search
  tcgplayerId?: number | string; // TCGPlayer product ID for direct link
  directToTCGPlayer?: boolean; // If true, clicking price goes directly to TCGPlayer (no menu)
  showInlineFoil?: boolean; // Whether to show foil price inline with regular price (default: true)
  hideFoilSuffix?: boolean; // Whether to hide the "foil" suffix when displaying foil prices (default: false)
  // Card Kingdom buy-link inputs. When at least one URL is present, the buy menu adds
  // CK item(s) alongside the existing TCGPlayer item — two items ("Buy Regular" + "Buy Foil")
  // when both URLs exist, one item otherwise. Falls back to a name-based CK search when
  // neither URL is set but cardName is.
  cardKingdomUrl?: string | null;
  cardKingdomFoilUrl?: string | null;
  // Journey's End buy-link inputs — same split/collapse behavior as Card Kingdom, falling
  // back to a JE storefront name search when neither URL is set but cardName is.
  journeysEndUrl?: string | null;
  journeysEndFoilUrl?: string | null;
  // Hides the "View Card Page" menu item — used on detail pages where the user is
  // already on the card page and that option would be a no-op.
  hideViewCardOption?: boolean;
}

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};

const CardPrice: React.FC<CardPriceProps> = ({
  prices,
  isFoil = false,
  isLoading = false,
  priceType = PriceType.Market,
  centered = true,
  cardId,
  cardName,
  tcgplayerId,
  directToTCGPlayer = false,
  showInlineFoil = true,
  hideFoilSuffix = false,
  cardKingdomUrl = null,
  cardKingdomFoilUrl = null,
  journeysEndUrl = null,
  journeysEndFoilUrl = null,
  hideViewCardOption = false,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);

  const handleInfoClick = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    event.preventDefault();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handlePriceClick = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    event.preventDefault();

    if (directToTCGPlayer) {
      const tcgPlayerUrl = generateTCGPlayerLink(tcgplayerId, cardName || '', isFoil);
      window.open(tcgPlayerUrl, '_blank', 'noopener,noreferrer');
    } else {
      setMenuAnchorEl(event.currentTarget);
    }
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  // Per-finish TCG availability — drives the split "Buy on TCGPlayer (Regular) / (Foil)"
  // items in the buy menu. Each side is "available" when at least one of its tier prices
  // (market/low/average/high) is non-null.
  const hasNormalTcgPrice = Boolean(
    prices?.normal &&
      (prices.normal.market != null ||
        prices.normal.low != null ||
        prices.normal.average != null ||
        prices.normal.high != null),
  );
  const hasFoilTcgPrice = Boolean(
    prices?.foil &&
      (prices.foil.market != null ||
        prices.foil.low != null ||
        prices.foil.average != null ||
        prices.foil.high != null),
  );

  const open = Boolean(anchorEl);
  const menuOpen = Boolean(menuAnchorEl);
  if (isLoading) {
    return <Skeleton width={60} />;
  }

  if (!prices) {
    return (
      <Typography
        variant="subtitle1"
        fontWeight="medium"
        textAlign={centered ? 'center' : 'inherit'}
        sx={{
          fontSize: '1rem',
          '@container card (max-width: 250px)': {
            fontSize: '0.9375rem',
          },
          '@container card (max-width: 200px)': {
            fontSize: '0.875rem',
          },
        }}
      >
        N/A
      </Typography>
    );
  }

  const normalPriceData = prices.normal;
  const foilPriceData = prices.foil;

  if (!normalPriceData && !foilPriceData) {
    return (
      <Typography
        variant="subtitle1"
        fontWeight="medium"
        textAlign={centered ? 'center' : 'inherit'}
        sx={{
          fontSize: '1rem',
          '@container card (max-width: 250px)': {
            fontSize: '0.9375rem',
          },
          '@container card (max-width: 200px)': {
            fontSize: '0.875rem',
          },
        }}
      >
        N/A
      </Typography>
    );
  }

  // Helper function to check if any price in the priceData is non-null
  const hasAnyValidPrice = (priceData: any): boolean => {
    if (!priceData) return false;
    return (
      (priceData.market !== null && priceData.market !== undefined) ||
      (priceData.low !== null && priceData.low !== undefined) ||
      (priceData.average !== null && priceData.average !== undefined) ||
      (priceData.high !== null && priceData.high !== undefined)
    );
  };

  // Check if normal prices exist but are all null (or the object doesn't exist)
  const hasAnyNormalPrice = hasAnyValidPrice(normalPriceData);

  // Check if this is a foil-only card (no normal prices, but has foil price)
  const isFoilOnlyCard = !hasAnyNormalPrice && hasAnyValidPrice(foilPriceData);

  const normalPriceWithType = pickNormalDisplayPrice(normalPriceData, priceType);
  const foilPrice = pickFoilDisplayPrice(foilPriceData);

  // Get the display label for the price type
  const getPriceTypeLabel = (type: PriceType): string => {
    switch (type) {
      case PriceType.Market:
        return 'Market';
      case PriceType.Low:
        return 'Low';
      case PriceType.Average:
        return 'Average';
      case PriceType.High:
        return 'High';
      default:
        return 'Market';
    }
  };

  // Get the requested price type label (what the user wanted)
  const requestedPriceTypeLabel = getPriceTypeLabel(priceType);

  // Set up alignment styles based on the centered prop
  const containerStyle = centered ? { textAlign: 'center' as const } : {};
  const flexContainerStyle = centered
    ? { display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }
    : { display: 'inline-flex', alignItems: 'center' };

  // Create popover content for fallback prices
  const renderPopoverContent = () => {
    const content = [];

    if (normalPriceWithType?.isFallback) {
      content.push(
        `${requestedPriceTypeLabel} price is not available. Showing ${getPriceTypeLabel(normalPriceWithType.type).toLowerCase()} price instead.`,
      );
    } else if (!normalPriceWithType && foilPrice && !isFoilOnlyCard) {
      content.push(
        `No ${requestedPriceTypeLabel.toLowerCase()} price is available for the regular version. Showing foil price instead.`,
      );
    }

    return (
      <Box sx={{ p: 2, maxWidth: 300, position: 'relative' }}>
        <IconButton size="small" onClick={handleClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5, pr: 3 }}>
          Price Information
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {content.join(' ')}
        </Typography>
      </Box>
    );
  };

  // If specifically asking for foil, just use foil price
  if (isFoil && foilPrice !== null) {
    return (
      <>
        <Box sx={containerStyle}>
          <Typography
            variant="subtitle1"
            fontWeight="medium"
            onClick={handlePriceClick}
            sx={{
              fontSize: '1rem',
              cursor: 'pointer',
              color: 'primary.main',
              '&:hover': {
                textDecoration: 'underline',
              },
              '@container card (max-width: 250px)': {
                fontSize: '0.9375rem',
              },
              '@container card (max-width: 200px)': {
                fontSize: '0.875rem',
              },
            }}
          >
            {formatPrice(foilPrice)}{!hideFoilSuffix && ' foil'}
          </Typography>
        </Box>
        <BuyOptionsMenu
          anchorEl={menuAnchorEl}
          open={menuOpen}
          onClose={handleMenuClose}
          cardId={cardId}
          cardName={cardName}
          tcgplayerId={tcgplayerId}
          tcgHasRegular={hasNormalTcgPrice}
          tcgHasFoil={hasFoilTcgPrice}
          cardKingdomUrl={cardKingdomUrl}
          cardKingdomFoilUrl={cardKingdomFoilUrl}
          journeysEndUrl={journeysEndUrl}
          journeysEndFoilUrl={journeysEndFoilUrl}
          hideViewCardOption={hideViewCardOption}
        />
      </>
    );
  }

  // Handle display cases with fallback mechanism
  // Both prices available
  if (normalPriceWithType && foilPrice !== null && showInlineFoil) {
    const { price: normalPrice, type: actualPriceType, isFallback } = normalPriceWithType;

    return (
      <>
        <Box sx={containerStyle}>
          <Box sx={flexContainerStyle}>
            <Typography
              variant="subtitle1"
              fontWeight="medium"
              onClick={handlePriceClick}
              sx={{
                fontSize: '1rem',
                cursor: 'pointer',
                color: 'primary.main',
                '&:hover': {
                  textDecoration: 'underline',
                },
                '@container card (max-width: 250px)': {
                  fontSize: '0.9375rem',
                },
                '@container card (max-width: 200px)': {
                  fontSize: '0.875rem',
                },
              }}
            >
              {formatPrice(normalPrice)} ({formatPrice(foilPrice)} foil)
            </Typography>
            {isFallback && (
              <IconButton
                size="small"
                onClick={handleInfoClick}
                sx={{
                  ml: 0.25,
                  padding: 0,
                  color: 'action.active',
                  '&:hover': {
                    backgroundColor: 'transparent',
                    color: 'primary.main',
                  },
                }}
              >
                <InfoOutlinedIcon sx={{ fontSize: '1rem' }} />
              </IconButton>
            )}
          </Box>
        </Box>
        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
        >
          {renderPopoverContent()}
        </Popover>
        <BuyOptionsMenu
          anchorEl={menuAnchorEl}
          open={menuOpen}
          onClose={handleMenuClose}
          cardId={cardId}
          cardName={cardName}
          tcgplayerId={tcgplayerId}
          tcgHasRegular={hasNormalTcgPrice}
          tcgHasFoil={hasFoilTcgPrice}
          cardKingdomUrl={cardKingdomUrl}
          cardKingdomFoilUrl={cardKingdomFoilUrl}
          journeysEndUrl={journeysEndUrl}
          journeysEndFoilUrl={journeysEndFoilUrl}
          hideViewCardOption={hideViewCardOption}
        />
      </>
    );
  }

  // Only normal price available
  if (normalPriceWithType) {
    const { price: normalPrice, type: actualPriceType, isFallback } = normalPriceWithType;

    return (
      <>
        <Box sx={containerStyle}>
          <Box sx={flexContainerStyle}>
            <Typography
              variant="subtitle1"
              fontWeight="medium"
              onClick={handlePriceClick}
              sx={{
                fontSize: '1rem',
                cursor: 'pointer',
                color: 'primary.main',
                '&:hover': {
                  textDecoration: 'underline',
                },
                '@container card (max-width: 250px)': {
                  fontSize: '0.9375rem',
                },
                '@container card (max-width: 200px)': {
                  fontSize: '0.875rem',
                },
              }}
            >
              {formatPrice(normalPrice)}
            </Typography>
            {isFallback && (
              <IconButton
                size="small"
                onClick={handleInfoClick}
                sx={{
                  ml: 0.25,
                  padding: 0,
                  color: 'action.active',
                  '&:hover': {
                    backgroundColor: 'transparent',
                    color: 'primary.main',
                  },
                }}
              >
                <InfoOutlinedIcon sx={{ fontSize: '1rem' }} />
              </IconButton>
            )}
          </Box>
        </Box>
        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
        >
          {renderPopoverContent()}
        </Popover>
        <BuyOptionsMenu
          anchorEl={menuAnchorEl}
          open={menuOpen}
          onClose={handleMenuClose}
          cardId={cardId}
          cardName={cardName}
          tcgplayerId={tcgplayerId}
          tcgHasRegular={hasNormalTcgPrice}
          tcgHasFoil={hasFoilTcgPrice}
          cardKingdomUrl={cardKingdomUrl}
          cardKingdomFoilUrl={cardKingdomFoilUrl}
          journeysEndUrl={journeysEndUrl}
          journeysEndFoilUrl={journeysEndFoilUrl}
          hideViewCardOption={hideViewCardOption}
        />
      </>
    );
  }

  // When foil column is separate and no normal price exists, show em dash
  if (!showInlineFoil && !normalPriceWithType) {
    return (
      <Typography variant="body2" color="text.disabled">
        —
      </Typography>
    );
  }

  // Only foil price available as a last resort (when foil is shown inline)
  if (foilPrice !== null) {
    return (
      <>
        <Box sx={containerStyle}>
          <Box sx={flexContainerStyle}>
            <Typography
              variant="subtitle1"
              fontWeight="medium"
              onClick={handlePriceClick}
              sx={{
                fontSize: '1rem',
                cursor: 'pointer',
                color: 'primary.main',
                '&:hover': {
                  textDecoration: 'underline',
                },
                '@container card (max-width: 250px)': {
                  fontSize: '0.9375rem',
                },
                '@container card (max-width: 200px)': {
                  fontSize: '0.875rem',
                },
              }}
            >
              {formatPrice(foilPrice)}{!hideFoilSuffix && ' foil'}
            </Typography>
            {/* Only show the info icon if this is NOT a foil-only card */}
            {!isFoilOnlyCard && (
              <IconButton
                size="small"
                onClick={handleInfoClick}
                sx={{
                  ml: 0.25,
                  padding: 0,
                  color: 'action.active',
                  '&:hover': {
                    backgroundColor: 'transparent',
                    color: 'primary.main',
                  },
                }}
              >
                <InfoOutlinedIcon sx={{ fontSize: '1rem' }} />
              </IconButton>
            )}
          </Box>
        </Box>
        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
        >
          {renderPopoverContent()}
        </Popover>
        <BuyOptionsMenu
          anchorEl={menuAnchorEl}
          open={menuOpen}
          onClose={handleMenuClose}
          cardId={cardId}
          cardName={cardName}
          tcgplayerId={tcgplayerId}
          tcgHasRegular={hasNormalTcgPrice}
          tcgHasFoil={hasFoilTcgPrice}
          cardKingdomUrl={cardKingdomUrl}
          cardKingdomFoilUrl={cardKingdomFoilUrl}
          journeysEndUrl={journeysEndUrl}
          journeysEndFoilUrl={journeysEndFoilUrl}
          hideViewCardOption={hideViewCardOption}
        />
      </>
    );
  }

  // No prices available
  return (
    <Typography
      variant="subtitle1"
      fontWeight="medium"
      textAlign={centered ? 'center' : 'inherit'}
      sx={{
        fontSize: '1rem',
        '@container card (max-width: 250px)': {
          fontSize: '0.9375rem',
        },
        '@container card (max-width: 200px)': {
          fontSize: '0.875rem',
        },
      }}
    >
      N/A
    </Typography>
  );
};

export default CardPrice;
