'use client';

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import SetItemRenderer from './SetItemRenderer';
import { useSetTableRenderers } from './SetTableRenderer';
import { CostToComplete } from '@/api/sets/types';
import VirtualizedGallery from '@/components/common/VirtualizedGallery';
import VirtualizedTable from '@/components/common/VirtualizedTable';
import { selectSortBy, selectSortOrder, setSortBy, setSortOrder } from '@/redux/slices/browseSlice';
import { SortByOption } from '@/types/browse';
import { Set } from '@/types/sets';

interface SetDisplayProps {
  setItems: Set[];
  isLoading: boolean;
  viewMode: 'grid' | 'table';
  onSetClick: (set: Set) => void;
  pageSize: number;
  displaySettings: {
    grid: {
      nameIsVisible?: boolean;
      codeIsVisible?: boolean;
      releaseDateIsVisible?: boolean;
      typeIsVisible?: boolean;
      categoryIsVisible?: boolean;
      cardCountIsVisible?: boolean;
    };
    table: {
      codeIsVisible?: boolean;
      cardCountIsVisible?: boolean;
      releaseDateIsVisible?: boolean;
      typeIsVisible?: boolean;
      categoryIsVisible?: boolean;
      isDraftableIsVisible?: boolean;
    };
  };
  costToCompleteData?: {
    sets: Array<Set & { costToComplete?: CostToComplete }>;
  };
}

const SetDisplay: React.FC<SetDisplayProps> = ({
  setItems,
  isLoading,
  viewMode,
  onSetClick,
  pageSize,
  displaySettings,
  costToCompleteData,
}) => {
  const dispatch = useDispatch();
  const currentSortBy = useSelector(selectSortBy) || 'name';
  const currentSortOrder = useSelector(selectSortOrder) || 'asc';

  // Create skeleton loading items if needed
  const displaySets = isLoading
    ? Array(pageSize)
        .fill(0)
        .map((_, index) => ({
          id: `skeleton-${index}`,
          name: '',
          slug: '',
          code: '',
          isLoadingSkeleton: true,
        }))
    : setItems;

  // Get the appropriate renderers for table view
  const { columns, renderRowContent } = useSetTableRenderers(displaySettings.table, currentSortBy, onSetClick);

  // Handle sort change
  const handleSortChange = (columnId: string) => {
    if (columnId) {
      const isClickingCurrentSortColumn = columnId === currentSortBy;
      if (isClickingCurrentSortColumn) {
        const newOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
        dispatch(setSortOrder(newOrder));
      } else {
        dispatch(setSortBy(columnId as SortByOption));
        dispatch(setSortOrder('asc'));
      }
    }
  };

  if (viewMode === 'grid') {
    return (
      <VirtualizedGallery
        key="browse-set-gallery"
        items={displaySets}
        renderItem={(set, index) => {
          // Find the cost to complete data for this set
          const costToComplete = costToCompleteData?.sets?.find(s => s.id === set.id)?.costToComplete;
          
          return <SetItemRenderer 
            set={set} 
            settings={displaySettings.grid} 
            costToComplete={costToComplete}
          />;
        }}
        isLoading={isLoading}
        columnsPerRow={4} // Default to 4 sets per row
        galleryWidth={95}
        horizontalPadding={0}
        emptyMessage="No sets found"
        computeItemKey={(index) => displaySets[index]?.id || index}
      />
    );
  }

  // Table view
  return (
    <VirtualizedTable
      key="browse-set-table"
      items={displaySets}
      columns={columns}
      renderRowContent={renderRowContent}
      isLoading={isLoading}
      sortBy={currentSortBy}
      sortOrder={currentSortOrder}
      onSortChange={handleSortChange}
      emptyMessage="No sets found"
      computeItemKey={(index) => displaySets[index]?.id || index}
      onClick={onSetClick}
      getItemId={(set) => set.id}
    />
  );
};

export default SetDisplay;
