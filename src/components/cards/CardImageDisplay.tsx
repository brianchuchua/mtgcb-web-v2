import { Box, Paper, Skeleton, Typography } from '@mui/material';
import CachedIcon from '@mui/icons-material/Cached';
import React, { MouseEvent, useState, useMemo } from 'react';
import { generateTCGPlayerLink } from '@/utils/affiliateLinkBuilder';
import { BuyOptionsMenu } from './BuyOptionsMenu';

interface CardImageDisplayProps {
  cardId: string;
  cardName?: string;
  setName?: string;
  tcgplayerId?: number | string;
  /**
   * If true, the entire card image becomes a direct anchor to TCGPlayer (legacy behavior
   * — used by callers that want a one-click route to TCG without the buy menu).
   */
  linkToTCGPlayer?: boolean;
  /**
   * If true (and linkToTCGPlayer is false), clicking the image opens a buy-options menu
   * with TCGPlayer + Card Kingdom entries (the same items the price-link menu shows).
   * Used on the card detail page where we don't want one source to have visual priority
   * over the other.
   */
  showBuyMenuOnClick?: boolean;
  /**
   * If true and `showBuyMenuOnClick` is on, the menu omits the "View Card Page" item
   * (the user is already on the detail page so it'd be a no-op).
   */
  hideViewCardOption?: boolean;
  /**
   * Per-finish TCG price availability. When both are true, the menu splits into
   * "Buy on TCGPlayer (Regular)" + "(Foil)" items; otherwise it shows a single TCG item.
   */
  tcgHasRegular?: boolean;
  tcgHasFoil?: boolean;
  cardKingdomUrl?: string | null;
  cardKingdomFoilUrl?: string | null;
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
  /**
   * Truthy when the card has a back-face image at R2's `{cardId}b.jpg`. When set, a small
   * flip-card button overlays the image and toggles between front and back face.
   */
  backScryfallId?: string | null;
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
  showBuyMenuOnClick = false,
  hideViewCardOption = false,
  tcgHasRegular,
  tcgHasFoil,
  cardKingdomUrl = null,
  cardKingdomFoilUrl = null,
  width = { xs: '100%' },
  maxWidth = { xs: 300, sm: 400 },
  backScryfallId,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  // Back image is only requested on first flip — avoids fetching `{id}b.jpg` for cards
  // the user never inspects. Once mounted, it stays so subsequent flips are instant.
  const [backRequested, setBackRequested] = useState(false);
  const [backImageLoaded, setBackImageLoaded] = useState(false);
  const [backImageError, setBackImageError] = useState(false);
  const menuOpen = Boolean(menuAnchorEl);
  const hasBackFace = Boolean(backScryfallId);

  const imageUrl = useMemo(() => {
    if (!cardId) return null;
    return `https://r2.mtgcollectionbuilder.com/cards/images/normal/${cardId}.jpg?v=${
      process.env.NEXT_PUBLIC_IMAGE_CACHE_DATE || '20241220'
    }`;
  }, [cardId]);
  const backImageUrl = useMemo(() => {
    if (!cardId) return null;
    return `https://r2.mtgcollectionbuilder.com/cards/images/normal/${cardId}b.jpg?v=${
      process.env.NEXT_PUBLIC_IMAGE_CACHE_DATE || '20241220'
    }`;
  }, [cardId]);

  const handleFlipCard = (event: MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setBackRequested(true);
    setIsFlipped((prev) => !prev);
  };

  const borderRadius = useMemo(() => getBorderRadius(setName), [setName]);
  const tcgPlayerLink = useMemo(() => {
    if (!linkToTCGPlayer) return null;
    return generateTCGPlayerLink(tcgplayerId, cardName);
  }, [linkToTCGPlayer, tcgplayerId, cardName]);

  // Buy-menu mode is mutually exclusive with linkToTCGPlayer; the latter wins to
  // preserve legacy behavior for callers that still want a direct TCG anchor.
  const buyMenuActive = showBuyMenuOnClick && !linkToTCGPlayer;

  const handleImageClick = (event: MouseEvent<HTMLElement>) => {
    if (!buyMenuActive) return;
    event.preventDefault();
    setMenuAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => setMenuAnchorEl(null);

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
          data-testid="card-image"
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

  const containerBox = (
    <Box
      data-testid="card-image-container"
      sx={{
        position: 'relative',
        width,
        maxWidth,
        margin: '0 auto',
        aspectRatio: '488/680',
        borderRadius,
        overflow: 'hidden',
        boxShadow: 3,
        // 3D context for the flip. `perspective` only affects direct descendants, so the
        // rotating wrapper inherits a real 3D space and the flip doesn't flatten.
        perspective: '1400px',
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
      ) : buyMenuActive ? (
        <Box
          onClick={handleImageClick}
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
          {imageContent}
        </Box>
      ) : (
        imageContent
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
                  borderRadius,
                  backgroundColor: '#22262c',
                }}
              />
            )}
            {backRequested && backImageUrl && !backImageError ? (
              <Box
                component="img"
                src={backImageUrl}
                alt={`${cardName || 'Card'} (back face)`}
                loading="lazy"
                onLoad={() => setBackImageLoaded(true)}
                onError={() => setBackImageError(true)}
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  opacity: backImageLoaded ? 1 : 0,
                  transition: 'opacity 0.4s ease-in-out',
                  borderRadius,
                }}
              />
            ) : backImageError ? (
              <Paper
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'grey.100',
                  borderRadius,
                  textAlign: 'center',
                  p: 2,
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Back face not available
                </Typography>
              </Paper>
            ) : null}
          </Box>
        )}
      </Box>
      {hasBackFace && !imageError && (
        <Box
          component="button"
          type="button"
          onClick={handleFlipCard}
          aria-label={isFlipped ? `Show front of ${cardName || 'card'}` : `Show back of ${cardName || 'card'}`}
          title={isFlipped ? 'Show front face' : 'Show back face'}
          data-testid="card-flip-button"
          sx={{
            position: 'absolute',
            top: '12%',
            right: '6%',
            zIndex: 2,
            width: 36,
            height: 36,
            minWidth: 36,
            minHeight: 36,
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
              fontSize: 20,
              transition: 'transform 0.25s ease-in-out',
              transform: isFlipped ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        </Box>
      )}
    </Box>
  );

  if (!buyMenuActive) {
    return containerBox;
  }

  return (
    <>
      {containerBox}
      <BuyOptionsMenu
        anchorEl={menuAnchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        cardId={cardId}
        cardName={cardName}
        tcgplayerId={tcgplayerId}
        tcgHasRegular={tcgHasRegular}
        tcgHasFoil={tcgHasFoil}
        cardKingdomUrl={cardKingdomUrl}
        cardKingdomFoilUrl={cardKingdomFoilUrl}
        hideViewCardOption={hideViewCardOption}
      />
    </>
  );
};
