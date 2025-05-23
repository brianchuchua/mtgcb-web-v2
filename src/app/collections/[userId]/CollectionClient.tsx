'use client';

import React from 'react';
import { Box, CircularProgress } from '@mui/material';
import { CollectionHeader } from '@/components/collections/CollectionHeader';
import { CollectionSetDisplay } from '@/components/collections/CollectionSetDisplay';
import { ErrorBanner } from '@/features/browse/views';
import { useCollectionBrowseController } from '@/features/collections/useCollectionBrowseController';
import CenteredContainer from '@/components/layout/CenteredContainer';
import { Pagination } from '@/components/pagination';
import { SetsProps } from '@/features/browse/types';

interface CollectionClientProps {
  userId: number;
}

export const CollectionClient: React.FC<CollectionClientProps> = ({ userId }) => {
  const { 
    view, 
    error,
    paginationProps, 
    setsProps,
    collectionData,
    isLoadingCollection,
  } = useCollectionBrowseController({ userId });

  // Show loading state only on initial load
  if (!collectionData && isLoadingCollection) {
    return (
      <CenteredContainer>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      </CenteredContainer>
    );
  }

  if (!collectionData) {
    return null;
  }

  return (
    <>
      <CollectionHeader
        username={collectionData.username}
        uniquePrintingsCollected={collectionData.uniquePrintingsCollected}
        numberOfCardsInMagic={collectionData.numberOfCardsInMagic}
        totalCardsCollected={collectionData.totalCardsCollected}
        percentageCollected={collectionData.percentageCollected}
        totalValue={collectionData.totalValue}
      />

      <Pagination {...paginationProps} />

      {error && <ErrorBanner type="sets" />}
      
      {/* Only show sets view for collections */}
      {view === 'sets' && 'setItems' in setsProps && setsProps.setItems && (
        <CollectionSetDisplay 
          {...(setsProps as SetsProps)} 
          collectionData={collectionData} 
        />
      )}
    </>
  );
};