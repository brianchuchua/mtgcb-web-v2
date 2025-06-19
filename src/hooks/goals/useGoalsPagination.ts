import { useCallback, useEffect, useState } from 'react';

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
    const stored = localStorage.getItem(STORAGE_KEY);
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

  // Save page size to localStorage whenever it changes
  useEffect(() => {
    const state: GoalsPaginationState = { pageSize };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [pageSize]);

  const onPageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const onPageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
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