'use client';

import { Box, Card, CardContent, Skeleton, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useEffect, useRef, useState } from 'react';
import { generateTCGPlayerLink } from '@/utils/affiliateLinkBuilder';

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
   * Flag to indicate this is a loading skeleton
   */
  isLoadingSkeleton?: boolean;

  /**
   * TCGPlayer Id
   */
  tcgplayerId?: number | string;

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
  prices?: {
    normal?: {
      value: number;
      currency?: string;
    };
    foil?: {
      value: number;
      currency?: string;
    };
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
  tcgplayerId,
  collectorNumber,
  rarity,
  prices,
  display = {
    nameIsVisible: true,
    setIsVisible: true,
    priceIsVisible: true,
  },
  onClick,
  isLoadingSkeleton = false,
}: CardItemProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  const { nameIsVisible, setIsVisible, priceIsVisible } = display;

  // If this is a loading skeleton, render a placeholder
  if (isLoadingSkeleton) {
    return (
      <StyledCard>
        <CardImageContainer>
          <Skeleton
            variant="rectangular"
            width="100%"
            height="100%"
            animation="wave"
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              borderRadius: '5%',
            }}
          />
        </CardImageContainer>

        <CardContent
          sx={{
            p: 1,
            '&:last-child': { pb: 1 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Skeleton variant="text" width="80%" height={28} animation="wave" />
          <Skeleton variant="text" width="60%" height={20} animation="wave" />
          <Skeleton variant="text" width="50%" height={20} animation="wave" />
        </CardContent>
      </StyledCard>
    );
  }

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
    if (!prices || (!prices.normal && !prices.foil)) return 'Price N/A';

    const normalPrice = prices.normal;
    const foilPrice = prices.foil;
    const currency = '$';

    // Both prices available
    if (normalPrice && foilPrice) {
      const formattedNormal = `${currency}${normalPrice.value.toFixed(2)}`;
      const formattedFoil = `${currency}${foilPrice.value.toFixed(2)}`;
      return `${formattedNormal} (${formattedFoil} foil)`;
    }

    // Only normal price available
    if (normalPrice) {
      return `${currency}${normalPrice.value.toFixed(2)}`;
    }

    // Only foil price available
    if (foilPrice) {
      return `${currency}${foilPrice.value.toFixed(2)} foil`;
    }

    return 'Price N/A';
  };

  // Get image URL with cache busting
  const getImageUrl = () => {
    return `https://mtgcb-images.s3.amazonaws.com/cards/images/normal/${id}.jpg?v=${process.env.NEXT_PUBLIC_IMAGE_CACHE_DATE || '20241220'}`;
  };

  // Get TCGPlayer affiliate link for this card
  const getTCGPlayerLink = () => {
    // Always generate a link to TCGPlayer - use direct product link if we have tcgplayerId,
    // otherwise search for the card by name
    return generateTCGPlayerLink(tcgplayerId, name);
  };

  // Determine the border radius based on set name
  const getBorderRadius = () => {
    return setName === 'Limited Edition Alpha' ? '7%' : '5%';
  };

  // Handle element click for card navigation
  const handleCardElementClick = (e: React.MouseEvent) => {
    // Stop event from bubbling up to parent elements
    e.stopPropagation();

    if (onClick) {
      onClick();
    }
  };

  return (
    <StyledCard
      sx={{
        borderRadius: getBorderRadius(),
      }}
      setName={setName}
    >
      <CardImageContainer
        onClick={onClick ? handleCardElementClick : undefined}
        sx={{ cursor: onClick ? 'pointer' : 'default' }}
      >
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
              borderRadius: getBorderRadius(),
            }}
          />
        )}
        {!imageError ? (
          <CardImage
            ref={imageRef}
            // Use undefined for src initially to avoid browser warnings and network issues
            src={undefined}
            data-src={getImageUrl()}
            alt={name}
            setName={setName}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            style={{ opacity: imageLoaded ? 1 : 0 }}
          />
        ) : (
          <MissingImageFallback setName={setName}>
            <Typography variant="subtitle2">{name}</Typography>
            <Typography variant="caption">Image not available</Typography>
          </MissingImageFallback>
        )}
      </CardImageContainer>

      {(nameIsVisible || setIsVisible || priceIsVisible) && (
        <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
          {nameIsVisible && (
            <Typography
              variant="h6"
              noWrap
              title={name}
              onClick={onClick ? handleCardElementClick : undefined}
              sx={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100%',
                cursor: onClick ? 'pointer' : 'default',
                '&:hover': {
                  textDecoration: onClick ? 'underline' : 'none',
                },
              }}
            >
              {name}
            </Typography>
          )}

          {setIsVisible && (
            <Typography
              variant="body2"
              noWrap
              display="block"
              sx={{
                opacity: 0.8,
                fontStyle: 'italic',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100%',
              }}
            >
              {setName || 'Unknown Set'} #{collectorNumber || '??'}
            </Typography>
          )}

          {priceIsVisible && (
            <Typography
              variant="subtitle1"
              noWrap
              display="block"
              component="a"
              href={getTCGPlayerLink()}
              target="_blank"
              rel="noreferrer"
              sx={{
                mt: 0.5,
                fontWeight: 'medium',
                color: (theme) => theme.palette.primary.main,
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                },
                cursor: 'pointer', // Always show pointer since we always link to TCGPlayer now
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
interface CardElementProps {
  setName?: string;
}

const StyledCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'setName',
})<CardElementProps>(({ theme, setName }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  backgroundColor: theme.palette.background.paper,
  textAlign: 'center', // Ensure text is centered like original
  borderRadius: setName === 'Limited Edition Alpha' ? '7%' : '5%',
  overflow: 'hidden',
  boxShadow: theme.shadows[3],
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[4],
  },
}));

const CardImageContainer = styled(Box)({
  position: 'relative',
  paddingTop: '139.3%', // Aspect ratio of a magic card (680/488)
  overflow: 'hidden',
});

interface CardImageProps {
  setName?: string;
}

const CardImage = styled('img')<CardImageProps>(({ setName }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  transition: 'opacity 0.3s ease-in-out',
  borderRadius: setName === 'Limited Edition Alpha' ? '7%' : '5%',
}));

const MissingImageFallback = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'setName',
})<CardElementProps>(({ theme, setName }) => ({
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
  borderRadius: setName === 'Limited Edition Alpha' ? '7%' : '5%',
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
