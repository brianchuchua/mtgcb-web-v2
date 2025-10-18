import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  selectSortBy, 
  selectSortOrder, 
  selectViewContentType,
  setSortBy, 
  setSortOrder 
} from '@/redux/slices/browse';
import { SortByOption } from '@/types/browse';

/**
 * Manages sorting state for browse tables
 * Handles column click logic to toggle sort direction
 */
export function useSort() {
  const dispatch = useDispatch();
  const viewType = useSelector(selectViewContentType);
  const sortBy = useSelector(selectSortBy) || 'releasedAt';
  const sortOrder = useSelector(selectSortOrder) || (viewType === 'cards' ? 'asc' : 'desc');

  const handleSort = useCallback((columnId: string) => {
    if (!columnId) return;

    const isClickingCurrentSortColumn = columnId === sortBy;
    if (isClickingCurrentSortColumn) {
      const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
      dispatch(setSortOrder(newOrder));
    } else {
      dispatch(setSortBy(columnId as SortByOption));
      // Default sort order depends on view type and column
      let defaultOrder: 'asc' | 'desc';
      if (viewType === 'cards') {
        // For cards, default to asc for all columns
        defaultOrder = 'asc';
      } else {
        // For sets, default to desc for date columns, asc for others
        defaultOrder = columnId === 'releasedAt' ? 'desc' : 'asc';
      }
      dispatch(setSortOrder(defaultOrder));
    }
  }, [dispatch, sortBy, sortOrder, viewType]);

  return {
    sortBy,
    sortOrder,
    handleSort
  };
}