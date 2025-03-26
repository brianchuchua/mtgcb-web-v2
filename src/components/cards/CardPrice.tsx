'use client';

import React from 'react';
import { Typography, Box, Skeleton, Tooltip } from '@mui/material';
import { PriceType } from '@/types/pricing';

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
}

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price);
};

const CardPrice: React.FC<CardPriceProps> = ({
  prices,
  isFoil = false,
  isLoading = false,
  priceType = PriceType.Market
}) => {
  if (isLoading) {
    return <Skeleton width={60} />;
  }
  
  if (!prices) {
    return (
      <Typography variant="subtitle1" fontWeight="medium">
        N/A
      </Typography>
    );
  }
  
  const normalPriceData = prices.normal;
  const foilPriceData = prices.foil;
  
  if (!normalPriceData && !foilPriceData) {
    return (
      <Typography variant="subtitle1" fontWeight="medium">
        N/A
      </Typography>
    );
  }
  
  // Get price values based on price type
  const normalPrice = normalPriceData ? 
    (priceType === PriceType.Market ? normalPriceData.market :
     priceType === PriceType.Low ? normalPriceData.low :
     priceType === PriceType.Average ? normalPriceData.average :
     normalPriceData.high) : null;
  
  // Foil always uses market price
  const foilPrice = foilPriceData ? foilPriceData.market : null;
  
  let priceLabel = '';
  
  switch (priceType) {
    case PriceType.Market:
      priceLabel = 'Market';
      break;
    case PriceType.Low:
      priceLabel = 'Low';
      break;
    case PriceType.Average:
      priceLabel = 'Average';
      break;
    case PriceType.High:
      priceLabel = 'High';
      break;
    default:
      priceLabel = 'Market';
      break;
  }
  
  // If specifically asking for foil, just use foil price
  if (isFoil && foilPrice !== null && foilPrice !== undefined) {
    return (
      <Tooltip title="Foil Price">
        <Box>
          <Typography variant="subtitle1" fontWeight="medium">
            {formatPrice(foilPrice)} foil
          </Typography>
        </Box>
      </Tooltip>
    );
  }
  
  // Handle display cases similar to the original implementation
  // Both prices available
  if (normalPrice !== null && normalPrice !== undefined && foilPrice !== null && foilPrice !== undefined) {
    return (
      <Tooltip title={`${priceLabel} Price (with Foil)`}>
        <Box>
          <Typography variant="subtitle1" fontWeight="medium">
            {formatPrice(normalPrice)} ({formatPrice(foilPrice)} foil)
          </Typography>
        </Box>
      </Tooltip>
    );
  }
  
  // Only normal price available
  if (normalPrice !== null && normalPrice !== undefined) {
    return (
      <Tooltip title={`${priceLabel} Price`}>
        <Box>
          <Typography variant="subtitle1" fontWeight="medium">
            {formatPrice(normalPrice)}
          </Typography>
        </Box>
      </Tooltip>
    );
  }
  
  // Only foil price available
  if (foilPrice !== null && foilPrice !== undefined) {
    return (
      <Tooltip title="Foil Price">
        <Box>
          <Typography variant="subtitle1" fontWeight="medium">
            {formatPrice(foilPrice)} foil
          </Typography>
        </Box>
      </Tooltip>
    );
  }
  
  // No prices available
  return (
    <Tooltip title={`No ${priceLabel.toLowerCase()} price available`}>
      <Typography variant="subtitle1" fontWeight="medium">
        N/A
      </Typography>
    </Tooltip>
  );
};

export default CardPrice;
