'use client';

import { Box, Typography } from '@mui/material';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useSnackbar } from 'notistack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useGetSetsQuery } from '@/api/browse/browseApi';
import { useMassUpdateCollectionMutation } from '@/api/collections/collectionsApi';
import SubsetSection from '@/app/browse/sets/[setSlug]/SubsetSection';
import { CollectionHeader } from '@/components/collections/CollectionHeader';
import { CollectionProgressBar } from '@/components/collections/CollectionProgressBar';
import MassUpdateButton from '@/components/collections/MassUpdateButton';
import MassUpdateConfirmDialog from '@/components/collections/MassUpdateConfirmDialog';
import MassUpdatePanel, { MassUpdateFormData } from '@/components/collections/MassUpdatePanel';
import { ShareCollectionButton } from '@/components/collections/ShareCollectionButton';
import { SharedCollectionBanner } from '@/components/collections/SharedCollectionBanner';
import { InvalidShareLinkBanner } from '@/components/collections/InvalidShareLinkBanner';
import { Pagination } from '@/components/pagination';
import SubsetDropdown from '@/components/pagination/SubsetDropdown';
import SetIcon from '@/components/sets/SetIcon';
import { SetNavigationButtons } from '@/components/sets/SetNavigationButtons';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { useSetNavigation } from '@/hooks/useSetNavigation';
import { CardsProps } from '@/features/browse/types/browseController';
import { CardGrid, CardTable, ErrorBanner, PrivacyErrorBanner } from '@/features/browse/views';
import InfoBanner from '@/features/browse/views/InfoBanner';
import { useCollectionBrowseController } from '@/features/collections/useCollectionBrowseController';
import { useAuth } from '@/hooks/useAuth';
import { useShareTokenContext } from '@/contexts/ShareTokenContext';
import { useInitialUrlSync } from '@/hooks/useInitialUrlSync';
import { useSetPriceType } from '@/hooks/useSetPriceType';
import {
  selectCardSearchParams,
  selectIncludeSubsetsInSets,
  selectSelectedGoalId,
  selectSets,
  setSelectedGoalId,
  setSets,
  setViewContentType,
} from '@/redux/slices/browseSlice';
import { SetFilter } from '@/types/browse';
import capitalize from '@/utils/capitalize';
import { formatISODate } from '@/utils/dateUtils';
import { getCollectionUrl } from '@/utils/collectionUrls';

interface CollectionSetClientProps {
  userId: number;
  setSlug: string;
}

export const CollectionSetClient: React.FC<CollectionSetClientProps> = ({ userId, setSlug }) => {
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  
  // Sync goalId from URL to Redux on mount
  useInitialUrlSync({ syncView: false, syncGoalId: true });
  
  const browseController = useCollectionBrowseController({ userId, isSetSpecificPage: true });
  const subsetRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const subsetToggleRefs = useRef<Record<string, () => void>>({});
  const setPriceType = useSetPriceType();
  const { user } = useAuth();
  const { shareToken, isViewingSharedCollection } = useShareTokenContext();
  const isOwnCollection = user?.userId === userId;
  const { enqueueSnackbar } = useSnackbar();
  
  // Check if we have a share token but got a privacy error (403)
  const hasInvalidShareLink = shareToken && isViewingSharedCollection(userId) && 
    browseController.error?.data?.error?.code === 'COLLECTION_PRIVATE';

  // Mass Update state
  const [isMassUpdateOpen, setIsMassUpdateOpen] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [massUpdateFormData, setMassUpdateFormData] = useState<MassUpdateFormData | null>(null);
  const [massUpdateCollection, { isLoading: isMassUpdateLoading }] = useMassUpdateCollectionMutation();

  // Get current search parameters to pass to subsets
  const cardSearchParams = useSelector(selectCardSearchParams);
  const currentSetsFilter = useSelector(selectSets);
  const includeSubsetsInSets = useSelector(selectIncludeSubsetsInSets);
  const selectedGoalId = useSelector(selectSelectedGoalId);
  
  // Check if we're waiting for goalId to sync from URL
  const goalIdParam = searchParams?.get('goalId');
  const hasGoalInUrl = goalIdParam !== null;
  const goalIdFromUrl = goalIdParam ? parseInt(goalIdParam) : null;
  const isWaitingForGoalSync = hasGoalInUrl && !isNaN(goalIdFromUrl!) && goalIdFromUrl !== selectedGoalId;

  const {
    data: setsData,
    isSuccess,
    isLoading: isSetLoading,
  } = useGetSetsQuery({
    limit: 1,
    slug: setSlug,
    userId: userId,
    priceType: setPriceType,
    includeSubsetsInSets,
    goalId: selectedGoalId || undefined,
  }, {
    skip: isWaitingForGoalSync,
  });

  const set = setsData?.data?.sets?.[0];

  const { data: subsetsData, isLoading: isSubsetsLoading } = useGetSetsQuery(
    {
      parentSetId: set?.id,
      limit: 100,
      userId: userId,
      priceType: setPriceType,
      goalId: selectedGoalId || undefined,
    },
    {
      skip: !set?.id || isWaitingForGoalSync,
    },
  );


  useEffect(() => {
    // Always set view to cards for this page
    dispatch(setViewContentType('cards'));
    
    if (isSuccess && setsData?.data?.sets && setsData.data.sets.length > 0) {
      const set = setsData.data.sets[0];

      const setFilter: SetFilter = {
        include: [set.id],
        exclude: [],
      };

      dispatch(setSets(setFilter));
    }
  }, [dispatch, setsData, isSuccess, setSlug]);

  // Re-apply set filter if it gets cleared (e.g., by reset search)
  useEffect(() => {
    if (isSuccess && setsData?.data?.sets && setsData.data.sets.length > 0) {
      const set = setsData.data.sets[0];
      const expectedSetId = set.id;

      // Check if current sets filter doesn't include this set
      const hasCorrectSetFilter =
        currentSetsFilter && currentSetsFilter.include && currentSetsFilter.include.includes(expectedSetId);

      if (!hasCorrectSetFilter) {
        const setFilter: SetFilter = {
          include: [expectedSetId],
          exclude: [],
        };
        dispatch(setSets(setFilter));
      }
    }
  }, [dispatch, setsData, isSuccess, currentSetsFilter]);

  const subsets = subsetsData?.data?.sets || [];
  const setName = isSetLoading ? '' : set?.name || 'Set not found';

  const { previousSet, nextSet, handleSetNavigation } = useSetNavigation({
    currentSetId: set?.id,
    baseUrl: getCollectionUrl({ userId }),
    preserveParams: {
      goalId: selectedGoalId || undefined,
    },
  });
  const username =
    browseController.setsProps && 'username' in browseController.setsProps
      ? browseController.setsProps.username
      : browseController.cardsProps && 'username' in browseController.cardsProps
        ? browseController.cardsProps.username
        : '';
  const collectionSummary =
    browseController.setsProps && 'collectionSummary' in browseController.setsProps
      ? browseController.setsProps.collectionSummary
      : browseController.cardsProps && 'collectionSummary' in browseController.cardsProps
        ? browseController.cardsProps.collectionSummary
        : null;
  const goalSummary =
    browseController.setsProps && 'goalSummary' in browseController.setsProps
      ? browseController.setsProps.goalSummary
      : browseController.cardsProps && 'goalSummary' in browseController.cardsProps
        ? browseController.cardsProps.goalSummary
        : null;

  const handleSubsetSelect = useCallback((subsetId: string) => {
    // First, open/expand the subset
    const toggleFunction = subsetToggleRefs.current[subsetId];
    if (toggleFunction) {
      toggleFunction();
    }

    // Then scroll to it after a brief delay to allow expansion
    setTimeout(() => {
      const element = subsetRefs.current[subsetId];
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }, []);

  // Mass Update handlers
  const handleMassUpdateToggle = useCallback(() => {
    setIsMassUpdateOpen(!isMassUpdateOpen);
  }, [isMassUpdateOpen]);

  const handleMassUpdateSubmit = useCallback((formData: MassUpdateFormData) => {
    setMassUpdateFormData(formData);
    setShowConfirmDialog(true);
  }, []);

  const handleMassUpdateCancel = useCallback(() => {
    setIsMassUpdateOpen(false);
  }, []);

  const handleConfirmMassUpdate = useCallback(async () => {
    if (!massUpdateFormData || !set?.id) return;

    try {
      const response = await massUpdateCollection({
        mode: massUpdateFormData.mode,
        setId: parseInt(set.id),
        updates: [
          {
            rarity: massUpdateFormData.rarity,
            quantityReg: massUpdateFormData.quantityReg,
            quantityFoil: massUpdateFormData.quantityFoil,
          },
        ],
      }).unwrap();

      if (response.success) {
        const updatedCount = response.data?.updatedCards || 0;
        const totalSkipped = response.data?.totalSkipped;
        
        // Special case: No cards could be updated
        if (updatedCount === 0 && totalSkipped && (totalSkipped.cannotBeFoil > 0 || totalSkipped.cannotBeNonFoil > 0)) {
          const skippedCount = totalSkipped.cannotBeFoil + totalSkipped.cannotBeNonFoil;
          let message = `0 cards updated. All ${skippedCount} card${skippedCount !== 1 ? 's have' : ' has'} foil restrictions. `;
          
          // Add specific details
          if (totalSkipped.cannotBeFoil > 0 && totalSkipped.cannotBeNonFoil > 0) {
            message += `${totalSkipped.cannotBeFoil} card${totalSkipped.cannotBeFoil !== 1 ? 's' : ''} cannot be foil and ${totalSkipped.cannotBeNonFoil} card${totalSkipped.cannotBeNonFoil !== 1 ? 's' : ''} cannot be non-foil.`;
          } else if (totalSkipped.cannotBeFoil > 0) {
            message += `These card${totalSkipped.cannotBeFoil !== 1 ? 's don\'t' : ' doesn\'t'} exist in foil.`;
          } else if (totalSkipped.cannotBeNonFoil > 0) {
            message += `These card${totalSkipped.cannotBeNonFoil !== 1 ? 's don\'t' : ' doesn\'t'} exist in non-foil.`;
          }
          
          enqueueSnackbar(message, { 
            variant: 'warning',
            autoHideDuration: 6000 // Display for 6 seconds
          });
        } else {
          // Normal case: Some or all cards were updated
          let message = `Successfully updated ${updatedCount} cards in ${set.name}`;
          
          // Add information about skipped cards if any
          if (totalSkipped && (totalSkipped.cannotBeFoil > 0 || totalSkipped.cannotBeNonFoil > 0)) {
            const skippedCount = totalSkipped.cannotBeFoil + totalSkipped.cannotBeNonFoil;
            message += `. ${skippedCount} card${skippedCount !== 1 ? 's were' : ' was'} skipped: `;
            
            // Add specific details
            if (totalSkipped.cannotBeFoil > 0 && totalSkipped.cannotBeNonFoil > 0) {
              message += `${totalSkipped.cannotBeFoil} cannot be foil, ${totalSkipped.cannotBeNonFoil} cannot be non-foil.`;
            } else if (totalSkipped.cannotBeFoil > 0) {
              message += `${totalSkipped.cannotBeFoil} cannot be foil.`;
            } else if (totalSkipped.cannotBeNonFoil > 0) {
              message += `${totalSkipped.cannotBeNonFoil} cannot be non-foil.`;
            }
            
            enqueueSnackbar(message, {
              variant: 'warning',
              autoHideDuration: 6000 // Display for 6 seconds
            });
          } else {
            enqueueSnackbar(message, {
              variant: 'success',
            });
          }
        }
        
        setIsMassUpdateOpen(false);
        setShowConfirmDialog(false);
        setMassUpdateFormData(null);
      }
    } catch (error: any) {
      enqueueSnackbar(error?.data?.error?.message || 'Failed to update collection', { variant: 'error' });
    }
  }, [massUpdateFormData, set, massUpdateCollection, enqueueSnackbar]);

  const handleCancelConfirm = useCallback(() => {
    setShowConfirmDialog(false);
    setMassUpdateFormData(null);
  }, []);

  const isCardGridView = browseController.view === 'cards' && browseController.viewMode === 'grid';
  const isCardTableView = browseController.view === 'cards' && browseController.viewMode === 'table';

  const cardsProps = browseController.cardsProps as CardsProps;

  if (isSetLoading) {
    return (
      <Box>
        <Box sx={{ fontWeight: 'bold', fontSize: '1.5rem', mb: 2 }}></Box>
      </Box>
    );
  }

  if (!set && !isSetLoading) {
    return (
      <Box>
        <InfoBanner 
          title="Set not found or no cards found in it matching your criteria" 
          message="The requested set might not exist, or there are no cards that match your current filter settings."
        />
      </Box>
    );
  }

  const formatSetCategoryAndType = (set: any) => {
    const category = set.category ? capitalize(set.category) : null;
    const type = set.setType ? capitalize(set.setType) : null;

    if (category && type) return `${category} Set - ${type}`;
    if (category) return `${category} Set`;
    if (type) return type;
    return 'Special Set';
  };

  return (
    <Box>
      {!hasInvalidShareLink && (
        <SharedCollectionBanner username={username || 'User'} userId={userId} />
      )}
      
      {/* Show CollectionHeader when viewing with a goal selected */}
      {selectedGoalId && collectionSummary && set && (
        <Box sx={{ position: 'relative' }}>
          <CollectionHeader
          username={username || ''}
          userId={userId}
          uniquePrintingsCollected={collectionSummary.uniquePrintingsCollected || 0}
          numberOfCardsInMagic={collectionSummary.numberOfCardsInMagic || 0}
          totalCardsCollected={collectionSummary.totalCardsCollected || 0}
          percentageCollected={collectionSummary.percentageCollected || 0}
          totalValue={collectionSummary.totalValue || 0}
          isLoading={false}
          goalSummary={goalSummary || undefined}
          view="cards"
          selectedGoalId={selectedGoalId}
          includeSubsetsInSets={includeSubsetsInSets}
          setInfo={{
            name: set.name,
            code: set.code || '',
            id: set.id,
            slug: setSlug,
            uniquePrintingsCollectedInSet: set.uniquePrintingsCollectedInSet || 0,
            cardCount: set.cardCount || '0',
            totalCardsCollectedInSet: set.totalCardsCollectedInSet || 0,
            totalValue: set.costToComplete?.totalValue || 0,
            percentageCollected: set.percentageCollected || 0,
            costToComplete: set.costToComplete?.goal || 0,
          }}
        />
        </Box>
      )}

      {/* Show regular set header when NOT viewing with a goal */}
      {!selectedGoalId && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            position: 'relative',
          }}
        >
          <SetNavigationButtons
            previousSet={previousSet}
            nextSet={nextSet}
            onNavigate={handleSetNavigation}
          />

          <Typography
            variant="h4"
            fontWeight="500"
            sx={(theme) => ({
              color: theme.palette.primary.main,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '100%',
              [theme.breakpoints.down('sm')]: {
                fontSize: '1.5rem',
                whiteSpace: 'normal',
                wordBreak: 'break-word',
              },
              [theme.breakpoints.up('sm')]: {
                whiteSpace: 'nowrap',
              },
            })}
          >
            {setName}
          </Typography>

          {username && (
            <Typography variant="body1" color="text.secondary" sx={{ m: 0.5 }}>
              (Part of{' '}
              <Link
                href={getCollectionUrl({ userId })}
                style={{
                  color: 'inherit',
                  textDecoration: 'underline',
                }}
              >
                {username}'s collection
              </Link>
              )
            </Typography>
          )}

          {set?.code && (
            <Box>
              <SetIcon code={set.code} size="5x" fixedWidth />
            </Box>
          )}

          {set && set.uniquePrintingsCollectedInSet !== undefined && (
            <>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 0 }}>
                {set.uniquePrintingsCollectedInSet}/
                {includeSubsetsInSets && set.cardCountIncludingSubsets
                  ? set.cardCountIncludingSubsets
                  : set.cardCount || '0'}
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                ({set.totalCardsCollectedInSet || 0} total cards collected
                {includeSubsetsInSets && set.cardCountIncludingSubsets ? ' including subsets' : ''})
              </Typography>

              <Typography variant="h6" color="text.secondary" sx={{}}>
                Set value:{' '}
                <Box component="span" sx={{ color: 'success.main' }}>
                  ${(set.totalValue || 0).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Box>
              </Typography>

              <Box sx={{ mt: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <CollectionProgressBar
                  percentage={set.percentageCollected || 0}
                  height={24}
                  showLabel={true}
                  labelFormat="long"
                  maxWidth="400px"
                />
              </Box>
            </>
          )}
        </Box>
      )}

      <Pagination
        {...browseController.paginationProps}
        hideContentTypeToggle={true}
        subsets={subsets}
        onSubsetSelect={handleSubsetSelect}
        additionalAction={
          <>
            {isOwnCollection && browseController.view === 'cards' && !selectedGoalId && (
              <MassUpdateButton
                onClick={handleMassUpdateToggle}
                isOpen={isMassUpdateOpen}
                disabled={isMassUpdateLoading}
              />
            )}
            {isOwnCollection && (
              <ShareCollectionButton
                userId={userId.toString()}
                username={username || user?.username || 'User'}
                isPublic={user?.isPublic || false}
                collectionName={set?.name}
                setSlug={setSlug}
              />
            )}
          </>
        }
      />

      {/* Mass Update Panel */}
      {isOwnCollection && browseController.view === 'cards' && !selectedGoalId && (
        <MassUpdatePanel
          isOpen={isMassUpdateOpen}
          onSubmit={handleMassUpdateSubmit}
          onCancel={handleMassUpdateCancel}
          isLoading={isMassUpdateLoading}
        />
      )}

      {browseController.error ? (
        hasInvalidShareLink ? (
          <InvalidShareLinkBanner username={browseController.cardsProps?.username} />
        ) : browseController.error?.data?.error?.code === 'COLLECTION_PRIVATE' ? (
          <PrivacyErrorBanner username={browseController.cardsProps?.username} />
        ) : (
          <ErrorBanner type={browseController.view} />
        )
      ) : (
        <Box
          sx={{
            opacity: cardsProps?.isFetching ? 0 : 1,
            transition: 'opacity 0.2s ease-in-out',
            minHeight: cardsProps?.items?.length ? 'auto' : '400px',
          }}
        >
          {isCardGridView && <CardGrid {...cardsProps} isOwnCollection={isOwnCollection} goalId={selectedGoalId ? selectedGoalId.toString() : undefined} />}
          {isCardTableView && <CardTable {...cardsProps} isOwnCollection={isOwnCollection} goalId={selectedGoalId ? selectedGoalId.toString() : undefined} />}
        </Box>
      )}

      <Pagination {...browseController.paginationProps} position="bottom" hideContentTypeToggle={true} />

      {subsets.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" fontWeight="500" sx={{ mb: 3, color: (theme) => theme.palette.primary.main }}>
            Subsets
          </Typography>
          {subsets.map((subset) => (
            <SubsetSection
              key={subset.id}
              subset={subset}
              searchParams={cardSearchParams}
              isOwnCollection={isOwnCollection}
              userId={userId}
              goalId={selectedGoalId || undefined}
              ref={(el) => {
                if (el) {
                  subsetRefs.current[subset.id] = el;
                }
              }}
              onRegisterToggle={(toggleFn) => {
                subsetToggleRefs.current[subset.id] = toggleFn;
              }}
            />
          ))}
        </Box>
      )}

      {/* Mass Update Confirm Dialog */}
      {massUpdateFormData && (
        <MassUpdateConfirmDialog
          open={showConfirmDialog}
          onConfirm={handleConfirmMassUpdate}
          onCancel={handleCancelConfirm}
          formData={massUpdateFormData}
          setName={set?.name}
          isLoading={isMassUpdateLoading}
        />
      )}
    </Box>
  );
};
