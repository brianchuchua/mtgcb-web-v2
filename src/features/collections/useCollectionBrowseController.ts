import { useEffect } from 'react';
import { BrowseControllerResult } from '@/features/browse/types';
import { useBrowseController } from '@/features/browse/useBrowseController';
import { useAppDispatch } from '@/redux/hooks';
import { setViewContentType } from '@/redux/slices/browseSlice';

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
  const browseController = useBrowseController({ 
    skipCostToComplete: true,
    userId 
  });

  // Force view to sets for collections page
  useEffect(() => {
    dispatch(setViewContentType('sets'));
  }, [dispatch]);

  return {
    ...browseController,
    userId,
  };
};