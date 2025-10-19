import { useRef } from 'react';
import { useSelector } from 'react-redux';
import { BrowseControllerResult } from '@/features/browse/types';
import { useBrowseController } from '@/features/browse/useBrowseController';
import { useCollectionDisplaySettings } from '@/features/collections/hooks/useCollectionDisplaySettings';
import { useViewMode } from '@/features/browse/hooks';
import { selectViewContentType, selectSets, selectSelectedGoalId } from '@/redux/slices/browse';

interface UseCollectionBrowseControllerProps {
  userId: number;
  isSetSpecificPage?: boolean; // True when on /collections/[userId]/[setSlug]
  skipCardsUntilReady?: boolean; // Skip fetching cards until ready
}

export interface CollectionBrowseController extends BrowseControllerResult {
  userId: number;
}

export const useCollectionBrowseController = ({
  userId,
  isSetSpecificPage = false,
  skipCardsUntilReady = false,
}: UseCollectionBrowseControllerProps): CollectionBrowseController => {
  const reduxView = useSelector(selectViewContentType);
  // On set-specific pages, always use 'cards' view
  const currentView = isSetSpecificPage ? 'cards' : (reduxView ?? 'sets');
  const selectedGoalId = useSelector(selectSelectedGoalId);
  const { viewMode } = useViewMode(currentView);

  // Track previous Redux and URL goalIds to detect sync direction
  const prevSelectedGoalIdRef = useRef(selectedGoalId);

  // Check if we're waiting for goalId from URL
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const hasGoalInUrl = searchParams?.get('goalId') !== null;
  const goalIdFromUrl = searchParams?.get('goalId') ? parseInt(searchParams.get('goalId')!) : null;
  const prevUrlGoalIdRef = useRef(goalIdFromUrl);

  // Detect what changed
  const reduxChanged = prevSelectedGoalIdRef.current !== selectedGoalId;
  const urlChanged = prevUrlGoalIdRef.current !== goalIdFromUrl;

  // Only wait when URL changed (external navigation) but Redux didn't (hasn't synced yet)
  // Don't wait when Redux changed (user action) - URL will update async
  const isWaitingForGoalSync = urlChanged && !reduxChanged && hasGoalInUrl && goalIdFromUrl !== selectedGoalId;

  // Update refs for next render
  prevSelectedGoalIdRef.current = selectedGoalId;
  prevUrlGoalIdRef.current = goalIdFromUrl;
  
  
  // Use collection-specific display settings
  const collectionDisplaySettings = useCollectionDisplaySettings({ viewMode, view: currentView });
  
  const browseController = useBrowseController({
    skipCostToComplete: true,
    userId,
    // Only wait for set filter on set-specific pages when viewing cards
    waitForSetFilter: isSetSpecificPage && currentView === 'cards',
    // Skip until goalId is synced from URL or until set is ready
    skipCardsUntilReady: (isWaitingForGoalSync && currentView === 'cards') || skipCardsUntilReady,
    waitForInitialLoad: isWaitingForGoalSync
  });

  // Override the display settings with collection-specific ones
  const customBrowseController = {
    ...browseController,
    userId,
  };
  
  // If we have setsProps, override the displaySettings
  if ('setsProps' in customBrowseController && customBrowseController.setsProps && 'displaySettings' in customBrowseController.setsProps) {
    customBrowseController.setsProps.displaySettings = collectionDisplaySettings.setDisplaySettings;
  }
  
  // If we have cardsProps, override the displaySettings to include quantity visibility
  if ('cardsProps' in customBrowseController && customBrowseController.cardsProps && 'gallerySettings' in customBrowseController.cardsProps) {
    customBrowseController.cardsProps.gallerySettings = collectionDisplaySettings.gallerySettings;
    customBrowseController.cardsProps.tableSettings = collectionDisplaySettings.tableSettings;
    // Merge cardDisplaySettings to preserve goalProgressIsVisible from browse controller
    customBrowseController.cardsProps.cardDisplaySettings = {
      ...customBrowseController.cardsProps.cardDisplaySettings,
      ...collectionDisplaySettings.cardDisplaySettings,
    };
  }
  
  // Override pagination props to include collection-specific settings
  if ('paginationProps' in customBrowseController && customBrowseController.paginationProps) {
    customBrowseController.paginationProps.settingGroups = collectionDisplaySettings.settingGroups;
  }

  return customBrowseController;
};