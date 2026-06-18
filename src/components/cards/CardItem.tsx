'use client';

import { alpha, Box, Button, Card, CardContent, Chip, Popover, Skeleton, Theme, Typography } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CachedIcon from '@mui/icons-material/Cached';
import { styled } from '@mui/material/styles';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { MouseEvent, useEffect, useRef, useState } from 'react';
import AddCardLocationsDialog from './AddCardLocationsDialog';
import { BuyOptionsMenu } from './BuyOptionsMenu';
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
  // Card Kingdom buy-link inputs (optional). When present, the buy menu adds a
  // "Buy on Card Kingdom" item alongside the existing TCGPlayer item.
  cardKingdomUrl?: string | null;
  cardKingdomFoilUrl?: string | null;
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
  href?: string; // For Link-based navigation (makes image/name right-clickable)
  isOwnCollection?: boolean;
  goalId?: string;
  imageLinksToTCGPlayer?: boolean; // New prop to enable TCGPlayer link on image
  /**
   * If true (and imageLinksToTCGPlayer is false), clicking the image opens a buy-options
   * menu with TCGPlayer + Card Kingdom entries — used on the card detail page where we
   * don't want one source to have visual priority.
   */
  imageOpensBuyMenu?: boolean;
  /** Hides the "View Card Page" item on the buy menu (detail-page usage). */
  hideViewCardOption?: boolean;
  directPriceToTCGPlayer?: boolean; // If true, clicking price goes directly to TCGPlayer (no menu)
  hasLocations?: boolean; // Whether the user has any locations created
  /**
   * If true, the card has been deprecated. The API only returns deprecated cards to a viewer
   * who owns a nonzero quantity, so this implicitly only appears on owned-but-deprecated cards.
   */
  deprecated?: boolean;
  /**
   * Truthy when the card has a back-face image at R2's `{cardId}b.jpg` (DSTs, transform,
   * modal DFC, reversible_card, etc.). When set, a flip-card button overlays the image.
   */
  backScryfallId?: string | null;
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
  cardKingdomUrl,
  cardKingdomFoilUrl,
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
  href,
  isOwnCollection = false,
  goalId,
  imageLinksToTCGPlayer = false,
  imageOpensBuyMenu = false,
  hideViewCardOption = false,
  directPriceToTCGPlayer = false,
  hasLocations = false,
  deprecated = false,
  backScryfallId,
}: CardItemProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const hasBackFace = Boolean(backScryfallId);
  // Back image is only requested on first flip — avoids bandwidth on grids of DFCs the
  // user never inspects. Once mounted, it stays so subsequent flips are instant.
  const [backRequested, setBackRequested] = useState(false);
  const [backImageLoaded, setBackImageLoaded] = useState(false);
  const [backImageError, setBackImageError] = useState(false);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [buyMenuAnchorEl, setBuyMenuAnchorEl] = useState<HTMLElement | null>(null);
  const buyMenuOpen = Boolean(buyMenuAnchorEl);
  const imageRef = useRef<HTMLImageElement>(null);
  const pathname = usePathname();
  // Buy-menu mode is mutually exclusive with imageLinksToTCGPlayer; the latter wins to
  // preserve the legacy direct-link behavior for callers that still want it.
  const buyMenuActive = imageOpensBuyMenu && !imageLinksToTCGPlayer;
  const handleImageBuyMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    if (!buyMenuActive) return;
    event.preventDefault();
    event.stopPropagation();
    setBuyMenuAnchorEl(event.currentTarget);
  };
  const handleBuyMenuClose = () => setBuyMenuAnchorEl(null);
  // Per-finish TCG price availability for the BuyOptionsMenu split.
  const hasNormalTcgPrice = Boolean(
    prices?.normal &&
      (prices.normal.market != null ||
        prices.normal.low != null ||
        prices.normal.average != null ||
        prices.normal.high != null),
  );
  const hasFoilTcgPrice = Boolean(
    prices?.foil &&
      (prices.foil.market != null ||
        prices.foil.low != null ||
        prices.foil.average != null ||
        prices.foil.high != null),
  );

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
  const getBackImageUrl = () => {
    return `https://r2.mtgcollectionbuilder.com/cards/images/normal/${id}b.jpg?v=${process.env.NEXT_PUBLIC_IMAGE_CACHE_DATE || '20241220'}`;
  };

  const handleFlipCard = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setBackRequested(true);
    setIsFlipped((prev) => !prev);
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
        onClick={!imageLinksToTCGPlayer && !href && onClick ? handleCardElementClick : undefined}
        sx={{
          cursor: imageLinksToTCGPlayer ? 'default' : (href || onClick) ? 'pointer' : 'default',
          opacity: goalProgressIsVisible && goalFullyMet === false ? 0.5 : 1,
          transition: 'opacity 0.2s ease-in-out',
          position: 'relative',
          // 3D context for the card-flip animation. `perspective` only affects direct
          // descendants, so the rotating wrapper inherits a real 3D space and the flip
          // doesn't collapse into a 2D scale-skew.
          perspective: '1200px',
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
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            transformStyle: 'preserve-3d',
            transition: 'transform 0.55s cubic-bezier(.4, 0, .2, 1)',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            willChange: 'transform',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
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
        ) : buyMenuActive ? (
          <Box
            onClick={handleImageBuyMenuOpen}
            data-testid="card-image-buy-menu-trigger"
            sx={{
              display: 'block',
              width: '100%',
              height: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
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
          </Box>
        ) : href ? (
          <Link
            href={href}
            style={{
              display: 'block',
              width: '100%',
              height: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
              textDecoration: 'none',
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
          </Link>
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
          </Box>
          {hasBackFace && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              {backRequested && !backImageLoaded && !backImageError && (
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
              {backRequested && !backImageError ? (
                <CardImage
                  src={getBackImageUrl()}
                  loading="lazy"
                  alt={`${name} (back face)`}
                  title={`${name} (back face)`}
                  setName={setName}
                  onLoad={() => setBackImageLoaded(true)}
                  onError={() => setBackImageError(true)}
                  style={{ opacity: backImageLoaded ? 1 : 0 }}
                />
              ) : backImageError ? (
                <MissingImageFallback setName={setName}>
                  <Typography variant="subtitle2">{name}</Typography>
                  <Typography variant="caption">Back face not available</Typography>
                </MissingImageFallback>
              ) : null}
            </Box>
          )}
        </Box>
        {hasBackFace && !imageError && (
          <Box
            component="button"
            type="button"
            onClick={handleFlipCard}
            aria-label={isFlipped ? `Show front of ${name}` : `Show back of ${name}`}
            title={isFlipped ? 'Show front face' : 'Show back face'}
            data-testid="card-flip-button"
            sx={{
              position: 'absolute',
              top: '12%',
              right: '6%',
              zIndex: 2,
              width: 32,
              height: 32,
              minWidth: 32,
              minHeight: 32,
              borderRadius: '50%',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              backgroundColor: 'rgba(0, 0, 0, 0.55)',
              backdropFilter: 'blur(2px)',
              transition: 'background-color 0.15s ease-in-out, transform 0.15s ease-in-out',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                transform: 'scale(1.08)',
              },
              '&:focus-visible': {
                outline: '2px solid #ffffff',
                outlineOffset: 2,
              },
            }}
          >
            <CachedIcon
              sx={{
                fontSize: 18,
                transition: 'transform 0.25s ease-in-out',
                transform: isFlipped ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            />
          </Box>
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
          {quantityIsVisible && (quantityReg !== undefined || quantityFoil !== undefined) && (
            <Box sx={{ mb: 1 }}>
              <EditableCardQuantity
                cardId={parseInt(id)}
                cardName={name}
                quantityReg={quantityReg || 0}
                quantityFoil={quantityFoil || 0}
                canBeFoil={canBeFoil}
                canBeNonFoil={canBeNonFoil}
                readOnly={!isOwnCollection}
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
            href ? (
              <Link href={href} style={{ textDecoration: 'none', color: 'inherit' }}>
                <Typography
                  variant="h6"
                  noWrap
                  title={name}
                  data-testid="card-name"
                  sx={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%',
                    cursor: 'pointer',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                    fontSize: '1.25rem',
                    '@container card (max-width: 300px)': {
                      fontSize: '1.125rem',
                    },
                    '@container card (max-width: 250px)': {
                      fontSize: '1.0625rem',
                    },
                    '@container card (max-width: 200px)': {
                      fontSize: '1rem',
                    },
                  }}
                >
                  {name}
                </Typography>
              </Link>
            ) : (
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
                    fontSize: '1.0625rem',
                  },
                  '@container card (max-width: 200px)': {
                    fontSize: '1rem',
                  },
                }}
              >
                {name}
              </Typography>
            )
          )}

          {deprecated && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.5 }}>
              <DeprecatedChipWithInfo userId={userId} cardId={id} />
            </Box>
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
                  fontSize: '0.8125rem',
                },
                '@container card (max-width: 200px)': {
                  fontSize: '0.8125rem',
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
            <Box sx={{ mt: 0.5 }}>
              <CardPrice
                prices={priceData}
                isLoading={false}
                priceType={priceType}
                cardId={id}
                cardName={name}
                tcgplayerId={tcgplayerId}
                directToTCGPlayer={directPriceToTCGPlayer}
                cardKingdomUrl={cardKingdomUrl}
                cardKingdomFoilUrl={cardKingdomFoilUrl}
                hideViewCardOption={hideViewCardOption}
              />
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
                isOwnCollection && (quantityReg || quantityFoil) && hasLocations ? (
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
      {buyMenuActive && (
        <BuyOptionsMenu
          anchorEl={buyMenuAnchorEl}
          open={buyMenuOpen}
          onClose={handleBuyMenuClose}
          cardId={id}
          cardName={name}
          tcgplayerId={tcgplayerId}
          tcgHasRegular={hasNormalTcgPrice}
          tcgHasFoil={hasFoilTcgPrice}
          cardKingdomUrl={cardKingdomUrl}
          cardKingdomFoilUrl={cardKingdomFoilUrl}
          hideViewCardOption={hideViewCardOption}
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

interface DeprecatedChipWithInfoProps {
  /** Used to build a /collections/[userId]/migrate link in the popover. Null on shared
   *  collection views where we don't expose the migration tool to non-owners. */
  userId: string | null;
  /** The card this chip is rendered for. Threaded into the migrate link as ?cardId so
   *  the migrate page deep-links straight to this card instead of starting at the top
   *  of the user's deprecated list. */
  cardId: string;
}

/**
 * Subtle "card data update available" indicator for card boxes in the collection view.
 *
 * Mirrors the dot+letterspaced-label pattern from CardLegalitySection.tsx and the
 * migrate page's ResolutionStatus — a small warning-colored dot with a soft halo plus
 * uppercase letterspaced "UPDATE AVAILABLE" label, ending in a small inline ⓘ icon.
 * The whole strip is clickable; click opens a Popover explaining the update and
 * (for owners) linking to the update tool.
 *
 * Avoids the MUI Chip look, which read as too heavy on the otherwise-clean card box.
 * Component name retains "Deprecated" since that's the DB column it surfaces, but no
 * user-facing string uses that word.
 */
function DeprecatedChipWithInfo({ userId, cardId }: DeprecatedChipWithInfoProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const handleOpen = (event: MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => setAnchorEl(null);
  // Stop click events inside the popover from bubbling up to the parent card's onClick
  // (which would navigate away from the collection page mid-read).
  const stopPropagation = (event: MouseEvent<HTMLElement>) => event.stopPropagation();

  const warningColor = (theme: Theme) => theme.palette.warning.main;

  return (
    <>
      <Box
        component="button"
        type="button"
        onClick={handleOpen}
        aria-label="Card data update available. Click for details."
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.625,
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          // Soft pill-shaped hit area gives a subtle hover affordance without a heavy chip.
          borderRadius: '999px',
          px: 0.5,
          py: 0.25,
          transition: 'background-color 0.15s',
          '&:hover': (theme) => ({
            backgroundColor: alpha(theme.palette.warning.main, 0.08),
          }),
        }}
      >
        <Box
          sx={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            bgcolor: warningColor,
            boxShadow: (theme) => `0 0 0 2px ${alpha(theme.palette.warning.main, 0.18)}`,
          }}
        />
        <Typography
          component="span"
          sx={{
            color: warningColor,
            fontWeight: 600,
            fontSize: '0.6875rem',
            letterSpacing: 0.6,
            textTransform: 'uppercase',
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
          }}
        >
          Update Available
        </Typography>
        <InfoOutlinedIcon sx={{ fontSize: 13, color: warningColor }} />
      </Box>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        onClick={stopPropagation}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Box sx={{ p: 2, maxWidth: 320 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
            Card data update available
          </Typography>
          <Typography variant="body2" sx={{ mb: 1.5 }}>
            There&apos;s an update for this card entry — usually a corrected double-sided
            token product, fresher pricing data, or improved face data. Your copies
            here don&apos;t count toward your value, collection percentage, or goal
            progress until you apply the update.
          </Typography>
          {userId ? (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <Button
                component={Link}
                href={`/collections/${userId}/migrate?cardId=${cardId}`}
                color="warning"
                variant="outlined"
                size="small"
                onClick={stopPropagation}
                sx={{ whiteSpace: 'nowrap' }}
              >
                Update
              </Button>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Sign in as the owner of this collection to apply card updates.
            </Typography>
          )}
        </Box>
      </Popover>
    </>
  );
}

export default CardItem;
