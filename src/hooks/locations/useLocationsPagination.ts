import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'mtgcb-locations-pagination';
const DEFAULT_PAGE_SIZE = 9;

interface LocationsPaginationState {
  pageSize: number;
}

interface UseLocationsPaginationReturn {
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  resetPagination: () => void;
}

export const useLocationsPagination = (): UseLocationsPaginationReturn => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // Load page size from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const state: LocationsPaginationState = JSON.parse(stored);
        if (state.pageSize && state.pageSize > 0) {
          setPageSize(state.pageSize);
        }
      } catch (e) {
        console.error('Failed to parse locations pagination state:', e);
      }
    }
  }, []);

  // Save page size to localStorage whenever it changes
  useEffect(() => {
    const state: LocationsPaginationState = { pageSize };
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