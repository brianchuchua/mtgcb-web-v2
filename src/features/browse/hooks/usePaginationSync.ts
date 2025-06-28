import { useCallback, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useBrowseStateSync } from '@/hooks/useBrowseStateSync';
import { useCardsPageSize } from '@/hooks/useCardsPageSize';
import { useSetsPageSize } from '@/hooks/useSetsPageSize';
import { selectViewContentType } from '@/redux/slices/browseSlice';

/**
 * Manages pagination state with localStorage persistence
 * Wraps useBrowseStateSync to provide a consistent interface
 */
export function usePaginationSync() {
  const { pagination, updatePagination, isReady } = useBrowseStateSync();
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const viewType = useSelector(selectViewContentType);

  const [, setCardsPageSize, ] = useCardsPageSize();
  const [, setSetsPageSize, ] = useSetsPageSize();
  
  // Set initialLoadComplete to true once localStorage is ready
  useEffect(() => {
    if (isReady && !initialLoadComplete) {
      setInitialLoadComplete(true);
    }
  }, [isReady, initialLoadComplete]);
  

  const handlePageChange = useCallback(
    (page: number) => {
      const validPage = Math.max(page, 1);
      updatePagination({ currentPage: validPage });
    },
    [updatePagination],
  );

  const handlePageSizeChange = useCallback(
    (size: number) => {
      const limitedSize = Math.min(Math.max(size, 1), 500);

      updatePagination({ pageSize: limitedSize, currentPage: 1 });

      if (viewType === 'cards') {
        setCardsPageSize(limitedSize);
      } else {
        setSetsPageSize(limitedSize);
      }
    },
    [updatePagination, viewType, setCardsPageSize, setSetsPageSize],
  );

  return {
    pagination,
    updatePagination,
    initialLoadComplete,
    setInitialLoadComplete,
    handlePageChange,
    handlePageSizeChange,
  };
}
