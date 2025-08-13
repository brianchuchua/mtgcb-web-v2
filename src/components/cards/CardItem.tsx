'use client';

import { Box, Card, CardContent, Chip, Skeleton, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import AddCardLocationsDialog from './AddCardLocationsDialog';
import CardLocationPills from './CardLocationPills';
import CardPrice from './CardPrice';
import { EditableCardQuantity } from './EditableCardQuantity';
import { GoalStatusDisplay } from './GoalStatusDisplay';
import { PriceType } from '@/types/pricing';
import { generateTCGPlayerLink } from '@/utils/affiliateLinkBuilder';
import { getCollectionSetUrl } from '@/utils/collectionUrls';

export interface CardItemProps {
  id: string;
  name: string;
  setCode?: string;
  setName?: string;
  setSlug?: string;
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
  // Card capabilities
  canBeFoil?: boolean;
  canBeNonFoil?: boolean;
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
  // Cross-set goal tracking fields
  goalMetByOtherSets?: boolean;
  goalContributingVersions?: {
    cardId: string;
    setId: string;
    setName?: string;
    quantityReg: number;
    quantityFoil: number;
  }[];
  // Location fields
  locations?: {
    locationId: number;
    locationName: string;
    description: string | null;
    quantityReg: number;
    quantityFoil: number;
  }[];
  display?: {
    nameIsVisible?: boolean;
    setIsVisible?: boolean;
    priceIsVisible?: boolean;
    quantityIsVisible?: boolean;
    goalProgressIsVisible?: boolean;
    locationsIsVisible?: boolean;
  };
  priceType?: PriceType; // Price type to display
  onClick?: () => void;
  isOwnCollection?: boolean;
  goalId?: string;
  imageLinksToTCGPlayer?: boolean; // New prop to enable TCGPlayer link on image
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
  canBeFoil,
  canBeNonFoil,
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
  goalMetByOtherSets,
  goalContributingVersions,
  locations,
  display = {
    nameIsVisible: true,
    setIsVisible: true,
    priceIsVisible: true,
    quantityIsVisible: false,
    goalProgressIsVisible: false,
    locationsIsVisible: true,
  },
  priceType = PriceType.Market,
  onClick,
  isOwnCollection = false,
  goalId,
  imageLinksToTCGPlayer = false,
}: CardItemProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const pathname = usePathname();

  const handleAddLocation = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (quantityReg || quantityFoil) {
      setLocationDialogOpen(true);
    }
  };

  const {
    nameIsVisible,
    setIsVisible,
    priceIsVisible,
    quantityIsVisible = false,
    goalProgressIsVisible = false,
    locationsIsVisible = true,
  } = display;

  // Check if we're in a collection view
  // Could be /collections/[userId] or /shared/[token]
  const isCollectionView = pathname?.startsWith('/collections/') || pathname?.startsWith('/shared/');
  
  // Extract userId for /collections/[userId] pattern
  const collectionMatch = pathname?.match(/^\/collections\/(\d+)/);
  const directUserId = collectionMatch ? collectionMatch[1] : null;
  
  // For shared URLs, get userId from sessionStorage (set by SharedCollectionPage)
  const sharedUserId = pathname?.startsWith('/shared/') ? sessionStorage.getItem('mtgcb_share_user') : null;
  
  // Use whichever userId is available
  const userId = directUserId || sharedUserId;

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
    return `https://r2.mtgcollectionbuilder.com/cards/images/normal/${id}.jpg?v=${process.env.NEXT_PUBLIC_IMAGE_CACHE_DATE || '20241220'}`;
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
      data-testid="card-item"
    >
      <CardImageContainer
        onClick={!imageLinksToTCGPlayer && onClick ? handleCardElementClick : undefined}
        sx={{
          cursor: imageLinksToTCGPlayer ? 'default' : onClick ? 'pointer' : 'default',
          opacity: goalProgressIsVisible && goalFullyMet === false ? 0.5 : 1,
          transition: 'opacity 0.2s ease-in-out',
          position: 'relative',
          '&:hover': {
            opacity: 1,
          },
          // Add diagonal stripes overlay for incomplete goals
          ...(goalProgressIsVisible &&
            goalFullyMet === false && {
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
                  rgba(255, 152, 0, 0.2) 10px,
                  rgba(255, 152, 0, 0.2) 20px
                )`,
                pointerEvents: 'none',
                borderRadius: 'inherit',
                transition: 'opacity 0.2s ease-in-out',
              },
              '&:hover::after': {
                opacity: 0,
              },
            }),
        }}
      >
        {imageLinksToTCGPlayer ? (
          <Box
            component="a"
            href={getTCGPlayerLink()}
            target="_blank"
            rel="noreferrer"
            title={`${name} - Buy on TCGPlayer`}
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
                alt={`${name} - Buy on TCGPlayer`}
                title={`${name} - Buy on TCGPlayer`}
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
          </Box>
        ) : (
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
          </>
        )}
      </CardImageContainer>

      {(nameIsVisible || setIsVisible || priceIsVisible || quantityIsVisible || goalProgressIsVisible) && (
        <CardContent
          sx={{
            p: 1,
            '&:last-child': { pb: 1 },
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
          }}
        >
          {quantityIsVisible && (quantityReg !== undefined || quantityFoil !== undefined) && isOwnCollection && (
            <Box sx={{ mb: 1 }}>
              <EditableCardQuantity
                cardId={parseInt(id)}
                cardName={name}
                quantityReg={quantityReg || 0}
                quantityFoil={quantityFoil || 0}
                canBeFoil={canBeFoil}
                canBeNonFoil={canBeNonFoil}
              />
            </Box>
          )}

          {goalProgressIsVisible && (goalTargetQuantityReg || goalTargetQuantityFoil || goalTargetQuantityAll) && (
            <Box sx={{ mt: -0.5, mb: 0.5, display: 'flex', justifyContent: 'center' }}>
              <GoalStatusDisplay
                card={
                  {
                    id,
                    name,
                    goalTargetQuantityReg,
                    goalTargetQuantityFoil,
                    goalTargetQuantityAll,
                    goalRegNeeded,
                    goalFoilNeeded,
                    goalAllNeeded,
                    goalFullyMet,
                    goalMetByOtherSets,
                    goalContributingVersions,
                  } as any
                }
              />
            </Box>
          )}

          {nameIsVisible && (
            <Typography
              variant="h6"
              noWrap
              title={name}
              onClick={onClick ? handleCardElementClick : undefined}
              data-testid="card-name"
              sx={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100%',
                cursor: onClick ? 'pointer' : 'default',
                '&:hover': {
                  textDecoration: onClick ? 'underline' : 'none',
                },
                fontSize: '1.25rem',
                '@container card (max-width: 300px)': {
                  fontSize: '1.125rem',
                },
                '@container card (max-width: 250px)': {
                  fontSize: '1rem',
                },
                '@container card (max-width: 200px)': {
                  fontSize: '0.875rem',
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
                fontSize: '0.875rem',
                '@container card (max-width: 300px)': {
                  fontSize: '0.8125rem',
                },
                '@container card (max-width: 250px)': {
                  fontSize: '0.75rem',
                },
                '@container card (max-width: 200px)': {
                  fontSize: '0.6875rem',
                },
              }}
            >
              {setName && setSlug ? (
                <Link
                  href={isCollectionView && userId ? getCollectionSetUrl(parseInt(userId), setSlug, goalId) : `/browse/sets/${setSlug}`}
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
              <CardPrice prices={priceData} isLoading={false} priceType={priceType} />
            </Box>
          )}

          {quantityIsVisible && locationsIsVisible && (
            <Box sx={{ mt: 1 }}>
              {locations && locations.length > 0 ? (
                <CardLocationPills
                  cardId={parseInt(id)}
                  cardName={name}
                  setName={setName}
                  totalQuantityReg={quantityReg || 0}
                  totalQuantityFoil={quantityFoil || 0}
                  canBeFoil={canBeFoil}
                  canBeNonFoil={canBeNonFoil}
                  locations={locations}
                  align="center"
                  onAddLocation={isOwnCollection ? handleAddLocation : undefined}
                  isOwnCollection={isOwnCollection}
                />
              ) : (
                isOwnCollection && (quantityReg || quantityFoil) ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Chip
                      label="Add card to location"
                      onClick={handleAddLocation}
                      size="small"
                      sx={{
                        cursor: 'pointer',
                        color: 'text.secondary',
                        borderColor: 'divider',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                          borderColor: 'text.secondary',
                        },
                      }}
                      variant="outlined"
                    />
                  </Box>
                ) : null
              )}
            </Box>
          )}

          {quantityIsVisible && (quantityReg !== undefined || quantityFoil !== undefined) && !isOwnCollection && (
            <Box sx={{ mt: 0.5, display: 'flex', justifyContent: 'center', gap: 1 }}>
              {quantityReg !== undefined && (
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 'medium',
                    fontSize: '0.875rem',
                    '@container card (max-width: 250px)': {
                      fontSize: '0.8125rem',
                    },
                    '@container card (max-width: 200px)': {
                      fontSize: '0.75rem',
                    },
                  }}
                >
                  {quantityReg}x Regular
                </Typography>
              )}
              {quantityFoil !== undefined && (
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 'medium',
                    fontSize: '0.875rem',
                    '@container card (max-width: 250px)': {
                      fontSize: '0.8125rem',
                    },
                    '@container card (max-width: 200px)': {
                      fontSize: '0.75rem',
                    },
                  }}
                >
                  {quantityFoil}x Foil
                </Typography>
              )}
            </Box>
          )}
        </CardContent>
      )}

      {locationDialogOpen && (
        <AddCardLocationsDialog
          open={locationDialogOpen}
          onClose={() => setLocationDialogOpen(false)}
          cardId={parseInt(id)}
          cardName={name}
          setName={setName}
          totalQuantityReg={quantityReg || 0}
          totalQuantityFoil={quantityFoil || 0}
          canBeFoil={canBeFoil}
          canBeNonFoil={canBeNonFoil}
        />
      )}
    </StyledCard>
  );
};

const CardItem = React.memo(CardItemComponent, (prevProps, nextProps) => {
  // Skip re-render if all relevant props are the same

  // Compare locations array if locations are visible
  const locationsEqual =
    !prevProps.display?.locationsIsVisible ||
    JSON.stringify(prevProps.locations) === JSON.stringify(nextProps.locations);

  return (
    prevProps.id === nextProps.id &&
    prevProps.name === nextProps.name &&
    prevProps.quantityReg === nextProps.quantityReg &&
    prevProps.quantityFoil === nextProps.quantityFoil &&
    prevProps.isOwnCollection === nextProps.isOwnCollection &&
    prevProps.priceType === nextProps.priceType &&
    locationsEqual &&
    // Deep compare display settings
    prevProps.display?.nameIsVisible === nextProps.display?.nameIsVisible &&
    prevProps.display?.setIsVisible === nextProps.display?.setIsVisible &&
    prevProps.display?.priceIsVisible === nextProps.display?.priceIsVisible &&
    prevProps.display?.quantityIsVisible === nextProps.display?.quantityIsVisible &&
    prevProps.display?.goalProgressIsVisible === nextProps.display?.goalProgressIsVisible &&
    prevProps.display?.locationsIsVisible === nextProps.display?.locationsIsVisible &&
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
