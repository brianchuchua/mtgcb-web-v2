'use client';

import { Box, Typography, Divider, Chip, Link } from '@mui/material';
import React from 'react';
import NextLink from 'next/link';
import SetIcon from '@/components/sets/SetIcon';
import { formatManaCost } from '@/utils/manaFormatter';
import capitalize from '@/utils/capitalize';

interface CardDetailsSectionProps {
  card: {
    name?: string;
    flavorName?: string;
    manaCost?: string;
    type?: string;
    oracleText?: string;
    flavorText?: string;
    powerNumeric?: string | null;
    toughnessNumeric?: string | null;
    loyaltyNumeric?: string | null;
    setCode?: string;
    setName?: string;
    setSlug?: string;
    collectorNumber?: string;
    rarity?: string;
    artist?: string;
    canBeNonFoil?: boolean;
    canBeFoil?: boolean;
  };
  userId?: number; // Optional for browse mode
  isCollectionView?: boolean;
}

const formatPowerToughness = (power: string | null, toughness: string | null) => {
  if (!power && !toughness) return null;
  if (power && toughness) return `${power}/${toughness}`;
  return null;
};

export const CardDetailsSection: React.FC<CardDetailsSectionProps> = ({ 
  card, 
  userId, 
  isCollectionView = false 
}) => {
  // Determine the base URL for links
  const baseUrl = isCollectionView && userId ? `/collections/${userId}` : '/browse';
  const artistSearchUrl = isCollectionView && userId 
    ? `/collections/${userId}?contentType=cards&artist=${encodeURIComponent(card.artist || '')}`
    : `/browse?contentType=cards&artist=${encodeURIComponent(card.artist || '')}`;
  const setUrl = isCollectionView && userId 
    ? `/collections/${userId}/${card.setSlug}`
    : `/browse/sets/${card.setSlug}`;

  return (
    <>
      {/* Card Name and Mana Cost */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="h5"
            fontWeight="600"
            sx={{
              color: (theme) => theme.palette.primary.main,
              fontSize: { xs: '1.25rem', sm: '1.5rem' },
            }}
          >
            {card.flavorName || card.name}
          </Typography>
        </Box>
        {card.manaCost && (
          <Box sx={{ ml: 2, fontSize: '1.25rem' }}>
            {formatManaCost(card.manaCost)}
          </Box>
        )}
      </Box>

      {/* Type Line */}
      <Typography variant="body1" sx={{ mb: 2 }}>
        {card.type}
      </Typography>

      {/* Oracle Text */}
      {card.oracleText && (
        <>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ px: 1, mb: 2 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                whiteSpace: 'pre-line',
                '& + &': { mt: 2 },
                lineHeight: 1.6,
              }}
            >
              {card.oracleText.split('\n').map((paragraph: string, index: number) => (
                <React.Fragment key={index}>
                  {paragraph}
                  {index < card.oracleText!.split('\n').length - 1 && (
                    <>
                      <br />
                      <br />
                    </>
                  )}
                </React.Fragment>
              ))}
            </Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
        </>
      )}
      
      {/* Flavor Text */}
      {card.flavorText && (
        <Box sx={{ px: 1, mb: 2 }}>
          <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
            {card.flavorText}
          </Typography>
        </Box>
      )}

      {/* P/T or Loyalty */}
      {(formatPowerToughness(card.powerNumeric || null, card.toughnessNumeric || null) || card.loyaltyNumeric) && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Typography variant="h6" fontWeight="500">
            {formatPowerToughness(card.powerNumeric || null, card.toughnessNumeric || null) || card.loyaltyNumeric}
          </Typography>
        </Box>
      )}

      {/* Card Details Grid */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {/* Set */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {card.setCode && <SetIcon code={card.setCode} size="1x" fixedWidth />}
          <Link
            component={NextLink}
            href={setUrl}
            sx={{
              textDecoration: 'none',
              color: 'inherit',
              fontSize: '0.875rem',
              '&:hover': {
                textDecoration: 'underline',
                color: (theme) => theme.palette.primary.main,
              },
            }}
          >
            {card.setName}
          </Link>
          <Typography variant="body2" color="text.secondary">
            #{card.collectorNumber} • {capitalize(card.rarity || 'Unknown')}
          </Typography>
        </Box>

        {/* Artist */}
        {card.artist && (
          <Typography variant="body2" color="text.secondary">
            Illustrated by{' '}
            <Link
              component={NextLink}
              href={artistSearchUrl}
              sx={{
                color: 'inherit',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                  color: (theme) => theme.palette.primary.main,
                },
              }}
            >
              {card.artist}
            </Link>
          </Typography>
        )}

        {/* Available Printings */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
          <Typography variant="body2" color="text.secondary">Available printings:</Typography>
          {card.canBeNonFoil !== false && (
            <Chip label="Regular" size="small" variant="outlined" sx={{ height: 20 }} />
          )}
          {card.canBeFoil && (
            <Chip 
              label="Foil" 
              size="small" 
              variant="outlined" 
              sx={{ 
                height: 20
              }} 
            />
          )}
        </Box>
      </Box>
    </>
  );
};