import { useSelector } from 'react-redux';
import { BrowseControllerResult } from '@/features/browse/types';
import { useBrowseController } from '@/features/browse/useBrowseController';
import { useCollectionDisplaySettings } from '@/features/collections/hooks/useCollectionDisplaySettings';
import { useViewMode } from '@/features/browse/hooks';
import { selectViewContentType } from '@/redux/slices/browseSlice';

interface UseCollectionBrowseControllerProps {
  userId: number;
}

export interface CollectionBrowseController extends BrowseControllerResult {
  userId: number;
}

export const useCollectionBrowseController = ({
  userId,
}: UseCollectionBrowseControllerProps): CollectionBrowseController => {
  const currentView = useSelector(selectViewContentType) ?? 'sets';
  const { viewMode } = useViewMode(currentView);
  
  // Use collection-specific display settings
  const collectionDisplaySettings = useCollectionDisplaySettings({ viewMode, view: currentView });
  
  const browseController = useBrowseController({ 
    skipCostToComplete: true,
    userId 
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