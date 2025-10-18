'use client';

import AutoFixHigh from '@mui/icons-material/AutoFixHigh';
import LocationOn from '@mui/icons-material/LocationOn';
import MoreVert from '@mui/icons-material/MoreVert';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { Box, Button, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Stack, Tooltip, Typography } from '@mui/material';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useSnackbar } from 'notistack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Confetti from 'react-confetti';
import { useDispatch, useSelector } from 'react-redux';
import { useGetSetByIdQuery, useGetSetsQuery } from '@/api/browse/browseApi';
import { useMassUpdateCollectionMutation, useMassUpdateLocationsMutation } from '@/api/collections/collectionsApi';
import { useGetLocationHierarchyQuery } from '@/api/locations/locationsApi';
import SubsetSection from '@/app/browse/sets/[setSlug]/SubsetSection';
import { SearchDescription } from '@/components/browse/SearchDescription';
import { CollectionHeader } from '@/components/collections/CollectionHeader';
import { CollectionProgressBar } from '@/components/collections/CollectionProgressBar';
import { InvalidShareLinkBanner } from '@/components/collections/InvalidShareLinkBanner';
import MassUpdateConfirmDialog from '@/components/collections/MassUpdateConfirmDialog';
import MassUpdatePanel, { MassUpdateFormData } from '@/components/collections/MassUpdatePanel';
import MassUpdateLocationPanel, { MassUpdateLocationFormData } from '@/components/collections/MassUpdateLocationPanel';
import { ShareCollectionButton } from '@/components/collections/ShareCollectionButton';
import { SharedCollectionBanner } from '@/components/collections/SharedCollectionBanner';
import { Pagination } from '@/components/pagination';
import SubsetDropdown from '@/components/pagination/SubsetDropdown';
import SetIcon from '@/components/sets/SetIcon';
import { SetNavigationButtons } from '@/components/sets/SetNavigationButtons';
import { SetPageBuyButton } from '@/components/sets/SetPageBuyButton';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { useShareTokenContext } from '@/contexts/ShareTokenContext';
import { CardsProps } from '@/features/browse/types/browseController';
import { CardGrid, CardTable, ErrorBanner, PrivacyErrorBanner } from '@/features/browse/views';
import InfoBanner from '@/features/browse/views/InfoBanner';
import { useCollectionBrowseController } from '@/features/collections/useCollectionBrowseController';
import { useAuth } from '@/hooks/useAuth';
import { useConfetti } from '@/hooks/useConfetti';
import { useInitialUrlSync } from '@/hooks/useInitialUrlSync';
import { useSetNavigation } from '@/hooks/useSetNavigation';
import { useSetPriceType } from '@/hooks/useSetPriceType';
import { clearSpecificSearchField } from '@/hooks/useSearchStateSync';
import {
  resetSearch,
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
import { getCollectionUrl } from '@/utils/collectionUrls';
import { formatISODate } from '@/utils/dateUtils';

interface CollectionSetClientProps {
  userId: number;
  setSlug: string;
}

export const CollectionSetClient: React.FC<CollectionSetClientProps> = ({ userId, setSlug }) => {
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const [isSetReady, setIsSetReady] = useState(false);

  // Sync goalId from URL to Redux on mount
  useInitialUrlSync({ syncView: false, syncGoalId: true });

  const browseController = useCollectionBrowseController({
    userId,
    isSetSpecificPage: true,
    // Skip cards until we have the correct set filter applied
    skipCardsUntilReady: !isSetReady
  });
  const subsetRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const subsetToggleRefs = useRef<Record<string, () => void>>({});
  const setPriceType = useSetPriceType();
  const { user } = useAuth();
  const { shareToken, isViewingSharedCollection } = useShareTokenContext();
  const isOwnCollection = user?.userId === userId;
  const { enqueueSnackbar } = useSnackbar();

  // Fetch user locations for the "Add card to location" button
  const { data: locationsResponse } = useGetLocationHierarchyQuery(undefined, {
    skip: !isOwnCollection,
  });
  const hasLocations = (locationsResponse?.data || []).length > 0;

  // Check if we have a share token but got a privacy error (403)
  const hasInvalidShareLink =
    shareToken &&
    isViewingSharedCollection(userId) &&
    browseController.error?.data?.error?.code === 'COLLECTION_PRIVATE';

  // Menu state
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const isMenuOpen = Boolean(menuAnchorEl);

  // Mass Update state
  const [isMassUpdateOpen, setIsMassUpdateOpen] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [massUpdateFormData, setMassUpdateFormData] = useState<MassUpdateFormData | null>(null);
  const [massUpdateCollection, { isLoading: isMassUpdateLoading }] = useMassUpdateCollectionMutation();

  // Mass Update Location state
  const [isMassUpdateLocationOpen, setIsMassUpdateLocationOpen] = useState(false);
  const [massUpdateLocations, { isLoading: isMassUpdateLocationLoading }] = useMassUpdateLocationsMutation();

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
  } = useGetSetsQuery(
    {
      limit: 1,
      slug: setSlug,
      userId: userId,
      priceType: setPriceType,
      includeSubsetsInSets,
      goalId: selectedGoalId || undefined,
    },
    {
      skip: isWaitingForGoalSync,
    },
  );

  const set = setsData?.data?.sets?.[0];
  const pathname = usePathname();

  const { data: parentSetData } = useGetSetByIdQuery(set?.parentSetId || '', {
    skip: !set?.parentSetId || isWaitingForGoalSync,
  });

  const parentSet = parentSetData?.data?.set;

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

  const { showConfetti, recycleConfetti, handleConfettiComplete } = useConfetti(
    isSetLoading || isSubsetsLoading,
    set?.percentageCollected || 0
  );

  // Clear filter immediately when setSlug changes
  useEffect(() => {
    setIsSetReady(false);
    dispatch(setSets({ include: [], exclude: [] }));
    // Clear sets filter from sessionStorage since this is page context, not user input
    clearSpecificSearchField('cards', 'sets');
  }, [setSlug, dispatch]);

  // Clean up filter when component unmounts
  useEffect(() => {
    return () => {
      dispatch(setSets({ include: [], exclude: [] }));
      // Clear sets filter from sessionStorage on unmount
      clearSpecificSearchField('cards', 'sets');
    };
  }, [dispatch]);

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
      // Mark that we have the correct filter now
      setIsSetReady(true);

      // Clear sets filter from sessionStorage since this is page context, not user input
      clearSpecificSearchField('cards', 'sets');
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

  // Menu handlers
  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setMenuAnchorEl(null);
  }, []);

  // Mass Update handlers
  const handleMassUpdateToggle = useCallback(() => {
    setIsMassUpdateOpen(!isMassUpdateOpen);
    setMenuAnchorEl(null);
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
            message += `These card${totalSkipped.cannotBeFoil !== 1 ? "s don't" : " doesn't"} exist in foil.`;
          } else if (totalSkipped.cannotBeNonFoil > 0) {
            message += `These card${totalSkipped.cannotBeNonFoil !== 1 ? "s don't" : " doesn't"} exist in non-foil.`;
          }

          enqueueSnackbar(message, {
            variant: 'warning',
            autoHideDuration: 6000, // Display for 6 seconds
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
              autoHideDuration: 6000, // Display for 6 seconds
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

  // Get visible card IDs for mass location update - only cards they own
  const ownedVisibleCardIds = React.useMemo(() => {
    if (browseController.view === 'cards' && browseController.cardsProps && 'items' in browseController.cardsProps) {
      return browseController.cardsProps.items
        .filter((card) => (card.quantityReg && card.quantityReg > 0) || (card.quantityFoil && card.quantityFoil > 0))
        .map((card) => parseInt(card.id));
    }
    return [];
  }, [browseController.view, browseController.cardsProps]);

  // Mass Update Location handlers
  const handleMassUpdateLocationToggle = useCallback(() => {
    setIsMassUpdateLocationOpen(!isMassUpdateLocationOpen);
    setMenuAnchorEl(null);
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

  const isCardGridView = browseController.view === 'cards' && browseController.viewMode === 'grid';
  const isCardTableView = browseController.view === 'cards' && browseController.viewMode === 'table';

  const cardsProps = browseController.cardsProps as CardsProps;

  if (isSetLoading) {
    return (
      <Box>
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Collection', href: getCollectionUrl({ userId }) },
            { label: 'Sets', href: getCollectionUrl({ userId, contentType: 'sets' }) },
          ]}
        />
        <Box sx={{ fontWeight: 'bold', fontSize: '1.5rem', mb: 2 }}></Box>
      </Box>
    );
  }

  if (!set && !isSetLoading) {
    const handleResetSearch = () => {
      dispatch(resetSearch());
    };

    return (
      <Box>
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Collection', href: getCollectionUrl({ userId }) },
            { label: 'Sets', href: getCollectionUrl({ userId, contentType: 'sets' }) },
            { label: 'Set not found' },
          ]}
        />
        <InfoBanner
          title="Set not found or no cards found in it matching your criteria"
          message="The requested set might not exist, or there are no cards that match your current filter settings."
          action={
            <Button variant="outlined" startIcon={<RestartAltIcon />} onClick={handleResetSearch}>
              Reset Search
            </Button>
          }
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
      {showConfetti && (
        <Confetti
          style={{ position: 'fixed', height: '100vh', width: '100vw', zIndex: 9999 }}
          gravity={0.1}
          recycle={recycleConfetti}
          run={true}
          numberOfPieces={400}
          onConfettiComplete={handleConfettiComplete}
        />
      )}
      {!hasInvalidShareLink && <SharedCollectionBanner username={username || 'User'} userId={userId} />}

      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Collection', href: getCollectionUrl({ userId }) },
          { label: 'Sets', href: getCollectionUrl({ userId, contentType: 'sets' }) },
          { label: setName || 'Loading...' },
        ]}
      />

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
          <SetNavigationButtons previousSet={previousSet} nextSet={nextSet} onNavigate={handleSetNavigation} />

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

          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              m: 0.5,
              minHeight: '24px', // Reserve space to prevent layout shift
              visibility: username ? 'visible' : 'hidden'
            }}
          >
            (Part of{' '}
            <Link
              href={getCollectionUrl({ userId })}
              style={{
                color: 'inherit',
                textDecoration: 'underline',
              }}
            >
              {username || 'User'}'s collection
            </Link>
            )
          </Typography>

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
                  $
                  {(set.totalValue || 0).toLocaleString('en-US', {
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

              <SetPageBuyButton
                set={set}
                costToComplete={set.costToComplete}
                includeSubsetsInSets={includeSubsetsInSets}
                userId={userId}
                isCollection={true}
              />
            </>
          )}
        </Box>
      )}

      <Pagination
        {...browseController.paginationProps}
        hideContentTypeToggle={true}
        subsets={subsets}
        onSubsetSelect={handleSubsetSelect}
        parentSet={parentSet}
        currentPath={pathname}
        userId={String(userId)}
        goalId={selectedGoalId ? String(selectedGoalId) : undefined}
        additionalAction={
          isOwnCollection && (
            <Stack direction="row" spacing={0.5}>
              <ShareCollectionButton
                userId={userId.toString()}
                username={username || user?.username || 'User'}
                isPublic={user?.isPublic || false}
                collectionName={set?.name}
                setSlug={setSlug}
              />
              {browseController.view === 'cards' && !selectedGoalId && (
                <>
                  <Tooltip title="More actions">
                    <IconButton
                      size="small"
                      onClick={handleMenuOpen}
                      disabled={isMassUpdateLoading}
                      sx={{
                        border: 1,
                        borderColor: (theme) => theme.palette.mode === 'dark'
                          ? 'rgba(144, 202, 249, 0.5)'
                          : 'rgba(25, 118, 210, 0.5)',
                        borderRadius: 1,
                        color: 'primary.main',
                        '&:hover': {
                          borderColor: 'primary.main',
                          backgroundColor: 'action.hover',
                        },
                      }}
                    >
                      <MoreVert />
                    </IconButton>
                  </Tooltip>
                  <Menu
                    anchorEl={menuAnchorEl}
                    open={isMenuOpen}
                    onClose={handleMenuClose}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'right',
                    }}
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                  >
                    <MenuItem onClick={handleMassUpdateToggle}>
                      <ListItemIcon>
                        <AutoFixHigh fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>Mass Update</ListItemText>
                    </MenuItem>
                    {hasLocations && ownedVisibleCardIds.length > 0 && (
                      <MenuItem onClick={handleMassUpdateLocationToggle}>
                        <ListItemIcon>
                          <LocationOn fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Locations</ListItemText>
                      </MenuItem>
                    )}
                  </Menu>
                </>
              )}
            </Stack>
          )
        }
      />
      <SearchDescription forceView="cards" />

      {/* Mass Update Panel */}
      {isOwnCollection && browseController.view === 'cards' && !selectedGoalId && (
        <>
          <MassUpdatePanel
            isOpen={isMassUpdateOpen}
            onSubmit={handleMassUpdateSubmit}
            onCancel={handleMassUpdateCancel}
            isLoading={isMassUpdateLoading}
          />
          <MassUpdateLocationPanel
            isOpen={isMassUpdateLocationOpen}
            onSubmit={handleMassUpdateLocationSubmit}
            onCancel={handleMassUpdateLocationCancel}
            isLoading={isMassUpdateLocationLoading}
            cardCount={ownedVisibleCardIds.length}
          />
        </>
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
        <>
          {isCardGridView && (
            <CardGrid
              {...cardsProps}
              isOwnCollection={isOwnCollection}
              goalId={selectedGoalId ? selectedGoalId.toString() : undefined}
              hasLocations={hasLocations}
            />
          )}
          {isCardTableView && (
            <CardTable
              {...cardsProps}
              isOwnCollection={isOwnCollection}
              goalId={selectedGoalId ? selectedGoalId.toString() : undefined}
              hasLocations={hasLocations}
            />
          )}
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
