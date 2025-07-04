'use client';

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CollectionSetItemRenderer } from './CollectionSetItemRenderer';
import { CollectionSetSummary } from '@/api/collections/types';
import { useCollectionSetTableRenderers } from '@/components/collections/CollectionSetTableRenderer';
import VirtualizedRowGallery from '@/components/common/VirtualizedRowGallery';
import VirtualizedTable from '@/components/common/VirtualizedTable';
import { SetDisplayProps } from '@/components/sets/SetDisplay';
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
  goalId?: number;
}

const CollectionSetDisplayComponent: React.FC<CollectionSetDisplayProps> = ({
  setItems,
  isLoading,
  viewMode,
  onSetClick,
  pageSize,
  displaySettings,
  costToCompleteData,
  collectionData,
  goalId,
}) => {
  const dispatch = useDispatch();
  const currentSortBy = useSelector(selectSortBy) || 'releasedAt';
  const currentSortOrder = useSelector(selectSortOrder) || 'desc';
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

  // Get the appropriate renderers for table view with collection-specific columns
  const { columns, renderRowContent } = useCollectionSetTableRenderers(
    displaySettings.table,
    currentSortBy,
    onSetClick,
  );

  // Handle sort change
  const handleSortChange = (columnId: string) => {
    if (columnId) {
      const isClickingCurrentSortColumn = columnId === currentSortBy;
      if (isClickingCurrentSortColumn) {
        const newOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
        dispatch(setSortOrder(newOrder));
      } else {
        dispatch(setSortBy(columnId as SortByOption));
        // Default to 'desc' for date-based columns, 'asc' for others
        const defaultOrder = columnId === 'releasedAt' ? 'desc' : 'asc';
        dispatch(setSortOrder(defaultOrder));
      }
    }
  };

  if (viewMode === 'grid') {
    return (
      <VirtualizedRowGallery
        key="browse-collection-set-gallery"
        items={displaySets}
        renderItem={(set) => {
          const isSkeletonItem = (set as any).isLoadingSkeleton;
          
          // For skeletons, create mock collection data
          const mockCollectionData = isSkeletonItem ? {
            id: set.id,
            setId: set.id,
            name: set.name || 'Placeholder Set',
            slug: set.slug || 'placeholder',
            code: set.code || 'XXX',
            setType: set.setType || 'expansion',
            cardCount: 250,
            category: set.category || 'core',
            releasedAt: set.releasedAt || '2024-01-01',
            sealedProductUrl: set.sealedProductUrl || '',
            isDraftable: set.isDraftable || false,
            subsetGroupId: null,
            isSubsetGroup: false,
            parentSetId: null,
            uniquePrintingsCollectedInSet: 100,
            totalCardsCollectedInSet: 150,
            percentageCollected: 40,
            cardCountIncludingSubsets: 300,
            costToComplete: {
              oneOfEachCard: 150,
              oneOfEachMythic: 50,
              oneOfEachRare: 80,
              oneOfEachUncommon: 15,
              oneOfEachCommon: 5,
              fourOfEachCard: 600,
              fourOfEachMythic: 200,
              fourOfEachRare: 320,
              fourOfEachUncommon: 60,
              fourOfEachCommon: 20,
              draftCube: 400,
              totalValue: 1000,
            },
          } as CollectionSetSummary : undefined;
          
          const collectionSet = isSkeletonItem ? mockCollectionData : collectionData?.collectionSets.get(set.id);
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
              goalId={goalId}
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
    />
  );
};

export const CollectionSetDisplay = React.memo(CollectionSetDisplayComponent);
