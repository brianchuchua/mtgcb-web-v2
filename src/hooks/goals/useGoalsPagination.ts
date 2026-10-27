import { useCallback, useEffect, useState } from 'react';
import { safeLocalStorage } from '@/utils/browser/safeStorage';

const STORAGE_KEY = 'mtgcb-goals-pagination';
const DEFAULT_PAGE_SIZE = 9;

interface GoalsPaginationState {
  pageSize: number;
}

interface UseGoalsPaginationReturn {
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  resetPagination: () => void;
}

export const useGoalsPagination = (): UseGoalsPaginationReturn => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // Load page size from localStorage on mount
  useEffect(() => {
    const stored = safeLocalStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const state: GoalsPaginationState = JSON.parse(stored);
        if (state.pageSize && state.pageSize > 0) {
          setPageSize(state.pageSize);
        }
      } catch (e) {
        console.error('Failed to parse goals pagination state:', e);
      }
    }
  }, []);

  const onPageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Saved here rather than in an effect: an effect would write the default back on mount
  // and, under Strict Mode's double mount, the stored size would be lost.
  const onPageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    const state: GoalsPaginationState = { pageSize: newPageSize };
    safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    setCurrentPage(1); // Reset to first page when page size changes
  }, []);

  const resetPagination = useCallback(() => {
    setCurrentPage(1);
  }, []);

  return {
    currentPage,
    pageSize,
    onPageChange,
    onPageSizeChange,
    resetPagination,
  };
};