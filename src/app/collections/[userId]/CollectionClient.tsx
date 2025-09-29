'use client';

import { Box, CircularProgress, Stack } from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useMassUpdateLocationsMutation } from '@/api/collections/collectionsApi';
import { CollectionSetSummary } from '@/api/collections/types';
import { useGetLocationHierarchyQuery } from '@/api/locations/locationsApi';
import { SearchDescription } from '@/components/browse/SearchDescription';
import { CollectionHeader } from '@/components/collections/CollectionHeader';
import { CollectionSetDisplay } from '@/components/collections/CollectionSetDisplay';
import { InvalidShareLinkBanner } from '@/components/collections/InvalidShareLinkBanner';
import MassUpdateLocationButton from '@/components/collections/MassUpdateLocationButton';
import MassUpdateLocationPanel, { MassUpdateLocationFormData } from '@/components/collections/MassUpdateLocationPanel';
import { ShareCollectionButton } from '@/components/collections/ShareCollectionButton';
import { SharedCollectionBanner } from '@/components/collections/SharedCollectionBanner';
import CenteredContainer from '@/components/layout/CenteredContainer';
import { Pagination } from '@/components/pagination';
import { useShareTokenContext } from '@/contexts/ShareTokenContext';
import { CardsProps, SetsProps } from '@/features/browse/types';
import { CardGrid, CardTable, ErrorBanner, PrivacyErrorBanner } from '@/features/browse/views';
import { useCollectionBrowseController } from '@/features/collections/useCollectionBrowseController';
import { useAuth } from '@/hooks/useAuth';
import { selectIncludeSubsetsInSets, selectSelectedGoalId } from '@/redux/slices/browseSlice';

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
  const { enqueueSnackbar } = useSnackbar();

  // Mass Update Location state
  const [isMassUpdateLocationOpen, setIsMassUpdateLocationOpen] = useState(false);
  const [massUpdateLocations, { isLoading: isMassUpdateLocationLoading }] = useMassUpdateLocationsMutation();

  // Fetch user locations for the "Add card to location" button
  const { data: locationsResponse } = useGetLocationHierarchyQuery(undefined, {
    skip: !isOwnCollection,
  });
  const hasLocations = (locationsResponse?.data || []).length > 0;

  // Check if we have a share token but got a privacy error (403)
  const hasInvalidShareLink =
    shareToken && isViewingSharedCollection(userId) && error?.data?.error?.code === 'COLLECTION_PRIVATE';

  // Get visible card IDs for mass location update - only cards they own
  const ownedVisibleCardIds = useMemo(() => {
    if (view === 'cards' && cardsProps && 'items' in cardsProps) {
      return cardsProps.items
        .filter((card) => (card.quantityReg && card.quantityReg > 0) || (card.quantityFoil && card.quantityFoil > 0))
        .map((card) => parseInt(card.id));
    }
    return [];
  }, [view, cardsProps]);

  // Mass Update Location handlers
  const handleMassUpdateLocationToggle = useCallback(() => {
    setIsMassUpdateLocationOpen(!isMassUpdateLocationOpen);
  }, [isMassUpdateLocationOpen]);

  const handleMassUpdateLocationSubmit = useCallback(
    async (formData: MassUpdateLocationFormData) => {
      if (!ownedVisibleCardIds.length) {
        enqueueSnackbar('No owned cards available to update', { variant: 'error' });
        return;
      }

      try {
        const response = await massUpdateLocations({
          mode: formData.mode,
          cardIds: ownedVisibleCardIds,
          locationId: formData.locationId,
          quantityReg: formData.quantityReg,
          quantityFoil: formData.quantityFoil,
        }).unwrap();

        if (response.success && response.data) {
          const { successful, failed, operations, errors, warnings } = response.data;

          if (successful === 0 && failed > 0) {
            // Group errors by reason
            const errorGroups: Record<string, number> = {};
            if (errors) {
              errors.forEach((error) => {
                errorGroups[error.reason] = (errorGroups[error.reason] || 0) + 1;
              });
            }

            // Get the most common error reason for display
            const errorReasons = Object.keys(errorGroups);
            const primaryReason = errorReasons.length > 0 ? errorReasons[0] : null;

            let friendlyReason = '';
            if (primaryReason) {
              friendlyReason = primaryReason.toLowerCase();
              if (friendlyReason.includes('not found') || friendlyReason.includes('not in collection')) {
                friendlyReason = 'Cards not in collection';
              } else if (friendlyReason.includes('foil')) {
                friendlyReason = 'No foil version exists';
              } else if (friendlyReason.includes('regular')) {
                friendlyReason = 'No regular version exists';
              } else {
                friendlyReason = primaryReason;
              }
            }

            const skipMessage = friendlyReason
              ? `${failed} card${failed !== 1 ? 's' : ''} skipped (${friendlyReason})`
              : `${failed} card${failed !== 1 ? 's' : ''} skipped`;

            enqueueSnackbar(skipMessage, {
              variant: 'error',
            });
          } else if (successful > 0) {
            let message;

            // Match the single card dialog success messages
            if (formData.mode === 'remove') {
              message = 'Locations cleared successfully';
            } else if (formData.mode === 'set' && operations.created > operations.updated) {
              message = 'Cards added to location successfully';
            } else if (formData.mode === 'increment' || operations.updated > operations.created) {
              message = 'Location quantities updated successfully';
            } else {
              message = `Successfully updated ${successful} card${successful !== 1 ? 's' : ''}`;
            }

            // Count unique cards that had quantities capped
            let cappedCardsCount = 0;
            if (warnings && warnings.length > 0) {
              const cappedCardIds = new Set<number>();
              warnings.forEach((warning) => {
                if (warning.message.includes('capped')) {
                  cappedCardIds.add(warning.cardId);
                }
              });
              cappedCardsCount = cappedCardIds.size;
            }

            if (failed > 0 || cappedCardsCount > 0) {
              const messageParts = [message];

              if (failed > 0) {
                // Group errors by reason for the warning message
                const errorGroups: Record<string, number> = {};
                if (errors) {
                  errors.forEach((error) => {
                    errorGroups[error.reason] = (errorGroups[error.reason] || 0) + 1;
                  });
                }

                // Get the primary skip reason
                const errorReasons = Object.keys(errorGroups);
                const primaryReason = errorReasons.length > 0 ? errorReasons[0] : null;

                let friendlyReason = '';
                if (primaryReason) {
                  const reason = primaryReason.toLowerCase();
                  if (reason.includes('not found') || reason.includes('not in collection')) {
                    friendlyReason = 'Cards not in collection';
                  } else if (reason.includes('foil')) {
                    friendlyReason = 'No foil version exists';
                  } else if (reason.includes('regular')) {
                    friendlyReason = 'No regular version exists';
                  } else {
                    friendlyReason = primaryReason;
                  }
                }

                messageParts.push(
                  `${failed} card${failed !== 1 ? 's' : ''} skipped${friendlyReason ? ` (${friendlyReason})` : ''}`,
                );
              }

              if (cappedCardsCount > 0) {
                messageParts.push(
                  `${cappedCardsCount} card${cappedCardsCount !== 1 ? 's' : ''} had quantities capped at maximum owned and unassigned to other locations`,
                );
              }

              const finalMessage = messageParts.join('. ');
              enqueueSnackbar(finalMessage, { variant: 'warning', autoHideDuration: 8000 });
            } else {
              enqueueSnackbar(message, { variant: 'success' });
            }
          }

          setIsMassUpdateLocationOpen(false);
        }
      } catch (error: any) {
        enqueueSnackbar(error?.data?.error?.message || 'Failed to update card locations', {
          variant: 'error',
        });
      }
    },
    [ownedVisibleCardIds, massUpdateLocations, enqueueSnackbar],
  );

  const handleMassUpdateLocationCancel = useCallback(() => {
    setIsMassUpdateLocationOpen(false);
  }, []);

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
  const isLoading =
    view === 'sets'
      ? setsProps && 'isLoading' in setsProps
        ? setsProps.isLoading
        : false
      : cardsProps && 'loading' in cardsProps
        ? cardsProps.loading
        : false;

  const collectionSummary =
    view === 'sets'
      ? setsProps && 'collectionSummary' in setsProps
        ? setsProps.collectionSummary
        : null
      : cardsProps && 'collectionSummary' in cardsProps
        ? cardsProps.collectionSummary
        : null;

  const username =
    view === 'sets'
      ? setsProps && 'username' in setsProps
        ? setsProps.username
        : ''
      : cardsProps && 'username' in cardsProps
        ? cardsProps.username
        : '';

  const goalSummary =
    view === 'sets'
      ? setsProps && 'goalSummary' in setsProps
        ? setsProps.goalSummary
        : null
      : cardsProps && 'goalSummary' in cardsProps
        ? cardsProps.goalSummary
        : null;

  // Show loading state for initial load
  if (
    isLoading &&
    ((view === 'cards' && (!cardsProps || !('items' in cardsProps))) ||
      (view === 'sets' && (!setsProps || !('setItems' in setsProps))))
  ) {
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
      {!hasInvalidShareLink && <SharedCollectionBanner username={username || 'User'} userId={userId} />}

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
            <Stack direction="row" spacing={0.5}>
              {view === 'cards' && hasLocations && ownedVisibleCardIds.length > 0 && (
                <MassUpdateLocationButton onClick={handleMassUpdateLocationToggle} isOpen={isMassUpdateLocationOpen} />
              )}
              <ShareCollectionButton
                userId={userId.toString()}
                username={username || user?.username || 'User'}
                isPublic={user?.isPublic || false}
              />
            </Stack>
          )
        }
      />
      {view === 'cards' && (
        <MassUpdateLocationPanel
          isOpen={isMassUpdateLocationOpen}
          onSubmit={handleMassUpdateLocationSubmit}
          onCancel={handleMassUpdateLocationCancel}
          isLoading={isMassUpdateLocationLoading}
          cardCount={ownedVisibleCardIds.length}
        />
      )}
      <SearchDescription />

      {error &&
        (hasInvalidShareLink ? (
          <InvalidShareLinkBanner username={username} />
        ) : error?.data?.error?.code === 'COLLECTION_PRIVATE' ? (
          <PrivacyErrorBanner username={username} />
        ) : (
          <ErrorBanner type={view} />
        ))}

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
          {viewMode === 'grid' && (
            <CardGrid
              {...(cardsProps as CardsProps)}
              isOwnCollection={isOwnCollection}
              goalId={selectedGoalId ? selectedGoalId.toString() : undefined}
              hasLocations={hasLocations}
            />
          )}
          {viewMode === 'table' && (
            <CardTable
              {...(cardsProps as CardsProps)}
              isOwnCollection={isOwnCollection}
              goalId={selectedGoalId ? selectedGoalId.toString() : undefined}
              hasLocations={hasLocations}
            />
          )}
        </>
      )}

      <Pagination {...paginationProps} position="bottom" />
    </>
  );
};
