'use client';

import { Box, Typography, Divider, Button } from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { generateTCGPlayerLink } from '@/utils/affiliateLinkBuilder';

interface PriceData {
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
}

interface CardPricesSectionProps {
  priceData: PriceData | null;
  tcgplayerId?: number | string | null;
  cardName?: string;
  pricesUpdatedAt?: string | null;
}

const formatPriceUpdateDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'Unknown';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffHours < 1) {
      return 'Updated less than an hour ago';
    } else if (diffHours === 1) {
      return 'Updated 1 hour ago';
    } else if (diffHours < 24) {
      return `Updated ${diffHours} hours ago`;
    } else if (diffDays === 1) {
      return 'Updated 1 day ago';
    } else if (diffDays < 7) {
      return `Updated ${diffDays} days ago`;
    } else {
      return `Updated on ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
  } catch {
    return 'Unknown';
  }
};

export const CardPricesSection: React.FC<CardPricesSectionProps> = ({ 
  priceData, 
  tcgplayerId, 
  cardName,
  pricesUpdatedAt 
}) => {
  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
        <Typography variant="subtitle2" fontWeight="600">
          Prices
        </Typography>
        {pricesUpdatedAt && (
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1 }}>
            ({formatPriceUpdateDate(pricesUpdatedAt)})
          </Typography>
        )}
      </Box>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {priceData?.normal && (
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 500 }}>
              REGULAR
            </Typography>
            <Box sx={{ pl: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2">Market</Typography>
                <Typography variant="body2" fontWeight="600">
                  {priceData.normal.market ? `$${priceData.normal.market.toFixed(2)}` : '—'}
                </Typography>
              </Box>
              {priceData.normal.low && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Low</Typography>
                  <Typography variant="body2">
                    ${priceData.normal.low.toFixed(2)}
                  </Typography>
                </Box>
              )}
              {priceData.normal.average && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Average</Typography>
                  <Typography variant="body2">
                    ${priceData.normal.average.toFixed(2)}
                  </Typography>
                </Box>
              )}
              {priceData.normal.high && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">High</Typography>
                  <Typography variant="body2">
                    ${priceData.normal.high.toFixed(2)}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        )}

        {priceData?.foil && (
          <Box>
            <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 500 }}>
              FOIL
            </Typography>
            <Box sx={{ pl: 1 }}>
              {priceData.foil.market && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Market</Typography>
                  <Typography variant="body2" fontWeight="600">
                    ${priceData.foil.market.toFixed(2)}
                  </Typography>
                </Box>
              )}
              {priceData.foil.low && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Low</Typography>
                  <Typography variant="body2">
                    ${priceData.foil.low.toFixed(2)}
                  </Typography>
                </Box>
              )}
              {priceData.foil.average && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Average</Typography>
                  <Typography variant="body2">
                    ${priceData.foil.average.toFixed(2)}
                  </Typography>
                </Box>
              )}
              {priceData.foil.high && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">High</Typography>
                  <Typography variant="body2">
                    ${priceData.foil.high.toFixed(2)}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        )}
      </Box>

      {/* TCGPlayer Button */}
      {(tcgplayerId || cardName) && (
        <>
          <Divider sx={{ my: 2 }} />
          <Button
            variant="contained"
            size="small"
            startIcon={<ShoppingCartIcon />}
            href={generateTCGPlayerLink(tcgplayerId, cardName)}
            target="_blank"
            rel="noopener noreferrer"
            fullWidth
            sx={{
              textTransform: 'none',
              fontWeight: 500,
            }}
          >
            Buy on TCGPlayer
          </Button>
        </>
      )}
    </>
  );
};