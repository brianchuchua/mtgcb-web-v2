'use client';

import React, { useEffect, useMemo } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { CollectionHeader } from '@/components/collections/CollectionHeader';
import { CollectionSetDisplay } from '@/components/collections/CollectionSetDisplay';
import { CollectionSetSummary } from '@/api/collections/types';
import { ErrorBanner } from '@/features/browse/views';
import { useCollectionData } from '@/features/collections/useCollectionData';
import { useBrowseController } from '@/features/browse/useBrowseController';
import CenteredContainer from '@/components/layout/CenteredContainer';
import { Pagination } from '@/components/pagination';
import { SetsProps } from '@/features/browse/types';
import { useAppDispatch } from '@/redux/hooks';
import { setViewContentType } from '@/redux/slices/browseSlice';

interface CollectionClientProps {
  userId: number;
}

export const CollectionClient: React.FC<CollectionClientProps> = ({ userId }) => {
  const dispatch = useAppDispatch();
  const { collectionResponse, isLoadingCollection } = useCollectionData({ userId });
  const browseController = useBrowseController();
  
  // Force view to sets for collections page
  useEffect(() => {
    dispatch(setViewContentType('sets'));
  }, [dispatch]);

  // Create a map of collection sets by setId for easy lookup
  const collectionSetsMap = useMemo(() => {
    if (!collectionResponse?.data?.sets) return new Map();
    
    const map = new Map<string, CollectionSetSummary>();
    collectionResponse.data.sets.forEach((set) => {
      map.set(set.setId, set);
    });
    return map;
  }, [collectionResponse]);

  const collectionData = useMemo(() => {
    if (!collectionResponse?.data) return null;
    
    return {
      userId: collectionResponse.data.userId,
      username: collectionResponse.data.username,
      totalCardsCollected: collectionResponse.data.totalCardsCollected,
      uniquePrintingsCollected: collectionResponse.data.uniquePrintingsCollected,
      numberOfCardsInMagic: collectionResponse.data.numberOfCardsInMagic,
      percentageCollected: collectionResponse.data.percentageCollected,
      totalValue: collectionResponse.data.totalValue,
      collectionSets: collectionSetsMap,
    };
  }, [collectionResponse, collectionSetsMap]);

  const { 
    view, 
    error,
    paginationProps, 
    setsProps,
  } = browseController;

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