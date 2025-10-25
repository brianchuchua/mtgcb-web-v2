'use client';

import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import SetItemRenderer from './SetItemRenderer';
import { useSetTableRenderers, extractSetCellValue } from './SetTableRenderer';
import { CostToComplete } from '@/api/sets/types';
import VirtualizedRowGallery from '@/components/common/VirtualizedRowGallery';
import VirtualizedTable from '@/components/common/VirtualizedTable';
import {
  selectIncludeSubsetsInSets,
  selectSortBy,
  selectSortOrder,
  setSortBy,
  setSortOrder,
} from '@/redux/slices/browse';
import { SortByOption } from '@/types/browse';
import { Set } from '@/types/sets';

export interface SetDisplayProps {
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
      costsIsVisible?: boolean;
      setsPerRow?: number;
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
  costToCompleteData?:
    | Record<string, CostToComplete>
    | {
        sets: Array<Set & { costToComplete?: CostToComplete; cardCountIncludingSubsets?: number }>;
      };
  includeSubsetsInSets?: boolean;
  'data-testid'?: string;
}

const SetDisplay: React.FC<SetDisplayProps> = ({
  setItems,
  isLoading,
  viewMode,
  onSetClick,
  pageSize,
  displaySettings,
  costToCompleteData,
  'data-testid': dataTestId,
}) => {
  const dispatch = useDispatch();
  const currentSortBy = useSelector(selectSortBy) || 'releasedAt';
  const currentSortOrder = useSelector(selectSortOrder) || 'desc';
  const includeSubsetsInSets = useSelector(selectIncludeSubsetsInSets);


  const displaySets = setItems;

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

  // CSV Export handler
  const handleExtractCellValue = useCallback((item: any, columnId: string) => {
    return extractSetCellValue(item, columnId);
  }, []);

  // Generate dynamic filename based on context
  const generateFileName = () => {
    const today = new Date().toISOString().split('T')[0];
    return `mtgcb-sets-browse-${today}.csv`;
  };

  if (viewMode === 'grid') {
    return (
      <VirtualizedRowGallery
        key="browse-set-gallery"
        items={displaySets}
        data-testid={dataTestId}
        renderItem={(set, index) => {
          const targetSet =
            costToCompleteData && 'sets' in costToCompleteData && Array.isArray(costToCompleteData.sets)
              ? costToCompleteData.sets.find(
                  (s: Set & { costToComplete?: CostToComplete; cardCountIncludingSubsets?: number }) => s.id === set.id,
                )
              : undefined;
          const costToComplete = targetSet?.costToComplete;
          const cardCountIncludingSubsets = targetSet?.cardCountIncludingSubsets;
          return (
            <SetItemRenderer
              set={set}
              settings={displaySettings.grid}
              costToComplete={costToComplete}
              includeSubsetsInSets={includeSubsetsInSets}
              cardCountIncludingSubsets={cardCountIncludingSubsets}
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
      exportable={true}
      exportFileName={generateFileName()}
      onExtractCellValue={handleExtractCellValue}
    />
  );
};

export default SetDisplay;
