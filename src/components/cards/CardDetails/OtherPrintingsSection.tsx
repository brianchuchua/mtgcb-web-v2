'use client';

import { Box, Typography, Link, IconButton } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import NextLink from 'next/link';
import React from 'react';
import { CardHoverPreview } from '@/components/cards/CardHoverPreview';
import SetIcon from '@/components/sets/SetIcon';
import { PriceType } from '@/types/pricing';
import { getCollectionCardUrl } from '@/utils/collectionUrls';

interface Printing {
  id: string;
  name?: string;
  flavorName?: string;
  setName?: string;
  setCode?: string;
  collectorNumber?: string;
  quantityReg?: number;
  quantityFoil?: number;
  prices?: any;
  market?: string | null;
  low?: string | null;
  average?: string | null;
  high?: string | null;
  foil?: string | null;
}

interface OtherPrintingsSectionProps {
  printings: Printing[];
  currentPage: number;
  totalCount: number;
  itemsPerPage: number;
  isLoading?: boolean;
  priceType: PriceType;
  userId?: number; // Optional for browse mode
  isCollectionView?: boolean;
  onPageChange: (page: number) => void;
}

export const OtherPrintingsSection: React.FC<OtherPrintingsSectionProps> = ({
  printings,
  currentPage,
  totalCount,
  itemsPerPage,
  isLoading = false,
  priceType,
  userId,
  isCollectionView = false,
  onPageChange,
}) => {
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Get price based on user's priceType preference with fallback logic
  const getPrintingPrice = (printing: Printing): { price: number | null; isFoil: boolean } => {
    const normalPrices = printing.prices?.normal;
    const foilPrices = printing.prices?.foil;

    // Try to get the requested price type from normal prices first
    let selectedPrice = null;
    let isFoil = false;

    if (normalPrices) {
      // Try the requested price type first
      switch (priceType) {
        case 'low':
          if (normalPrices.low !== null && normalPrices.low !== undefined) {
            selectedPrice = normalPrices.low;
          }
          break;
        case 'average':
          if (normalPrices.average !== null && normalPrices.average !== undefined) {
            selectedPrice = normalPrices.average;
          }
          break;
        case 'high':
          if (normalPrices.high !== null && normalPrices.high !== undefined) {
            selectedPrice = normalPrices.high;
          }
          break;
        case 'market':
        default:
          if (normalPrices.market !== null && normalPrices.market !== undefined) {
            selectedPrice = normalPrices.market;
          }
          break;
      }

      // If requested price type not available, apply fallback logic: market → low → average → high
      if (selectedPrice === null) {
        const fallbackOrder = [
          normalPrices.market,
          normalPrices.low,
          normalPrices.average,
          normalPrices.high
        ];

        for (const fallbackPrice of fallbackOrder) {
          if (fallbackPrice !== null && fallbackPrice !== undefined) {
            selectedPrice = fallbackPrice;
            break;
          }
        }
      }
    }

    // If no normal price found, try foil prices
    if (selectedPrice === null && foilPrices) {
      // For foil, try the requested price type first, then fallback
      switch (priceType) {
        case 'low':
          if (foilPrices.low !== null && foilPrices.low !== undefined) {
            selectedPrice = foilPrices.low;
            isFoil = true;
          }
          break;
        case 'average':
          if (foilPrices.average !== null && foilPrices.average !== undefined) {
            selectedPrice = foilPrices.average;
            isFoil = true;
          }
          break;
        case 'high':
          if (foilPrices.high !== null && foilPrices.high !== undefined) {
            selectedPrice = foilPrices.high;
            isFoil = true;
          }
          break;
        case 'market':
        default:
          if (foilPrices.market !== null && foilPrices.market !== undefined) {
            selectedPrice = foilPrices.market;
            isFoil = true;
          }
          break;
      }

      // If still no price, apply foil fallback logic
      if (selectedPrice === null) {
        const foilFallbackOrder = [
          foilPrices.market,
          foilPrices.low,
          foilPrices.average,
          foilPrices.high
        ];

        for (const foilPrice of foilFallbackOrder) {
          if (foilPrice !== null && foilPrice !== undefined) {
            selectedPrice = foilPrice;
            isFoil = true;
            break;
          }
        }
      }
    }

    // Fallback to flat structure (old API format) if still no price
    if (selectedPrice === null && !printing.prices) {
      switch (priceType) {
        case 'low':
          selectedPrice = printing.low ? parseFloat(printing.low) : null;
          break;
        case 'average':
          selectedPrice = printing.average ? parseFloat(printing.average) : null;
          break;
        case 'high':
          selectedPrice = printing.high ? parseFloat(printing.high) : null;
          break;
        case 'market':
        default:
          selectedPrice = printing.market ? parseFloat(printing.market) : null;
          break;
      }

      // Apply fallback logic for flat structure
      if (selectedPrice === null) {
        const flatFallbackOrder = [
          printing.market ? parseFloat(printing.market) : null,
          printing.low ? parseFloat(printing.low) : null,
          printing.average ? parseFloat(printing.average) : null,
          printing.high ? parseFloat(printing.high) : null
        ];

        for (const fallbackPrice of flatFallbackOrder) {
          if (fallbackPrice !== null) {
            selectedPrice = fallbackPrice;
            break;
          }
        }
      }

      // If still no price and there's a foil price in flat structure, use it
      if (selectedPrice === null && printing.foil) {
        selectedPrice = parseFloat(printing.foil);
        isFoil = true;
      }
    }

    return { price: selectedPrice, isFoil };
  };

  // Generate the appropriate URL for each printing
  const getPrintingUrl = (printing: Printing) => {
    const cardSlug = printing.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || '';
    if (isCollectionView && userId) {
      return getCollectionCardUrl(userId, cardSlug, printing.id);
    }
    return `/browse/cards/${cardSlug}/${printing.id}`;
  };

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle2" fontWeight="600">
          Other Printings ({totalCount})
        </Typography>
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              {currentPage * itemsPerPage + 1}-{Math.min((currentPage + 1) * itemsPerPage, totalCount)}
            </Typography>
            <IconButton 
              size="small" 
              onClick={() => onPageChange(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
            >
              <ChevronLeftIcon fontSize="small" />
            </IconButton>
            <IconButton 
              size="small" 
              onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage >= totalPages - 1}
            >
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
      </Box>
      
      {isLoading ? (
        <Typography variant="body2" color="text.secondary">Loading...</Typography>
      ) : printings.length > 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {printings.map((printing) => {
            const { price: displayPrice, isFoil } = getPrintingPrice(printing);
            const hasInCollection = (printing.quantityReg || 0) > 0 || (printing.quantityFoil || 0) > 0;

            return (
              <CardHoverPreview
                key={printing.id}
                cardId={printing.id}
                cardName={printing.name}
                setName={printing.setName}
              >
                <Link
                  component={NextLink}
                  href={getPrintingUrl(printing)}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    textDecoration: 'none',
                    color: 'inherit',
                    py: 0.5,
                    px: 1,
                    borderRadius: 1,
                    backgroundColor: 'transparent',
                    '&:hover': {
                      backgroundColor: (theme) => theme.palette.action.hover,
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1, minWidth: 0 }}>
                    {printing.setCode && (
                      <SetIcon code={printing.setCode} size="1x" fixedWidth />
                    )}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontSize: '0.813rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontWeight: 400,
                        }}
                      >
                        {printing.flavorName || printing.name}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontSize: '0.75rem',
                          color: 'text.secondary',
                          display: 'block',
                        }}
                      >
                        {printing.setName} • #{printing.collectorNumber}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {hasInCollection && (
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {printing.quantityReg ? (
                          <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>
                            {printing.quantityReg}R
                          </Typography>
                        ) : null}
                        {printing.quantityFoil ? (
                          <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>
                            {printing.quantityFoil}F
                          </Typography>
                        ) : null}
                      </Box>
                    )}
                    <Typography variant="body2" sx={{ fontSize: '0.813rem' }}>
                      {displayPrice ? `$${displayPrice.toFixed(2)}${isFoil ? ' foil' : ''}` : '—'}
                    </Typography>
                  </Box>
                </Link>
              </CardHoverPreview>
            );
          })}
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary">
          No other printings found
        </Typography>
      )}
    </>
  );
};