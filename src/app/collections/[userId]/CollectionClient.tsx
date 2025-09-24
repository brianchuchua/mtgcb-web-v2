'use client';

import { Box, CircularProgress } from '@mui/material';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { CollectionSetSummary } from '@/api/collections/types';
import { useGetLocationHierarchyQuery } from '@/api/locations/locationsApi';
import { SearchDescription } from '@/components/browse/SearchDescription';
import { CollectionHeader } from '@/components/collections/CollectionHeader';
import { CollectionSetDisplay } from '@/components/collections/CollectionSetDisplay';
import { ShareCollectionButton } from '@/components/collections/ShareCollectionButton';
import { SharedCollectionBanner } from '@/components/collections/SharedCollectionBanner';
import { InvalidShareLinkBanner } from '@/components/collections/InvalidShareLinkBanner';
import CenteredContainer from '@/components/layout/CenteredContainer';
import { Pagination } from '@/components/pagination';
import { CardsProps, SetsProps } from '@/features/browse/types';
import { CardGrid, CardTable, ErrorBanner, PrivacyErrorBanner } from '@/features/browse/views';
import { useCollectionBrowseController } from '@/features/collections/useCollectionBrowseController';
import { useAuth } from '@/hooks/useAuth';
import { useShareTokenContext } from '@/contexts/ShareTokenContext';
import { selectSelectedGoalId, selectIncludeSubsetsInSets } from '@/redux/slices/browseSlice';

interface CollectionClientProps {
  userId: number;
}

export const CollectionClient: React.FC<CollectionClientProps> = ({ userId }) => {
  // Note: URL sync is handled by useBrowseStateSync via usePaginationSync in useBrowseController
  
  const { view, viewMode, error, paginationProps, setsProps, cardsProps } = useCollectionBrowseController({ userId });
  const { user } = useAuth();
  const { shareToken, isViewingSharedCollection } = useShareTokenContext();
  const isOwnCollection = user?.userId === userId;
  const selectedGoalId = useSelector(selectSelectedGoalId);
  const includeSubsetsInSets = useSelector(selectIncludeSubsetsInSets);

  // Fetch user locations for the "Add card to location" button
  const { data: locationsResponse } = useGetLocationHierarchyQuery(undefined, {
    skip: !isOwnCollection,
  });
  const hasLocations = (locationsResponse?.data || []).length > 0;
  
  // Check if we have a share token but got a privacy error (403)
  const hasInvalidShareLink = shareToken && isViewingSharedCollection(userId) && 
    error?.data?.error?.code === 'COLLECTION_PRIVATE';


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
  const isLoading = view === 'sets' 
    ? (setsProps && 'isLoading' in setsProps ? setsProps.isLoading : false)
    : (cardsProps && 'loading' in cardsProps ? cardsProps.loading : false);
    
  const collectionSummary = view === 'sets' 
    ? (setsProps && 'collectionSummary' in setsProps ? setsProps.collectionSummary : null)
    : (cardsProps && 'collectionSummary' in cardsProps ? cardsProps.collectionSummary : null);
  
  const username = view === 'sets'
    ? (setsProps && 'username' in setsProps ? setsProps.username : '')
    : (cardsProps && 'username' in cardsProps ? cardsProps.username : '');
    
  const goalSummary = view === 'sets'
    ? (setsProps && 'goalSummary' in setsProps ? setsProps.goalSummary : null)
    : (cardsProps && 'goalSummary' in cardsProps ? cardsProps.goalSummary : null);

  // Show loading state for initial load
  if (isLoading && ((view === 'cards' && (!cardsProps || !('items' in cardsProps))) || 
                    (view === 'sets' && (!setsProps || !('setItems' in setsProps))))) {
    return (
      <CenteredContainer>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      </CenteredContainer>
    );
  }

  return (
    <>
      {!hasInvalidShareLink && (
        <SharedCollectionBanner username={username || 'User'} userId={userId} />
      )}
      
      {(collectionSummary || isLoading) && (
        <CollectionHeader
          username={username || ''}
          userId={userId}
          uniquePrintingsCollected={collectionSummary?.uniquePrintingsCollected || 0}
          numberOfCardsInMagic={collectionSummary?.numberOfCardsInMagic || 0}
          totalCardsCollected={collectionSummary?.totalCardsCollected || 0}
          percentageCollected={collectionSummary?.percentageCollected || 0}
          totalValue={collectionSummary?.totalValue || 0}
          isLoading={isLoading && !collectionSummary}
          goalSummary={goalSummary || undefined}
          view={view}
          selectedGoalId={selectedGoalId}
          includeSubsetsInSets={includeSubsetsInSets}
        />
      )}

      <Pagination 
        {...paginationProps} 
        additionalAction={
          isOwnCollection && (
            <ShareCollectionButton
              userId={userId.toString()}
              username={username || user?.username || 'User'}
              isPublic={user?.isPublic || false}
            />
          )
        }
      />
      <SearchDescription />

      {error && (
        hasInvalidShareLink ? (
          <InvalidShareLinkBanner username={username} />
        ) : error?.data?.error?.code === 'COLLECTION_PRIVATE' ? (
          <PrivacyErrorBanner username={username} />
        ) : (
          <ErrorBanner type={view} />
        )
      )}

      {/* Show sets view for collections */}
      {view === 'sets' && 'setItems' in setsProps && setsProps.setItems && (
        <CollectionSetDisplay
          {...(setsProps as SetsProps)}
          collectionData={{
            userId,
            collectionSets,
          }}
          goalId={selectedGoalId || undefined}
        />
      )}

      {/* Show cards view for collections */}
      {view === 'cards' && cardsProps && 'items' in cardsProps && (
        <>
          {viewMode === 'grid' && <CardGrid {...(cardsProps as CardsProps)} isOwnCollection={isOwnCollection} goalId={selectedGoalId ? selectedGoalId.toString() : undefined} hasLocations={hasLocations} />}
          {viewMode === 'table' && <CardTable {...(cardsProps as CardsProps)} isOwnCollection={isOwnCollection} goalId={selectedGoalId ? selectedGoalId.toString() : undefined} hasLocations={hasLocations} />}
        </>
      )}

      <Pagination {...paginationProps} position="bottom" />
    </>
  );
};
