'use client';

import { Box, Card, CardContent, Skeleton, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useEffect, useRef, useState } from 'react';

// Define a generic card interface that's not tied to any specific API
export interface CardItemProps {
  /**
   * Unique identifier for the card
   */
  id: string;

  /**
   * Card name
   */
  name: string;

  /**
   * Set code used for display and icon
   */
  setCode?: string;

  /**
   * Set name
   */
  setName?: string;

  /**
   * Collector number within the set
   */
  collectorNumber?: string;

  /**
   * Card rarity (common, uncommon, rare, mythic, etc.)
   */
  rarity?: string;

  /**
   * Price information
   */
  price?: {
    value: number;
    currency?: string;
    isFoil?: boolean;
  };

  /**
   * Visual display options
   */
  display?: {
    nameIsVisible?: boolean;
    setIsVisible?: boolean;
    priceIsVisible?: boolean;
  };

  /**
   * Optional callback when card is clicked
   */
  onClick?: () => void;
}

/**
 * A reusable card component that displays an MTG card with image, name, set, and price information
 */
const CardItem = ({
  id,
  name,
  setCode,
  setName,
  collectorNumber,
  rarity,
  price,
  display = {
    nameIsVisible: true,
    setIsVisible: true,
    priceIsVisible: true,
  },
  onClick,
}: CardItemProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  const { nameIsVisible, setIsVisible, priceIsVisible } = display;

  // Lazy load the image
  useEffect(() => {
    // When the component mounts, set the image src from data-src
    if (imageRef.current && imageRef.current.dataset.src) {
      // Small timeout to ensure it doesn't block other UI rendering
      const timer = setTimeout(() => {
        if (imageRef.current) {
          imageRef.current.src = imageRef.current.dataset.src || '';
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, []);

  // Get price display
  const getPriceDisplay = () => {
    if (!price) return 'Price N/A';

    const currency = price.currency || '$';
    const formattedPrice = `${currency}${price.value.toFixed(2)}`;

    // Show foil indicator if applicable
    if (price.isFoil) {
      return `${formattedPrice} (F)`;
    }

    return formattedPrice;
  };

  // Get image URL with cache busting
  const getImageUrl = () => {
    return `https://mtgcb-images.s3.amazonaws.com/cards/images/normal/${id}.jpg?v=${process.env.NEXT_PUBLIC_IMAGE_CACHE_DATE || '20241220'}`;
  };

  return (
    <StyledCard onClick={onClick} sx={{ cursor: onClick ? 'pointer' : 'default' }}>
      <CardImageContainer>
        {!imageLoaded && !imageError && (
          <Skeleton
            variant="rectangular"
            width="100%"
            height="100%"
            animation="wave"
            sx={{ position: 'absolute', top: 0, left: 0 }}
          />
        )}
        {!imageError ? (
          <CardImage
            ref={imageRef}
            // Use undefined for src initially to avoid browser warnings and network issues
            src={undefined}
            data-src={getImageUrl()}
            alt={name}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            style={{ opacity: imageLoaded ? 1 : 0 }}
          />
        ) : (
          <MissingImageFallback>
            <Typography variant="subtitle2">{name}</Typography>
            <Typography variant="caption">Image not available</Typography>
          </MissingImageFallback>
        )}
      </CardImageContainer>

      {(nameIsVisible || setIsVisible || priceIsVisible) && (
        <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
          {nameIsVisible && (
            <Typography variant="subtitle2" noWrap title={name} sx={{ fontWeight: 'bold' }}>
              {name}
            </Typography>
          )}

          {setIsVisible && setName && (
            <Typography variant="caption" noWrap display="block" sx={{ opacity: 0.8 }}>
              <i className={`ss ss-${setCode?.toLowerCase() || 'unfinity'}`} />
              &nbsp;{setName} #{collectorNumber || '??'}
            </Typography>
          )}

          {priceIsVisible && (
            <Typography
              variant="caption"
              noWrap
              display="block"
              sx={{
                mt: 0.5,
                fontWeight: 'medium',
                color: (theme) => theme.palette.primary.main,
              }}
            >
              {getPriceDisplay()}
            </Typography>
          )}
        </CardContent>
      )}
    </StyledCard>
  );
};

// Styled components
const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  backgroundColor: theme.palette.background.paper,
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[4],
  },
}));

const CardImageContainer = styled(Box)({
  position: 'relative',
  paddingTop: '140%', // 2.5:3.5 aspect ratio (Magic card dimensions)
  overflow: 'hidden',
});

const CardImage = styled('img')({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  transition: 'opacity 0.3s ease-in-out',
});

const MissingImageFallback = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: theme.palette.background.default,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(2),
  textAlign: 'center',
  '& .MuiTypography-subtitle2': {
    marginBottom: theme.spacing(1),
    fontWeight: 'bold',
    maxWidth: '90%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  '& .MuiTypography-caption': {
    opacity: 0.7,
  },
}));

export default CardItem;
