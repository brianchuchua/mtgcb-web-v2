import { useCallback, useState } from 'react';
import { useBrowseStateSync } from '@/hooks/useBrowseStateSync';

/**
 * Manages pagination state with URL synchronization
 * Wraps useBrowseStateSync to provide a consistent interface
 */
export function usePaginationSync() {
  const { pagination, updatePagination } = useBrowseStateSync();
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const handlePageChange = useCallback(
    (page: number) => {
      const validPage = Math.max(page, 1);
      updatePagination({ currentPage: validPage });
    },
    [updatePagination]
  );

  const handlePageSizeChange = useCallback(
    (size: number) => {
      const limitedSize = Math.min(Math.max(size, 1), 500);
      updatePagination({ pageSize: limitedSize, currentPage: 1 });
    },
    [updatePagination]
  );

  return {
    pagination,
    updatePagination,
    initialLoadComplete,
    setInitialLoadComplete,
    handlePageChange,
    handlePageSizeChange
  };
}