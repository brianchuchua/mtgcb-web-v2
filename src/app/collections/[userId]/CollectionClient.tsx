'use client';

import { Box, CircularProgress } from '@mui/material';
import React, { useMemo } from 'react';
import { CollectionSetSummary } from '@/api/collections/types';
import { CollectionHeader } from '@/components/collections/CollectionHeader';
import { CollectionSetDisplay } from '@/components/collections/CollectionSetDisplay';
import CenteredContainer from '@/components/layout/CenteredContainer';
import { Pagination } from '@/components/pagination';
import { SetsProps } from '@/features/browse/types';
import { ErrorBanner } from '@/features/browse/views';
import { useCollectionBrowseController } from '@/features/collections/useCollectionBrowseController';

interface CollectionClientProps {
  userId: number;
}

export const CollectionClient: React.FC<CollectionClientProps> = ({ userId }) => {
  const { view, error, paginationProps, setsProps } = useCollectionBrowseController({ userId });

  // Create collection sets map from the sets data
  const collectionSets = useMemo(() => {
    if (!setsProps || !('setItems' in setsProps) || !setsProps.setItems) {
      return new Map<string, CollectionSetSummary>();
    }

    const sets = setsProps.setItems;
    const collectionSetsMap = new Map<string, CollectionSetSummary>();

    sets.forEach((set) => {
      // Only add sets that have collection data
      if (set.totalCardsCollectedInSet !== undefined) {
        collectionSetsMap.set(set.id, {
          id: set.id,
          setId: set.id,
          name: set.name,
          slug: set.slug,
          code: set.code || '',
          setType: set.setType || '',
          cardCount: parseInt(set.cardCount || '0'),
          category: set.category || '',
          releasedAt: set.releasedAt || '',
          sealedProductUrl: set.sealedProductUrl || '',
          isDraftable: set.isDraftable,
          subsetGroupId: set.subsetGroupId,
          isSubsetGroup: set.isSubsetGroup,
          parentSetId: set.parentSetId,
          totalCardsCollectedInSet: set.totalCardsCollectedInSet,
          uniquePrintingsCollectedInSet: set.uniquePrintingsCollectedInSet || 0,
          cardCountIncludingSubsets: parseInt(set.cardCountIncludingSubsets || set.cardCount || '0'),
          percentageCollected: set.percentageCollected || 0,
          costToComplete: set.costToComplete || {
            oneOfEachCard: 0,
            oneOfEachMythic: 0,
            oneOfEachRare: 0,
            oneOfEachUncommon: 0,
            oneOfEachCommon: 0,
            fourOfEachCard: 0,
            fourOfEachMythic: 0,
            fourOfEachRare: 0,
            fourOfEachUncommon: 0,
            fourOfEachCommon: 0,
            draftCube: 0,
            totalValue: 0,
          },
        });
      }
    });

    return collectionSetsMap;
  }, [setsProps]);

  // Show loading state only on initial load
  const isLoading = setsProps && 'isLoading' in setsProps ? setsProps.isLoading : false;
  const collectionSummary = setsProps && 'collectionSummary' in setsProps ? setsProps.collectionSummary : null;

  if (!collectionSummary && isLoading) {
    return (
      <CenteredContainer>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      </CenteredContainer>
    );
  }

  if (!collectionSummary) {
    return null;
  }

  return (
    <>
      <CollectionHeader
        username={setsProps.username || ''}
        uniquePrintingsCollected={collectionSummary.uniquePrintingsCollected || 0}
        numberOfCardsInMagic={collectionSummary.numberOfCardsInMagic || 0}
        totalCardsCollected={collectionSummary.totalCardsCollected || 0}
        percentageCollected={collectionSummary.percentageCollected || 0}
        totalValue={collectionSummary.totalValue || 0}
      />

      <Pagination {...paginationProps} />

      {error && <ErrorBanner type="sets" />}

      {/* Only show sets view for collections */}
      {view === 'sets' && 'setItems' in setsProps && setsProps.setItems && (
        <CollectionSetDisplay
          {...(setsProps as SetsProps)}
          collectionData={{
            userId,
            collectionSets,
          }}
        />
      )}
    </>
  );
};
