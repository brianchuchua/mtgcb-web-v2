'use client';

import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { groupIntoRows, getResponsiveColumns, RowGroup } from '@/utils/rowGrouping';

export interface VirtualizedRowGalleryProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  isLoading?: boolean;
  columnsPerRow?: number;
  galleryWidth?: number;
  horizontalPadding?: number;
  emptyMessage?: string;
  computeItemKey?: (index: number) => string | number;
  'data-testid'?: string;
}

function useResponsiveColumns(userColumns: number | undefined): number {
  const [columns, setColumns] = useState(() => {
    if (userColumns !== undefined && userColumns !== 0) {
      return userColumns;
    }
    if (typeof window !== 'undefined') {
      return getResponsiveColumns(window.innerWidth);
    }
    return 4; // Default for SSR
  });

  useEffect(() => {
    if (userColumns !== undefined && userColumns !== 0) {
      setColumns(userColumns);
      return;
    }

    const handleResize = () => {
      setColumns(getResponsiveColumns(window.innerWidth));
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [userColumns]);

  return columns;
}

const VirtualizedRowGallery = <T,>({
  items,
  renderItem,
  isLoading = false,
  columnsPerRow = 4,
  galleryWidth = 95,
  horizontalPadding = 0,
  emptyMessage = 'No items found',
  computeItemKey,
  'data-testid': dataTestId,
}: VirtualizedRowGalleryProps<T>) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const effectiveColumns = useResponsiveColumns(columnsPerRow);

  // Mark when hydration is complete
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Group items into rows
  const rows = useMemo(
    () => groupIntoRows(items, effectiveColumns),
    [items, effectiveColumns]
  );

  // Only show empty message when not loading and actually have no items
  if (!isLoading && items && items.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <Typography variant="h6">{emptyMessage}</Typography>
      </Box>
    );
  }

  // If we're not yet hydrated, show a loading placeholder to prevent layout shift
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

  // Row renderer for Virtuoso
  const rowContent = useCallback(
    (index: number, row: RowGroup<T>) => {
      return (
        <RowContainer columnsPerRow={effectiveColumns}>
          {row.items.map((item, itemIndex) => {
            const globalIndex = row.startIndex + itemIndex;
            const key = computeItemKey ? computeItemKey(globalIndex) : globalIndex;
            return (
              <ItemContainer key={key}>
                {renderItem(item, globalIndex)}
              </ItemContainer>
            );
          })}
          {/* Fill empty cells in the last row */}
          {row.items.length < effectiveColumns &&
            Array.from({ length: effectiveColumns - row.items.length }).map((_, i) => (
              <EmptyCell key={`empty-${i}`} />
            ))}
        </RowContainer>
      );
    },
    [effectiveColumns, renderItem, computeItemKey]
  );

  return (
    <GalleryWrapper
      galleryWidth={galleryWidth}
      horizontalPadding={horizontalPadding}
      data-testid={dataTestId}
    >
      <Virtuoso
        useWindowScroll
        data={rows}
        itemContent={rowContent}
        increaseViewportBy={600}
        computeItemKey={(index) => rows[index].id}
        // Remove the default item wrapper styles that might interfere
        components={{
          Item: ({ children, ...props }) => (
            <div {...props} style={{ ...props.style, paddingBottom: 0 }}>
              {children}
            </div>
          ),
        }}
      />
    </GalleryWrapper>
  );
};

interface GalleryWrapperProps {
  galleryWidth: number;
  horizontalPadding: number;
}

const GalleryWrapper = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'galleryWidth' && prop !== 'horizontalPadding',
})<GalleryWrapperProps>(({ theme, galleryWidth, horizontalPadding }) => ({
  width: `${galleryWidth}%`,
  margin: '0 auto',
  padding: theme.spacing(2),
  paddingLeft: `${horizontalPadding}%`,
  paddingRight: `${horizontalPadding}%`,
  minHeight: '50vh',

  // Small screen layout
  [theme.breakpoints.down('sm')]: {
    width: '100%',
    maxWidth: '100vw',
    boxSizing: 'border-box',
  },
}));

interface RowContainerProps {
  columnsPerRow: number;
}

const RowContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'columnsPerRow',
})<RowContainerProps>(({ theme, columnsPerRow }) => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${columnsPerRow}, minmax(0, 1fr))`,
  gap: theme.spacing(2),
  width: '100%',
  // Add margin bottom to create space between rows
  marginBottom: theme.spacing(2),
  // Make all items in a row the same height
  gridAutoRows: '1fr',
  
  // Force single column on mobile
  [theme.breakpoints.down('sm')]: {
    gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
    gridAutoRows: 'auto', // On mobile, let items be their natural height
  },
}));

const ItemContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  height: '100%',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',

  [theme.breakpoints.down('sm')]: {
    boxSizing: 'border-box',
    height: 'auto', // On mobile, let items be their natural height
  },
}));

const EmptyCell = styled(Box)(() => ({
  // Empty cell to maintain grid structure in partial rows
}));

export default VirtualizedRowGallery;