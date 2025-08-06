'use client';

import { Box, Typography, Link, IconButton } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import NextLink from 'next/link';
import React from 'react';
import { CardHoverPreview } from '@/components/cards/CardHoverPreview';
import SetIcon from '@/components/sets/SetIcon';
import { PriceType } from '@/types/pricing';

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

  // Get price based on user's priceType preference
  const getPrintingPrice = (printing: Printing) => {
    // Try nested prices structure first, then fall back to flat structure
    const prices = printing.prices?.normal;
    
    let selectedPrice = null;
    if (prices) {
      // Use nested structure
      switch (priceType) {
        case 'low':
          selectedPrice = prices.low;
          break;
        case 'average':
          selectedPrice = prices.average;
          break;
        case 'high':
          selectedPrice = prices.high;
          break;
        case 'market':
        default:
          selectedPrice = prices.market;
          break;
      }
    } else {
      // Use flat structure (old API format)
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
    }
    
    return selectedPrice;
  };

  // Generate the appropriate URL for each printing
  const getPrintingUrl = (printing: Printing) => {
    const cardSlug = printing.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (isCollectionView && userId) {
      return `/collections/${userId}/cards/${cardSlug}/${printing.id}`;
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
            const displayPrice = getPrintingPrice(printing);
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
                      {displayPrice ? `$${displayPrice.toFixed(2)}` : '—'}
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