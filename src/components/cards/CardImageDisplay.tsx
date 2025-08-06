import { Box, Paper, Skeleton, Typography } from '@mui/material';
import React, { useState, useMemo } from 'react';
import { generateTCGPlayerLink } from '@/utils/affiliateLinkBuilder';

interface CardImageDisplayProps {
  cardId: string;
  cardName?: string;
  setName?: string;
  tcgplayerId?: number | string;
  linkToTCGPlayer?: boolean;
  width?: {
    xs?: number | string;
    sm?: number | string;
    md?: number | string;
    lg?: number | string;
  };
  maxWidth?: {
    xs?: number;
    sm?: number;
    md?: number;
  };
}

const getBorderRadius = (setName: string | undefined) => {
  return setName === 'Limited Edition Alpha' ? '7%' : '5%';
};

export const CardImageDisplay: React.FC<CardImageDisplayProps> = ({
  cardId,
  cardName,
  setName,
  tcgplayerId,
  linkToTCGPlayer = false,
  width = { xs: '100%' },
  maxWidth = { xs: 300, sm: 400 },
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const imageUrl = useMemo(() => {
    if (!cardId) return null;
    return `https://r2.mtgcollectionbuilder.com/cards/images/normal/${cardId}.jpg?v=${
      process.env.NEXT_PUBLIC_IMAGE_CACHE_DATE || '20241220'
    }`;
  }, [cardId]);

  const borderRadius = useMemo(() => getBorderRadius(setName), [setName]);
  const tcgPlayerLink = useMemo(() => {
    if (!linkToTCGPlayer) return null;
    return generateTCGPlayerLink(tcgplayerId, cardName);
  }, [linkToTCGPlayer, tcgplayerId, cardName]);

  const imageContent = (
    <>
      {!imageLoaded && !imageError && (
        <Skeleton
          variant="rectangular"
          width="100%"
          height="100%"
          animation="wave"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            borderRadius,
            backgroundColor: '#22262c',
          }}
        />
      )}
      {imageUrl && !imageError ? (
        <Box
          component="img"
          src={imageUrl}
          alt={linkToTCGPlayer ? `${cardName} - Buy on TCGPlayer` : (cardName || 'Card image')}
          title={linkToTCGPlayer ? `${cardName} - Buy on TCGPlayer` : undefined}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            opacity: imageLoaded ? 1 : 0,
            transition: 'opacity 0.7s ease-in-out',
            borderRadius,
          }}
        />
      ) : (
        <Paper
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'grey.100',
            borderRadius,
            textAlign: 'center',
            p: 2,
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
            {cardName || 'Card Name'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Image not available
          </Typography>
        </Paper>
      )}
    </>
  );

  return (
    <Box
      sx={{
        position: 'relative',
        width,
        maxWidth,
        margin: '0 auto',
        aspectRatio: '488/680',
        borderRadius,
        overflow: 'hidden',
        boxShadow: 3,
      }}
    >
      {linkToTCGPlayer && tcgPlayerLink ? (
        <Box
          component="a"
          href={tcgPlayerLink}
          target="_blank"
          rel="noreferrer"
          sx={{
            display: 'block',
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            textDecoration: 'none',
            cursor: 'pointer',
          }}
        >
          {imageContent}
        </Box>
      ) : (
        imageContent
      )}
    </Box>
  );
};