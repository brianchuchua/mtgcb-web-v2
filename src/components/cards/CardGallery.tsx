'use client';

import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import CardItem, { CardItemProps } from './CardItem';

export interface CardGalleryProps {
  /**
   * Array of cards to display in the gallery
   */
  cards: CardItemProps[];

  /**
   * Loading state
   */
  isLoading?: boolean;

  /**
   * Number of cards per row
   */
  cardsPerRow?: number;

  /**
   * Gallery width as percentage of container
   */
  galleryWidth?: number;

  /**
   * Callback when a card is clicked
   */
  onCardClick?: (cardId: string) => void;
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
    galleryWidth = 100,
    onCardClick,
  }: CardGalleryProps) => {
    const observerRef = useRef<IntersectionObserver | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    // Initialize visibility state with first few cards visible for initial render
    const [visibleItems, setVisibleItems] = useState<Record<string, boolean>>(() => {
      const initial: Record<string, boolean> = {};
      // Pre-mark the first 8 cards as visible (first two rows on desktop)
      cards.slice(0, 8).forEach((card) => {
        initial[card.id] = true;
      });
      return initial;
    });

    const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

    // Setup intersection observer to track which items are visible
    useEffect(() => {
      if (typeof window === 'undefined') return;

      // Cleanup previous observer
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      // Create new observer with a more optimized callback
      observerRef.current = new IntersectionObserver(
        (entries) => {
          // Batch state updates for better performance
          setVisibleItems((prevVisibility) => {
            const newVisibility = { ...prevVisibility };
            let hasChanges = false;

            entries.forEach((entry) => {
              const id = entry.target.getAttribute('data-id');
              if (id && newVisibility[id] !== entry.isIntersecting) {
                newVisibility[id] = entry.isIntersecting;
                hasChanges = true;
              }
            });

            return hasChanges ? newVisibility : prevVisibility;
          });
        },
        {
          root: null,
          rootMargin: '500px 0px', // Large margin to preload items well before they're visible
          threshold: 0.01, // Trigger when just 1% of element is visible
        },
      );

      // Reset refs and re-observe all items to ensure fresh detection
      itemRefs.current = {};

      // Add a small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        const elements = document.querySelectorAll('[data-id]');
        elements.forEach((el) => {
          const id = el.getAttribute('data-id');
          if (id && observerRef.current) {
            itemRefs.current[id] = el as HTMLDivElement;
            observerRef.current.observe(el);
          }
        });
      }, 50);

      return () => {
        clearTimeout(timer);
        if (observerRef.current) {
          observerRef.current.disconnect();
        }
      };
    }, [cards]); // Only re-run when cards change

    // Create refs for all cards with memoized callback
    const setItemRef = useCallback((id: string, element: HTMLDivElement | null) => {
      // Only update if the reference changed
      if (itemRefs.current[id] !== element) {
        // Clean up old observer if element is null
        if (!element && itemRefs.current[id] && observerRef.current) {
          observerRef.current.unobserve(itemRefs.current[id]!);
        }

        // Update ref
        itemRefs.current[id] = element;

        // Observe new element
        if (element && observerRef.current) {
          observerRef.current.observe(element);
        }
      }
    }, []);

    // Properly check if a card should be visible
    const isVisible = useCallback(
      (id: string) => {
        // Show cards that are marked as visible by the IntersectionObserver
        return !!visibleItems[id];
      },
      [visibleItems],
    );

    // Handle card click
    const handleCardClick = useCallback(
      (id: string) => {
        if (onCardClick) {
          onCardClick(id);
        }
      },
      [onCardClick],
    );

    // Only show "No cards found" when not loading and actually have no cards
    if (!isLoading && (!cards || cards.length === 0)) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <Typography variant="h6">No cards found</Typography>
        </Box>
      );
    }

    return (
      <CardGalleryWrapper ref={containerRef} cardsPerRow={cardsPerRow} galleryWidth={galleryWidth}>
        {cards.map((card) => (
          <CardItemWrapper
            key={card.id}
            data-id={card.id}
            ref={(element: HTMLDivElement | null) => setItemRef(card.id, element)}
          >
            {isVisible(card.id) ? (
              <CardItem
                {...card}
                onClick={onCardClick ? () => handleCardClick(card.id) : undefined}
              />
            ) : (
              <CardPlaceholder />
            )}
          </CardItemWrapper>
        ))}
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

// Styled components
interface CardGalleryWrapperProps {
  cardsPerRow: number;
  galleryWidth: number;
}

const CardGalleryWrapper = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'cardsPerRow' && prop !== 'galleryWidth',
})<CardGalleryWrapperProps>(({ theme, cardsPerRow, galleryWidth }) => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${cardsPerRow}, minmax(0, 1fr))`,
  gap: theme.spacing(2),
  width: `${galleryWidth}%`,
  margin: '0 auto',
  padding: theme.spacing(2),

  // Responsive adjustments
  [theme.breakpoints.down('md')]: {
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    width: '98%',
  },
  [theme.breakpoints.down('sm')]: {
    gridTemplateColumns: 'repeat(1, 1fr)',
    width: '100%',
    padding: theme.spacing(1),
    gap: theme.spacing(2),
  },
}));

const CardItemWrapper = styled(Box)(({ theme }) => ({
  minHeight: '300px', // Set a minimum height to prevent layout shifts
  position: 'relative',

  [theme.breakpoints.down('sm')]: {
    minHeight: '460px', // Increased for better card display on mobile
  },
}));

// A placeholder component shown before the actual card content is visible
const CardPlaceholder = styled(Box)(({ theme }) => ({
  height: '100%',
  width: '100%',
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  position: 'absolute',
  top: 0,
  left: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '10%',
    left: '10%',
    right: '10%',
    bottom: '10%',
    background: `linear-gradient(90deg, 
      ${theme.palette.background.paper} 25%, 
      ${theme.palette.background.default} 50%, 
      ${theme.palette.background.paper} 75%)`,
    backgroundSize: '200% 100%',
    borderRadius: '8px',
    animation: 'shimmer 1.5s infinite',
  },
  '@keyframes shimmer': {
    '0%': {
      backgroundPosition: '200% 0',
    },
    '100%': {
      backgroundPosition: '-200% 0',
    },
  },
}));

export default CardGallery;
