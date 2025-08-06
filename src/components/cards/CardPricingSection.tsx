import { Box, Link, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import React, { useMemo } from 'react';
import { CardModel } from '@/api/browse/types';
import { generateTCGPlayerLink } from '@/utils/affiliateLinkBuilder';

interface CardPricingSectionProps {
  card: CardModel;
  compact?: boolean;
}

export const CardPricingSection: React.FC<CardPricingSectionProps> = ({ 
  card, 
  compact = false 
}) => {
  const priceData = useMemo(() => {
    if (!card) return null;
    
    const prices = card.prices || {
      normal: {
        market: card.market ? parseFloat(card.market) : null,
        low: card.low ? parseFloat(card.low) : null,
        average: card.average ? parseFloat(card.average) : null,
        high: card.high ? parseFloat(card.high) : null,
      },
      foil: card.foil
        ? {
            market: parseFloat(card.foil),
            low: null,
            average: null,
            high: null,
          }
        : null,
    };

    const hasNormalPrices =
      prices.normal &&
      (prices.normal.market || prices.normal.low || prices.normal.average || prices.normal.high);

    const hasFoilPrices = prices.foil && prices.foil.market;

    return {
      prices,
      hasNormalPrices,
      hasFoilPrices,
      hasAnyPrices: hasNormalPrices || hasFoilPrices,
    };
  }, [card]);

  if (!priceData) return null;

  return (
    <Box sx={{ mt: compact ? 1 : { xs: 2, md: 3 } }}>
      {!compact && (
        <Typography
          variant="h5"
          fontWeight="500"
          sx={{
            mb: 2,
            color: (theme) => theme.palette.primary.main,
            fontSize: { xs: '1.25rem', sm: '1.5rem' },
          }}
        >
          Pricing
        </Typography>
      )}

      {!priceData.hasAnyPrices ? (
        <Typography variant="body1" color="text.secondary">
          No pricing information available
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {/* Normal Prices */}
          {priceData.hasNormalPrices && (
            <Grid size={{ xs: 12, sm: compact ? 12 : 6 }}>
              {!compact && (
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 500 }}>
                  Regular
                </Typography>
              )}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {priceData.prices.normal?.market && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      {compact ? 'Reg:' : 'Market:'}
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      ${priceData.prices.normal.market.toFixed(2)}
                    </Typography>
                  </Box>
                )}
                {!compact && priceData.prices.normal?.low && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Low:
                    </Typography>
                    <Typography variant="body1">
                      ${priceData.prices.normal.low.toFixed(2)}
                    </Typography>
                  </Box>
                )}
                {!compact && priceData.prices.normal?.average && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Average:
                    </Typography>
                    <Typography variant="body1">
                      ${priceData.prices.normal.average.toFixed(2)}
                    </Typography>
                  </Box>
                )}
                {!compact && priceData.prices.normal?.high && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      High:
                    </Typography>
                    <Typography variant="body1">
                      ${priceData.prices.normal.high.toFixed(2)}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Grid>
          )}

          {/* Foil Prices */}
          {priceData.hasFoilPrices && (
            <Grid size={{ xs: 12, sm: compact ? 12 : 6 }}>
              {!compact && (
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 500 }}>
                  Foil
                </Typography>
              )}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    {compact ? 'Foil:' : 'Market:'}
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    ${priceData.prices.foil?.market?.toFixed(2) || '0.00'}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          )}
        </Grid>
      )}

      {/* TCGPlayer Link */}
      {!compact && card && (card.tcgplayerId || card.name) && (
        <Box sx={{ mt: 2, textAlign: { xs: 'center', sm: 'left' } }}>
          <Link
            href={generateTCGPlayerLink(card.tcgplayerId, card.name)}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              textDecoration: 'none',
              color: (theme) => theme.palette.primary.main,
              '&:hover': {
                textDecoration: 'underline',
              },
            }}
          >
            <Typography variant="body2" fontWeight="medium">
              Buy on TCGPlayer →
            </Typography>
          </Link>
        </Box>
      )}
    </Box>
  );
};