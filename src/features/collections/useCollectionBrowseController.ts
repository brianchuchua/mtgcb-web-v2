import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { BrowseControllerResult } from '@/features/browse/types';
import { useBrowseController } from '@/features/browse/useBrowseController';
import { useCollectionDisplaySettings } from '@/features/collections/hooks/useCollectionDisplaySettings';
import { useViewMode } from '@/features/browse/hooks';
import { useAppDispatch } from '@/redux/hooks';
import { setViewContentType, selectViewContentType } from '@/redux/slices/browseSlice';

interface UseCollectionBrowseControllerProps {
  userId: number;
}

export interface CollectionBrowseController extends BrowseControllerResult {
  userId: number;
}

export const useCollectionBrowseController = ({
  userId,
}: UseCollectionBrowseControllerProps): CollectionBrowseController => {
  const dispatch = useAppDispatch();
  const currentView = useSelector(selectViewContentType) ?? 'sets';
  const { viewMode } = useViewMode(currentView);
  
  // Use collection-specific display settings
  const collectionDisplaySettings = useCollectionDisplaySettings({ viewMode });
  
  const browseController = useBrowseController({ 
    skipCostToComplete: true,
    userId 
  });

  // Force view to sets for collections page
  useEffect(() => {
    dispatch(setViewContentType('sets'));
  }, [dispatch]);

  // Override the display settings with collection-specific ones
  const customBrowseController = {
    ...browseController,
    userId,
  };
  
  // If we have setsProps, override the displaySettings
  if ('setsProps' in customBrowseController && customBrowseController.setsProps && 'displaySettings' in customBrowseController.setsProps) {
    customBrowseController.setsProps.displaySettings = collectionDisplaySettings.setDisplaySettings;
  }
  
  // Override pagination props to include collection-specific settings
  if ('paginationProps' in customBrowseController && customBrowseController.paginationProps) {
    customBrowseController.paginationProps.settingGroups = collectionDisplaySettings.settingGroups;
  }

  return customBrowseController;
};