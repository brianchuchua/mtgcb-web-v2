import { Box, Chip, Link, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import NextLink from 'next/link';
import React from 'react';
import { CardModel } from '@/api/browse/types';
import SetIcon from '@/components/sets/SetIcon';
import capitalize from '@/utils/capitalize';
import { formatISODate } from '@/utils/dateUtils';

interface CardDetailsGridProps {
  card: CardModel;
  isCollectionContext?: boolean;
  collectionSlug?: string;
  userId?: number;
}

const getRarityColor = (rarity: string | undefined) => {
  if (!rarity) return 'default';
  switch (rarity.toLowerCase()) {
    case 'common':
      return 'default';
    case 'uncommon':
      return 'info';
    case 'rare':
      return 'warning';
    case 'mythic rare':
      return 'error';
    default:
      return 'default';
  }
};

const formatManaCost = (manaCost: string | null) => {
  if (!manaCost) return 'N/A';
  return manaCost;
};

const formatPowerToughness = (power: string | null, toughness: string | null) => {
  if (!power && !toughness) return null;
  if (power && toughness) return `${power}/${toughness}`;
  if (power) return power;
  if (toughness) return toughness;
  return null;
};

export const CardDetailsGrid: React.FC<CardDetailsGridProps> = ({ 
  card, 
  isCollectionContext = false,
  collectionSlug,
  userId 
}) => {
  const rarityColor = getRarityColor(card.rarity);
  
  // Determine the set link based on context
  const setLink = isCollectionContext && userId && card.setSlug
    ? `/collections/${userId}/${card.setSlug}`
    : `/browse/sets/${card.setSlug}`;

  return (
    <Box sx={{ mb: 3 }}>
      <Grid container spacing={2}>
        {/* Set */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Set
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            {card.setSlug && <SetIcon code={card.setSlug} size="lg" fixedWidth />}
            {card.setName && card.setSlug ? (
              <Link
                component={NextLink}
                href={setLink}
                variant="body1"
                sx={{
                  textDecoration: 'none',
                  color: 'inherit',
                  '&:hover': {
                    textDecoration: 'underline',
                    color: (theme) => theme.palette.primary.main,
                  },
                }}
              >
                {card.setName}
              </Link>
            ) : (
              <Typography variant="body1">{card.setName || 'Unknown Set'}</Typography>
            )}
          </Box>
        </Grid>

        {/* Collector Number */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Collector Number
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {card.collectorNumber || 'N/A'}
          </Typography>
        </Grid>

        {/* Rarity */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Rarity
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Chip
              label={capitalize(card.rarity || 'Unknown')}
              color={rarityColor}
              variant="outlined"
              size="small"
            />
          </Box>
        </Grid>

        {/* Type */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Type
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {card.type || 'N/A'}
          </Typography>
        </Grid>

        {/* Mana Cost */}
        {card.manaCost && (
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Mana Cost
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {formatManaCost(card.manaCost)}
            </Typography>
          </Grid>
        )}

        {/* CMC */}
        {card.convertedManaCost !== null && card.convertedManaCost !== undefined && (
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Mana Value
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {card.convertedManaCost}
            </Typography>
          </Grid>
        )}

        {/* Power/Toughness */}
        {formatPowerToughness(card.powerNumeric || null, card.toughnessNumeric || null) && (
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Power/Toughness
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {formatPowerToughness(card.powerNumeric || null, card.toughnessNumeric || null)}
            </Typography>
          </Grid>
        )}

        {/* Loyalty */}
        {card.loyaltyNumeric && (
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Loyalty
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {card.loyaltyNumeric}
            </Typography>
          </Grid>
        )}

        {/* Artist */}
        {card.artist && (
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Artist
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {card.artist}
            </Typography>
          </Grid>
        )}

        {/* Release Date */}
        {card.releaseDate && (
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Release Date
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {formatISODate(card.releaseDate)}
            </Typography>
          </Grid>
        )}

        {/* Foil/Non-Foil Availability */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Available In
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            {card.canBeNonFoil !== false && (
              <Chip label="Regular" size="small" variant="outlined" />
            )}
            {card.canBeFoil && (
              <Chip label="Foil" size="small" variant="outlined" color="secondary" />
            )}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};