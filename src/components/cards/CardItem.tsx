'use client';

import { Box, Card, CardContent, Skeleton, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import CardPrice from './CardPrice';
import { EditableCardQuantity } from './EditableCardQuantity';
import { PriceType } from '@/types/pricing';
import { generateTCGPlayerLink } from '@/utils/affiliateLinkBuilder';

export interface CardItemProps {
  id: string;
  name: string;
  setCode?: string;
  setName?: string;
  setSlug?: string;
  isLoadingSkeleton?: boolean;
  tcgplayerId?: number | string;
  collectorNumber?: string;
  mtgcbCollectorNumber?: string;
  rarity?: string;
  type?: string;
  artist?: string;
  manaCost?: string;
  convertedManaCost?: string;
  powerNumeric?: string;
  toughnessNumeric?: string;
  loyaltyNumeric?: string;
  prices?: {
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
  };
  // Raw price data from API
  low?: string | null;
  average?: string | null;
  high?: string | null;
  market?: string | null;
  foil?: string | null;
  // Collection quantities
  quantityReg?: number;
  quantityFoil?: number;
  // Goal progress fields
  goalTargetQuantityReg?: number;
  goalTargetQuantityFoil?: number;
  goalTargetQuantityAll?: number | null;
  goalRegMet?: boolean;
  goalFoilMet?: boolean;
  goalAllMet?: boolean;
  goalFullyMet?: boolean;
  goalRegNeeded?: number;
  goalFoilNeeded?: number;
  goalAllNeeded?: number;
  display?: {
    nameIsVisible?: boolean;
    setIsVisible?: boolean;
    priceIsVisible?: boolean;
    quantityIsVisible?: boolean;
    goalProgressIsVisible?: boolean;
  };
  priceType?: PriceType; // Price type to display
  onClick?: () => void;
  isOwnCollection?: boolean;
}

/**
 * A reusable card component that displays an MTG card with image, name, set, and price information
 */
const CardItemComponent = ({
  id,
  name,
  setCode,
  setName,
  setSlug,
  tcgplayerId,
  collectorNumber,
  rarity,
  type,
  artist,
  prices,
  low,
  average,
  high,
  market,
  foil,
  quantityReg,
  quantityFoil,
  goalTargetQuantityReg,
  goalTargetQuantityFoil,
  goalTargetQuantityAll,
  goalRegMet,
  goalFoilMet,
  goalAllMet,
  goalFullyMet,
  goalRegNeeded,
  goalFoilNeeded,
  goalAllNeeded,
  display = {
    nameIsVisible: true,
    setIsVisible: true,
    priceIsVisible: true,
    quantityIsVisible: false,
    goalProgressIsVisible: false,
  },
  priceType = PriceType.Market,
  onClick,
  isLoadingSkeleton = false,
  isOwnCollection = false,
}: CardItemProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const pathname = usePathname();

  const { nameIsVisible, setIsVisible, priceIsVisible, quantityIsVisible = false, goalProgressIsVisible = false } = display;

  // Check if we're in a collection view and extract userId
  const collectionMatch = pathname?.match(/^\/collections\/(\d+)/);
  const userId = collectionMatch ? collectionMatch[1] : null;

  // If this is a loading skeleton, render an invisible placeholder
  if (isLoadingSkeleton) {
    return (
      <StyledCard
        sx={{
          opacity: 0.0, // Intentional while I experiment with skeleton loaders
        }}
      >
        <CardImageContainer>
          <Skeleton
            variant="rectangular"
            width="100%"
            height="100%"
            animation={false}
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

  // Create structured price data from the raw API values if not already provided
  const priceData = prices || {
    normal: {
      market: market ? parseFloat(market) : null,
      low: low ? parseFloat(low) : null,
      average: average ? parseFloat(average) : null,
      high: high ? parseFloat(high) : null,
    },
    foil: foil
      ? {
          market: parseFloat(foil),
          low: null,
          average: null,
          high: null,
        }
      : null,
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
        sx={{ 
          cursor: onClick ? 'pointer' : 'default',
          opacity: goalProgressIsVisible && goalFullyMet === false ? 0.5 : 1,
          transition: 'opacity 0.2s ease-in-out',
          position: 'relative',
          '&:hover': {
            opacity: 1,
          },
          // Add diagonal stripes overlay for incomplete goals
          ...(goalProgressIsVisible && goalFullyMet === false && {
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `repeating-linear-gradient(
                45deg,
                transparent,
                transparent 10px,
                rgba(255, 152, 0, 0.1) 10px,
                rgba(255, 152, 0, 0.1) 20px
              )`,
              pointerEvents: 'none',
              borderRadius: 'inherit',
              transition: 'opacity 0.2s ease-in-out',
            },
            '&:hover::after': {
              opacity: 0.3,
            },
          }),
        }}
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
              backgroundColor: '#22262c',
            }}
          />
        )}
        {!imageError ? (
          <CardImage
            ref={imageRef}
            src={getImageUrl()}
            loading="lazy"
            alt={name}
            title={name}
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

      {(nameIsVisible || setIsVisible || priceIsVisible || quantityIsVisible || goalProgressIsVisible) && (
        <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
          {quantityIsVisible && (quantityReg !== undefined || quantityFoil !== undefined) && isOwnCollection && (
            <Box sx={{ mb: 1 }}>
              <EditableCardQuantity
                cardId={parseInt(id)}
                cardName={name}
                quantityReg={quantityReg || 0}
                quantityFoil={quantityFoil || 0}
              />
            </Box>
          )}

          {goalProgressIsVisible && (goalTargetQuantityReg || goalTargetQuantityFoil || goalTargetQuantityAll) && (
            <Box sx={{ mt: -0.5, mb: 0.5 }}>
              <Typography 
                variant="caption" 
                sx={{ 
                  display: 'block', 
                  color: goalFullyMet ? 'success.main' : 'warning.main',
                  fontWeight: 'medium',
                  textAlign: 'center'
                }}
              >
                {(() => {
                  // If goal is fully met
                  if (goalFullyMet) {
                    return '(Goal met!)';
                  }
                  
                  // If only regular target exists
                  if (goalTargetQuantityReg && !goalTargetQuantityFoil && !goalTargetQuantityAll) {
                    return `(Need ${goalRegNeeded} regular)`;
                  }
                  
                  // If only foil target exists
                  if (!goalTargetQuantityReg && goalTargetQuantityFoil && !goalTargetQuantityAll) {
                    return `(Need ${goalFoilNeeded} foil)`;
                  }
                  
                  // If both regular and foil targets exist
                  if (goalTargetQuantityReg && goalTargetQuantityFoil && !goalTargetQuantityAll) {
                    const needs = [];
                    if (goalRegNeeded > 0) needs.push(`${goalRegNeeded} regular`);
                    if (goalFoilNeeded > 0) needs.push(`${goalFoilNeeded} foil`);
                    return needs.length > 0 ? `(Need ${needs.join(' and ')})` : '(Goal met!)';
                  }
                  
                  // If "any type" target exists (goalTargetQuantityAll)
                  if (goalTargetQuantityAll) {
                    if (goalAllNeeded > 0) {
                      return `(Need ${goalAllNeeded} regular or foil)`;
                    }
                    return '(Goal met!)';
                  }
                  
                  return '';
                })()}
              </Typography>
            </Box>
          )}

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
              {setName && setSlug ? (
                <Link
                  href={userId ? `/collections/${userId}/${setSlug}` : `/browse/sets/${setSlug}`}
                  style={{
                    color: 'inherit',
                    textDecoration: 'none',
                  }}
                  onClick={(e) => e.stopPropagation()} // Prevent card click when clicking set link
                >
                  <Box
                    component="span"
                    sx={{
                      '&:hover': {
                        textDecoration: 'underline',
                        color: (theme) => theme.palette.primary.main,
                      },
                      cursor: 'pointer',
                    }}
                  >
                    {setName}
                  </Box>
                </Link>
              ) : (
                setName || 'Unknown Set'
              )}{' '}
              #{collectorNumber || '??'}
            </Typography>
          )}

          {priceIsVisible && (
            <Box
              component="a"
              href={getTCGPlayerLink()}
              target="_blank"
              rel="noreferrer"
              sx={{
                mt: 0.5,
                display: 'block',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                },
                cursor: 'pointer',
                color: (theme) => theme.palette.primary.main,
              }}
            >
              <CardPrice prices={priceData} isLoading={isLoadingSkeleton} priceType={priceType} />
            </Box>
          )}

          {quantityIsVisible && (quantityReg !== undefined || quantityFoil !== undefined) && !isOwnCollection && (
            <Box sx={{ mt: 0.5, display: 'flex', justifyContent: 'center', gap: 1 }}>
              {quantityReg !== undefined && (
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  {quantityReg}x Regular
                </Typography>
              )}
              {quantityFoil !== undefined && (
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  {quantityFoil}x Foil
                </Typography>
              )}
            </Box>
          )}
        </CardContent>
      )}
    </StyledCard>
  );
};

const CardItem = React.memo(CardItemComponent, (prevProps, nextProps) => {
  // Skip re-render if all relevant props are the same
  return (
    prevProps.id === nextProps.id &&
    prevProps.name === nextProps.name &&
    prevProps.quantityReg === nextProps.quantityReg &&
    prevProps.quantityFoil === nextProps.quantityFoil &&
    prevProps.isOwnCollection === nextProps.isOwnCollection &&
    prevProps.priceType === nextProps.priceType &&
    prevProps.isLoadingSkeleton === nextProps.isLoadingSkeleton &&
    // Deep compare display settings
    prevProps.display?.nameIsVisible === nextProps.display?.nameIsVisible &&
    prevProps.display?.setIsVisible === nextProps.display?.setIsVisible &&
    prevProps.display?.priceIsVisible === nextProps.display?.priceIsVisible &&
    prevProps.display?.quantityIsVisible === nextProps.display?.quantityIsVisible &&
    prevProps.display?.goalProgressIsVisible === nextProps.display?.goalProgressIsVisible &&
    // Compare prices if they're visible
    (!prevProps.display?.priceIsVisible ||
      (prevProps.market === nextProps.market &&
        prevProps.low === nextProps.low &&
        prevProps.average === nextProps.average &&
        prevProps.high === nextProps.high &&
        prevProps.foil === nextProps.foil)) &&
    // Compare goal progress if visible
    (!prevProps.display?.goalProgressIsVisible ||
      (prevProps.goalTargetQuantityReg === nextProps.goalTargetQuantityReg &&
        prevProps.goalTargetQuantityFoil === nextProps.goalTargetQuantityFoil &&
        prevProps.goalTargetQuantityAll === nextProps.goalTargetQuantityAll &&
        prevProps.goalRegMet === nextProps.goalRegMet &&
        prevProps.goalFoilMet === nextProps.goalFoilMet &&
        prevProps.goalAllMet === nextProps.goalAllMet &&
        prevProps.goalFullyMet === nextProps.goalFullyMet &&
        prevProps.goalRegNeeded === nextProps.goalRegNeeded &&
        prevProps.goalFoilNeeded === nextProps.goalFoilNeeded &&
        prevProps.goalAllNeeded === nextProps.goalAllNeeded))
  );
});

// Styled components
interface CardElementProps {
  setName?: string;
}

const StyledCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'setName',
})<CardElementProps>(({ theme, setName }) => ({
  height: '100%',
  width: '100%',
  maxWidth: '100%',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: theme.palette.background.paper,
  textAlign: 'center', // Ensure text is centered like original
  borderRadius: setName === 'Limited Edition Alpha' ? '7%' : '5%',
  overflow: 'hidden',
  boxShadow: theme.shadows[3],
  // Set as a container for container queries
  containerType: 'inline-size',
  containerName: 'card',

  // Add specific mobile constraints
  [theme.breakpoints.down('sm')]: {
    maxWidth: '100%',
    width: '100%',
  },
}));

const CardImageContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  paddingTop: '139.3%', // Aspect ratio of a magic card (680/488)
  overflow: 'hidden',

  // Add specific mobile constraint
  [theme.breakpoints.down('sm')]: {
    maxWidth: '100vw',
    width: '100%',
  },
}));

interface CardImageProps {
  setName?: string;
}

const CardImage = styled('img')<CardImageProps>(({ theme, setName }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  maxWidth: '100%',
  height: '100%',
  objectFit: 'contain',
  transition: 'opacity 0.7s ease-in-out',
  borderRadius: setName === 'Limited Edition Alpha' ? '7%' : '5%',

  // Add specific mobile constraints
  [theme.breakpoints.down('sm')]: {
    maxWidth: '100%',
    width: '100%',
  },
}));

const MissingImageFallback = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'setName',
})<CardElementProps>(({ theme, setName }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  maxWidth: '100%',
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
  boxSizing: 'border-box',
  overflow: 'hidden',
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

  // Match mobile constraints
  [theme.breakpoints.down('sm')]: {
    maxWidth: '100%',
    width: '100%',
  },
}));

export default CardItem;
