'use client';

import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { Box, Skeleton, Typography, Popover, IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import React, { useState, MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { PriceType } from '@/types/pricing';
import { generateTCGPlayerLink } from '@/utils/affiliateLinkBuilder';

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
}

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};

// This interface represents a price with its type for fallback mechanism
interface PriceWithType {
  price: number;
  type: PriceType;
  isFallback: boolean;
}

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
}) => {
  const router = useRouter();
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
      const tcgPlayerUrl = generateTCGPlayerLink(tcgplayerId, cardName || '');
      window.open(tcgPlayerUrl, '_blank', 'noopener,noreferrer');
    } else {
      setMenuAnchorEl(event.currentTarget);
    }
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleViewCard = () => {
    handleMenuClose();
    if (cardId && cardName) {
      const cardSlug = cardName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      router.push(`/browse/cards/${cardSlug}/${cardId}`);
    }
  };

  const handleBuyOnTCGPlayer = () => {
    handleMenuClose();
    const tcgPlayerUrl = generateTCGPlayerLink(tcgplayerId, cardName || '');
    window.open(tcgPlayerUrl, '_blank', 'noopener,noreferrer');
  };

  const open = Boolean(anchorEl);
  const menuOpen = Boolean(menuAnchorEl);
  if (isLoading) {
    return <Skeleton width={60} />;
  }

  if (!prices) {
    return (
      <Typography variant="subtitle1" fontWeight="medium" textAlign={centered ? 'center' : 'inherit'}
        sx={{
          fontSize: '1rem',
          '@container card (max-width: 250px)': {
            fontSize: '0.875rem',
          },
          '@container card (max-width: 200px)': {
            fontSize: '0.75rem',
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
      <Typography variant="subtitle1" fontWeight="medium" textAlign={centered ? 'center' : 'inherit'}
        sx={{
          fontSize: '1rem',
          '@container card (max-width: 250px)': {
            fontSize: '0.875rem',
          },
          '@container card (max-width: 200px)': {
            fontSize: '0.75rem',
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

  // Get the normal price with fallback mechanism
  const getNormalPriceWithFallback = (): PriceWithType | null => {
    if (!normalPriceData) return null;

    // Try to get the selected price type first
    if (priceType === PriceType.Market && normalPriceData.market !== null && normalPriceData.market !== undefined) {
      return { price: normalPriceData.market, type: PriceType.Market, isFallback: false };
    }
    if (priceType === PriceType.Low && normalPriceData.low !== null && normalPriceData.low !== undefined) {
      return { price: normalPriceData.low, type: PriceType.Low, isFallback: false };
    }
    if (priceType === PriceType.Average && normalPriceData.average !== null && normalPriceData.average !== undefined) {
      return { price: normalPriceData.average, type: PriceType.Average, isFallback: false };
    }
    if (priceType === PriceType.High && normalPriceData.high !== null && normalPriceData.high !== undefined) {
      return { price: normalPriceData.high, type: PriceType.High, isFallback: false };
    }

    // Fallback logic: market → low → average → high
    // If the requested price is not available, try others in order
    const fallbackChecks = [
      { value: normalPriceData.market, type: PriceType.Market },
      { value: normalPriceData.low, type: PriceType.Low },
      { value: normalPriceData.average, type: PriceType.Average },
      { value: normalPriceData.high, type: PriceType.High },
    ];

    // Filter out the originally requested price type that's already been checked
    const fallbacks = fallbackChecks.filter((check) => check.type !== priceType);

    // Try each fallback in order
    for (const fallback of fallbacks) {
      if (fallback.value !== null && fallback.value !== undefined) {
        return { price: fallback.value, type: fallback.type, isFallback: true };
      }
    }

    return null;
  };

  // Get foil price (usually market price is used for foil)
  const getFoilPrice = (): number | null => {
    if (!foilPriceData) return null;

    // For foil, try to get market price first, then fallback to others if not available
    if (foilPriceData.market !== null && foilPriceData.market !== undefined) {
      return foilPriceData.market;
    }
    if (foilPriceData.low !== null && foilPriceData.low !== undefined) {
      return foilPriceData.low;
    }
    if (foilPriceData.average !== null && foilPriceData.average !== undefined) {
      return foilPriceData.average;
    }
    if (foilPriceData.high !== null && foilPriceData.high !== undefined) {
      return foilPriceData.high;
    }

    return null;
  };

  // Check if normal prices exist but are all null (or the object doesn't exist)
  const hasAnyNormalPrice = hasAnyValidPrice(normalPriceData);

  // Check if this is a foil-only card (no normal prices, but has foil price)
  const isFoilOnlyCard = !hasAnyNormalPrice && hasAnyValidPrice(foilPriceData);

  const normalPriceWithType = getNormalPriceWithFallback();
  const foilPrice = getFoilPrice();

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
        `The ${requestedPriceTypeLabel.toLowerCase()} price is not available. Showing ${getPriceTypeLabel(normalPriceWithType.type).toLowerCase()} price instead.`
      );
    } else if (!normalPriceWithType && foilPrice && !isFoilOnlyCard) {
      content.push(
        `No ${requestedPriceTypeLabel.toLowerCase()} price is available for the regular version. Showing foil price instead.`
      );
    }

    return (
      <Box sx={{ p: 2, maxWidth: 300, position: 'relative' }}>
        <IconButton
          size="small"
          onClick={handleClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
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
              '&:hover': {
                color: 'primary.main',
                textDecoration: 'underline',
              },
              '@container card (max-width: 250px)': {
                fontSize: '0.875rem',
              },
              '@container card (max-width: 200px)': {
                fontSize: '0.75rem',
              },
            }}
          >
            {formatPrice(foilPrice)} foil
          </Typography>
        </Box>
        <Menu
          anchorEl={menuAnchorEl}
          open={menuOpen}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
        >
          {cardId && cardName && (
            <MenuItem onClick={handleViewCard}>
              <ListItemIcon>
                <OpenInNewIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>View Card Page</ListItemText>
            </MenuItem>
          )}
          <MenuItem onClick={handleBuyOnTCGPlayer}>
            <ListItemIcon>
              <ShoppingCartIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Buy on TCGPlayer</ListItemText>
          </MenuItem>
        </Menu>
      </>
    );
  }

  // Handle display cases with fallback mechanism
  // Both prices available
  if (normalPriceWithType && foilPrice !== null) {
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
                  fontSize: '0.875rem',
                },
                '@container card (max-width: 200px)': {
                  fontSize: '0.75rem',
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
                    }
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
        <Menu
          anchorEl={menuAnchorEl}
          open={menuOpen}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
        >
          {cardId && cardName && (
            <MenuItem onClick={handleViewCard}>
              <ListItemIcon>
                <OpenInNewIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>View Card Page</ListItemText>
            </MenuItem>
          )}
          <MenuItem onClick={handleBuyOnTCGPlayer}>
            <ListItemIcon>
              <ShoppingCartIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Buy on TCGPlayer</ListItemText>
          </MenuItem>
        </Menu>
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
                  fontSize: '0.875rem',
                },
                '@container card (max-width: 200px)': {
                  fontSize: '0.75rem',
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
                    }
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
        <Menu
          anchorEl={menuAnchorEl}
          open={menuOpen}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
        >
          {cardId && cardName && (
            <MenuItem onClick={handleViewCard}>
              <ListItemIcon>
                <OpenInNewIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>View Card Page</ListItemText>
            </MenuItem>
          )}
          <MenuItem onClick={handleBuyOnTCGPlayer}>
            <ListItemIcon>
              <ShoppingCartIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Buy on TCGPlayer</ListItemText>
          </MenuItem>
        </Menu>
      </>
    );
  }

  // Only foil price available as a last resort
  if (foilPrice !== null) {
    return (
      <>
        <Box sx={containerStyle}>
          <Box sx={flexContainerStyle}>
            <Typography variant="subtitle1" fontWeight="medium"
                sx={{
                  fontSize: '1rem',
                  '@container card (max-width: 250px)': {
                    fontSize: '0.875rem',
                  },
                  '@container card (max-width: 200px)': {
                    fontSize: '0.75rem',
                  },
                }}
              >
                {formatPrice(foilPrice)} foil
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
                    }
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
        <Menu
          anchorEl={menuAnchorEl}
          open={menuOpen}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
        >
          {cardId && cardName && (
            <MenuItem onClick={handleViewCard}>
              <ListItemIcon>
                <OpenInNewIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>View Card Page</ListItemText>
            </MenuItem>
          )}
          <MenuItem onClick={handleBuyOnTCGPlayer}>
            <ListItemIcon>
              <ShoppingCartIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Buy on TCGPlayer</ListItemText>
          </MenuItem>
        </Menu>
      </>
    );
  }

  // No prices available
  return (
    <Typography variant="subtitle1" fontWeight="medium" textAlign={centered ? 'center' : 'inherit'}
      sx={{
        fontSize: '1rem',
        '@container card (max-width: 250px)': {
          fontSize: '0.875rem',
        },
        '@container card (max-width: 200px)': {
          fontSize: '0.75rem',
        },
      }}
    >
      N/A
    </Typography>
  );
};

export default CardPrice;
