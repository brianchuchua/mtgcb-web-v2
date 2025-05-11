import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  selectSortBy, 
  selectSortOrder, 
  setSortBy, 
  setSortOrder 
} from '@/redux/slices/browseSlice';
import { SortByOption } from '@/types/browse';

/**
 * Manages sorting state for browse tables
 * Handles column click logic to toggle sort direction
 */
export function useSort() {
  const dispatch = useDispatch();
  const sortBy = useSelector(selectSortBy) || 'releasedAt';
  const sortOrder = useSelector(selectSortOrder) || 'asc';

  const handleSort = useCallback((columnId: string) => {
    if (!columnId) return;

    const isClickingCurrentSortColumn = columnId === sortBy;
    if (isClickingCurrentSortColumn) {
      const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
      dispatch(setSortOrder(newOrder));
    } else {
      dispatch(setSortBy(columnId as SortByOption));
      dispatch(setSortOrder('asc'));
    }
  }, [dispatch, sortBy, sortOrder]);

  return {
    sortBy,
    sortOrder,
    handleSort
  };
}