'use client';

import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { useEffect, useState } from 'react';
import { Virtuoso, VirtuosoGrid } from 'react-virtuoso';
import CardItem, { CardItemProps } from './CardItem';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { usePriceType } from '@/hooks/usePriceType';
import { PriceType } from '@/types/pricing';

export interface CardGalleryProps {
  cards: CardItemProps[];
  isLoading?: boolean;
  cardsPerRow?: number;
  galleryWidth?: number;
  onCardClick?: (cardId: string) => void;
  displaySettings?: {
    nameIsVisible?: boolean;
    setIsVisible?: boolean;
    priceIsVisible?: boolean;
  };
}

/**
 * A virtualized, responsive card gallery component
 * Efficiently renders a large number of cards with lazy loading
 */
const CardGallery = React.memo(
  ({
    cards,
    isLoading = false,
    cardsPerRow = 4,
    galleryWidth = 95,
    onCardClick,
    displaySettings,
  }: CardGalleryProps) => {
    const [isHydrated, setIsHydrated] = useState(false);

    const [nameIsVisible, setNameIsVisible] = useLocalStorage('cardNameIsVisible', true);
    const [setIsVisible, setSetIsVisible] = useLocalStorage('cardSetIsVisible', true);
    const [priceIsVisible, setPriceIsVisible] = useLocalStorage('cardPriceIsVisible', true);
    const [cardSizeMargin] = useLocalStorage('cardSizeMargin', 0); // Get card size margin setting

    const currentPriceType = usePriceType();

    // Mark when hydration is complete (localStorage values loaded)
    useEffect(() => {
      setIsHydrated(true);
    }, []);

    // Use either provided display settings or localStorage values
    const display = {
      nameIsVisible:
        displaySettings?.nameIsVisible !== undefined
          ? displaySettings.nameIsVisible
          : nameIsVisible,
      setIsVisible:
        displaySettings?.setIsVisible !== undefined ? displaySettings.setIsVisible : setIsVisible,
      priceIsVisible:
        displaySettings?.priceIsVisible !== undefined
          ? displaySettings.priceIsVisible
          : priceIsVisible,
    };

    // Only show "No cards found" when not loading and actually have no cards
    if (!isLoading && cards && cards.length === 0) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <Typography variant="h6">No cards found</Typography>
        </Box>
      );
    }

    // Calculate horizontal padding based on the card size margin setting
    const horizontalPadding = cardSizeMargin;

    // If we're not yet hydrated (localStorage values not loaded), show a loading placeholder to prevent side padding shift
    if (!isHydrated) {
      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            width: '100%',
            opacity: 0.5,
          }}
        ></Box>
      );
    }

    // Handle card click
    const handleCardClick = (id: string) => {
      if (onCardClick) {
        onCardClick(id);
      }
    };

    // Item content renderer for the Virtuoso component
    const itemContent = (index: number) => {
      const card = cards[index];
      return (
        <CardItem
          {...card}
          onClick={onCardClick ? () => handleCardClick(card.id) : undefined}
          display={display}
          priceType={currentPriceType}
        />
      );
    };

    return (
      <CardGalleryWrapper
        cardsPerRow={cardsPerRow}
        galleryWidth={galleryWidth}
        horizontalPadding={horizontalPadding}
      >
        <VirtuosoGrid
          useWindowScroll // Use window scroll instead of creating a scrollable container
          totalCount={cards.length}
          components={{
            Item: CardItemWrapper,
          }}
          itemContent={itemContent}
          listClassName="card-gallery-grid"
          increaseViewportBy={600} // Pre-render items this many pixels outside the viewport
          computeItemKey={(index) => cards[index]?.id || index} // Use card ID as stable key
        />
      </CardGalleryWrapper>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function for memo
    // Only re-render if these props have changed
    return (
      prevProps.isLoading === nextProps.isLoading &&
      prevProps.cardsPerRow === nextProps.cardsPerRow &&
      prevProps.galleryWidth === nextProps.galleryWidth &&
      prevProps.onCardClick === nextProps.onCardClick &&
      prevProps.cards === nextProps.cards
    );
  },
);

CardGallery.displayName = 'CardGallery';

interface CardGalleryWrapperProps {
  cardsPerRow: number;
  galleryWidth: number;
  horizontalPadding: number;
}

const CardGalleryWrapper = styled(Box, {
  shouldForwardProp: (prop) =>
    prop !== 'cardsPerRow' && prop !== 'galleryWidth' && prop !== 'horizontalPadding',
})<CardGalleryWrapperProps>(({ theme, cardsPerRow, galleryWidth, horizontalPadding }) => ({
  width: `${galleryWidth}%`,
  margin: '0 auto',
  padding: theme.spacing(2),
  paddingLeft: `${horizontalPadding}%`,
  paddingRight: `${horizontalPadding}%`,
  minHeight: '50vh', // Ensure there's enough room for virtuoso

  // Style for the card grid container - used by VirtuosoGrid
  '& .card-gallery-grid': {
    display: 'grid',
    gridTemplateColumns: `repeat(${cardsPerRow}, minmax(0, 1fr))`,
    gap: theme.spacing(2), // Match original spacing
    width: '100%',
    padding: theme.spacing(0.5),
  },

  // Additional styles for Virtuoso
  '& .virtuoso-grid-list': {
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    width: '100%',
  },

  // Fix item padding
  '& .virtuoso-grid-item': {
    padding: 0,
    margin: 0,
  },
  [theme.breakpoints.down('sm')]: {
    width: '100%',
    maxWidth: '100vw',
    padding: theme.spacing(1),
    boxSizing: 'border-box',
    '& .card-gallery-grid': {
      gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
      gap: theme.spacing(2),
    },
  },
}));

const CardItemWrapper = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  boxSizing: 'border-box',

  // No additional margin/padding here - let the grid handle spacing
  // This ensures that we match the original layout more closely

  [theme.breakpoints.down('sm')]: {
    boxSizing: 'border-box',
  },
}));

export default CardGallery;
