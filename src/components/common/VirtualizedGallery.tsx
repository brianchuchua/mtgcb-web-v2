'use client';

import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { useEffect, useState } from 'react';
import { VirtuosoGrid } from 'react-virtuoso';

export interface VirtualizedGalleryProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  isLoading?: boolean;
  columnsPerRow?: number;
  galleryWidth?: number;
  horizontalPadding?: number;
  emptyMessage?: string;
  computeItemKey?: (index: number) => string | number;
}

const VirtualizedGallery = <T,>({
  items,
  renderItem,
  isLoading = false,
  columnsPerRow = 4,
  galleryWidth = 95,
  horizontalPadding = 0,
  emptyMessage = 'No items found',
  computeItemKey,
}: VirtualizedGalleryProps<T>) => {
  const [isHydrated, setIsHydrated] = useState(false);

  // Mark when hydration is complete
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Only show empty message when not loading and actually have no items
  if (!isLoading && items && items.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <Typography variant="h6">{emptyMessage}</Typography>
      </Box>
    );
  }

  // If we're not yet hydrated, show a loading placeholder to prevent side padding shift
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

  // Item content renderer for the Virtuoso component
  const itemContent = (index: number) => {
    const item = items[index];
    return renderItem(item, index);
  };

  return (
    <GalleryWrapper
      columnsPerRow={columnsPerRow}
      galleryWidth={galleryWidth}
      horizontalPadding={horizontalPadding}
    >
      <VirtuosoGrid
        useWindowScroll // Use window scroll instead of creating a scrollable container
        totalCount={items.length}
        components={{
          Item: ItemWrapper,
        }}
        itemContent={itemContent}
        listClassName="virtualized-gallery-grid"
        increaseViewportBy={600} // Pre-render items this many pixels outside the viewport
        computeItemKey={computeItemKey || ((index) => index)} // Use provided key function or fallback to index
      />
    </GalleryWrapper>
  );
};

interface GalleryWrapperProps {
  columnsPerRow: number;
  galleryWidth: number;
  horizontalPadding: number;
}

const GalleryWrapper = styled(Box, {
  shouldForwardProp: (prop) =>
    prop !== 'columnsPerRow' && prop !== 'galleryWidth' && prop !== 'horizontalPadding',
})<GalleryWrapperProps>(({ theme, columnsPerRow, galleryWidth, horizontalPadding }) => ({
  width: `${galleryWidth}%`,
  margin: '0 auto',
  padding: theme.spacing(2),
  paddingLeft: `${horizontalPadding}%`,
  paddingRight: `${horizontalPadding}%`,
  minHeight: '50vh', // Ensure there's enough room for virtuoso

  // Style for the gallery grid container
  '& .virtualized-gallery-grid': {
    display: 'grid',
    gridTemplateColumns: `repeat(${columnsPerRow}, minmax(0, 1fr))`,
    gap: theme.spacing(2),
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
    '& .virtualized-gallery-grid': {
      gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
      gap: theme.spacing(2),
    },
  },
}));

const ItemWrapper = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  boxSizing: 'border-box',

  // No additional margin/padding here - let the grid handle spacing
  [theme.breakpoints.down('sm')]: {
    boxSizing: 'border-box',
  },
}));

export default VirtualizedGallery;
