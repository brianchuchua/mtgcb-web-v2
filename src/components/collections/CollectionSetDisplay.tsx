'use client';

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CollectionSetItemRenderer } from './CollectionSetItemRenderer';
import { useSetTableRenderers } from '@/components/sets/SetTableRenderer';
import VirtualizedGallery from '@/components/common/VirtualizedGallery';
import VirtualizedTable from '@/components/common/VirtualizedTable';
import { SetDisplayProps } from '@/components/sets/SetDisplay';
import { CollectionSetSummary } from '@/api/collections/types';
import {
  selectIncludeSubsetsInSets,
  selectSortBy,
  selectSortOrder,
  setSortBy,
  setSortOrder,
} from '@/redux/slices/browseSlice';
import { SortByOption } from '@/types/browse';
import { Set } from '@/types/sets';

export interface CollectionSetDisplayProps extends Omit<SetDisplayProps, 'setItems'> {
  setItems: Set[];
  collectionData: {
    userId: number;
    collectionSets: Map<string, CollectionSetSummary>;
  } | null;
}

export const CollectionSetDisplay: React.FC<CollectionSetDisplayProps> = ({
  setItems,
  isLoading,
  viewMode,
  onSetClick,
  pageSize,
  displaySettings,
  costToCompleteData,
  collectionData,
}) => {
  const dispatch = useDispatch();
  const currentSortBy = useSelector(selectSortBy) || 'name';
  const currentSortOrder = useSelector(selectSortOrder) || 'asc';
  const includeSubsetsInSets = useSelector(selectIncludeSubsetsInSets);

  // Create skeleton loading items if needed
  const displaySets = isLoading
    ? Array(pageSize)
        .fill(0)
        .map(
          (_, index) =>
            ({
              id: `skeleton-${index}`,
              name: '',
              slug: '',
              code: '',
              scryfallId: '',
              tcgplayerId: null,
              setType: '',
              category: '',
              releasedAt: null,
              cardCount: 0,
              isDraftable: false,
              isLoadingSkeleton: true,
            }) as unknown as Set,
        )
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
        key="browse-collection-set-gallery"
        items={displaySets}
        renderItem={(set) => {
          const collectionSet = collectionData?.collectionSets.get(set.id);
          const costToComplete = collectionSet?.costToComplete;
          const cardCountIncludingSubsets = collectionSet?.cardCountIncludingSubsets;
          
          return (
            <CollectionSetItemRenderer
              set={set}
              settings={displaySettings.grid}
              costToComplete={costToComplete}
              includeSubsetsInSets={includeSubsetsInSets}
              cardCountIncludingSubsets={cardCountIncludingSubsets?.toString()}
              collectionData={collectionSet}
              userId={collectionData?.userId}
            />
          );
        }}
        isLoading={isLoading}
        columnsPerRow={displaySettings.grid.setsPerRow !== undefined ? displaySettings.grid.setsPerRow : 4}
        galleryWidth={100}
        horizontalPadding={0}
        emptyMessage="No sets found"
        computeItemKey={(index) => displaySets[index]?.id || index}
      />
    );
  }

  // For table view, we'll use the standard table renderer for now
  // TODO: Enhance table view with collection data
  return (
    <VirtualizedTable
      key="browse-collection-set-table"
      items={displaySets}
      columns={columns}
      renderRowContent={renderRowContent}
      isLoading={isLoading}
      sortBy={currentSortBy}
      sortOrder={currentSortOrder}
      onSortChange={handleSortChange}
      emptyMessage="No sets found"
      computeItemKey={(index) => displaySets[index]?.id || index}
      onClick={(itemId: string) => {
        const set = displaySets.find((s) => s.id === itemId);
        if (set && !('isLoadingSkeleton' in set)) {
          onSetClick(set);
        }
      }}
      getItemId={(set) => set.id}
    />
  );
};