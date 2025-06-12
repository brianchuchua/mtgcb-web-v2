'use client';

import { Box, Typography } from '@mui/material';
import Link from 'next/link';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useGetSetsQuery } from '@/api/browse/browseApi';
import { useMassUpdateCollectionMutation } from '@/api/collections/collectionsApi';
import SubsetSection from '@/app/browse/sets/[setSlug]/SubsetSection';
import { CollectionHeader } from '@/components/collections/CollectionHeader';
import { CollectionProgressBar } from '@/components/collections/CollectionProgressBar';
import MassUpdateButton from '@/components/collections/MassUpdateButton';
import MassUpdatePanel, { MassUpdateFormData } from '@/components/collections/MassUpdatePanel';
import MassUpdateConfirmDialog from '@/components/collections/MassUpdateConfirmDialog';
import { Pagination } from '@/components/pagination';
import SubsetDropdown from '@/components/pagination/SubsetDropdown';
import SetIcon from '@/components/sets/SetIcon';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { CardsProps } from '@/features/browse/types/browseController';
import { CardGrid, CardTable, ErrorBanner } from '@/features/browse/views';
import { useCollectionBrowseController } from '@/features/collections/useCollectionBrowseController';
import { useAuth } from '@/hooks/useAuth';
import { useSetPriceType } from '@/hooks/useSetPriceType';
import { selectCardSearchParams, selectIncludeSubsetsInSets, selectSelectedGoalId, selectSets, setSets, setViewContentType } from '@/redux/slices/browseSlice';
import { SetFilter } from '@/types/browse';
import capitalize from '@/utils/capitalize';
import { formatISODate } from '@/utils/dateUtils';
import { useSnackbar } from 'notistack';

interface CollectionSetClientProps {
  userId: number;
  setSlug: string;
}

export const CollectionSetClient: React.FC<CollectionSetClientProps> = ({ userId, setSlug }) => {
  const dispatch = useDispatch();
  const browseController = useCollectionBrowseController({ userId });
  const subsetRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const subsetToggleRefs = useRef<Record<string, () => void>>({});
  const setPriceType = useSetPriceType();
  const { user } = useAuth();
  const isOwnCollection = user?.userId === userId;
  const { enqueueSnackbar } = useSnackbar();
  
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
  });

  const set = setsData?.data?.sets?.[0];

  const { data: subsetsData, isLoading: isSubsetsLoading } = useGetSetsQuery(
    {
      parentSetId: set?.id,
      limit: 100,
      userId: userId,
      goalId: selectedGoalId || undefined,
    },
    {
      skip: !set?.id,
    },
  );

  useEffect(() => {
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
        updates: [{
          rarity: massUpdateFormData.rarity,
          quantityReg: massUpdateFormData.quantityReg,
          quantityFoil: massUpdateFormData.quantityFoil,
        }],
      }).unwrap();

      if (response.success) {
        enqueueSnackbar(
          `Successfully updated ${response.data?.updatedCards || 0} cards in ${set.name}`,
          { variant: 'success' }
        );
        setIsMassUpdateOpen(false);
        setShowConfirmDialog(false);
        setMassUpdateFormData(null);
      }
    } catch (error: any) {
      enqueueSnackbar(
        error?.data?.error?.message || 'Failed to update collection',
        { variant: 'error' }
      );
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
        <Box sx={{ fontWeight: 'bold', fontSize: '1.5rem', mb: 2 }}>Set not found</Box>
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
      {/* Show CollectionHeader when viewing with a goal selected */}
      {selectedGoalId && collectionSummary && set && (
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
          setInfo={{
            name: set.name,
            code: set.code,
            id: set.id,
            uniquePrintingsCollectedInSet: set.uniquePrintingsCollectedInSet || 0,
            cardCount: set.cardCount || '0',
            totalCardsCollectedInSet: set.totalCardsCollectedInSet || 0,
            totalValue: set.totalValue || 0,
            percentageCollected: set.percentageCollected || 0,
            costToComplete: set.costToComplete?.oneOfEachCard || 0,
          }}
        />
      )}
      
      {/* Show regular set header when NOT viewing with a goal */}
      {!selectedGoalId && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <Typography
            variant="h4"
            fontWeight="500"
            sx={{
              color: (theme) => theme.palette.primary.main,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '100%',
            }}
          >
            {setName}
          </Typography>

          {username && (
            <Typography variant="body1" color="text.secondary" sx={{ m: 0.5 }}>
              (Part of{' '}
              <Link
                href={`/collections/${userId}?contentType=sets`}
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
                {set.uniquePrintingsCollectedInSet}/{includeSubsetsInSets && set.cardCountIncludingSubsets 
                  ? set.cardCountIncludingSubsets 
                  : set.cardCount || '0'}
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                ({set.totalCardsCollectedInSet || 0} total cards collected
                {includeSubsetsInSets && set.cardCountIncludingSubsets ? ' including subsets' : ''})
              </Typography>

              <Typography variant="h6" color="text.secondary" sx={{}}>
                Set value: $
                {(set.totalValue || 0).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
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
          isOwnCollection && browseController.view === 'cards' ? (
            <MassUpdateButton 
              onClick={handleMassUpdateToggle}
              isOpen={isMassUpdateOpen}
              disabled={isMassUpdateLoading}
            />
          ) : undefined
        }
      />

      {/* Mass Update Panel */}
      {isOwnCollection && browseController.view === 'cards' && (
        <MassUpdatePanel
          isOpen={isMassUpdateOpen}
          onSubmit={handleMassUpdateSubmit}
          onCancel={handleMassUpdateCancel}
          isLoading={isMassUpdateLoading}
        />
      )}

      {browseController.error ? (
        <ErrorBanner type={browseController.view} />
      ) : (
        <>
          {isCardGridView && <CardGrid {...cardsProps} isOwnCollection={isOwnCollection} />}
          {isCardTableView && <CardTable {...cardsProps} isOwnCollection={isOwnCollection} />}
        </>
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
