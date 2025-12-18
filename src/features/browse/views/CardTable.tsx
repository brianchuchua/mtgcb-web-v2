'use client';

import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { Button } from '@mui/material';
import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useCardRowRenderer, useCardTableColumns, extractCardCellValue } from '@/components/cards/CardTableRenderer';
import VirtualizedTable from '@/components/common/VirtualizedTable';
import InfoBanner from '@/features/browse/views/InfoBanner';
import { useRedGreenTableRows } from '@/contexts/DisplaySettingsContext';
import { resetSearch, clearSelectedGoal, clearSelectedLocation } from '@/redux/slices/browse';
import { PriceType } from '@/types/pricing';

interface CardTableProps {
  items: any[];
  loading: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (columnId: string) => void;
  onCardClick: (cardId: string) => void;
  priceType: PriceType;
  tableSettings: {
    setIsVisible: boolean;
    collectorNumberIsVisible: boolean;
    mtgcbNumberIsVisible: boolean;
    rarityIsVisible: boolean;
    typeIsVisible: boolean;
    artistIsVisible: boolean;
    manaCostIsVisible: boolean;
    powerIsVisible: boolean;
    toughnessIsVisible: boolean;
    loyaltyIsVisible: boolean;
    priceIsVisible: boolean;
    foilPriceIsVisible: boolean;
    locationsIsVisible?: boolean;
  };
  cardDisplaySettings?: {
    goalProgressIsVisible?: boolean;
    locationsIsVisible?: boolean;
  };
  isOwnCollection?: boolean;
  goalId?: string;
  hasLocations?: boolean;
}

const CardTable: React.FC<CardTableProps> = ({
  items,
  loading,
  sortBy,
  sortOrder,
  onSort,
  onCardClick,
  priceType,
  tableSettings,
  cardDisplaySettings,
  isOwnCollection = false,
  goalId,
  hasLocations = false,
}) => {
  const dispatch = useDispatch();
  const [redGreenTableRows] = useRedGreenTableRows();

  // Merge table settings with card display settings
  // For locations, prioritize tableSettings over cardDisplaySettings
  const mergedDisplaySettings = {
    ...cardDisplaySettings,
    ...tableSettings,
    locationsIsVisible: tableSettings.locationsIsVisible ?? cardDisplaySettings?.locationsIsVisible,
  };

  const tableColumns = useCardTableColumns(
    { priceType, displaySettings: mergedDisplaySettings },
    sortBy,
    isOwnCollection,
    hasLocations,
  );

  const renderCardRow = useCardRowRenderer(
    priceType,
    mergedDisplaySettings,
    onCardClick,
    isOwnCollection,
    goalId,
    hasLocations,
  );

  const getRowProps = (item: any) => {
    // Check if item exists and goal progress is visible and if the goal is not fully met
    const isIncomplete =
      item &&
      cardDisplaySettings?.goalProgressIsVisible &&
      (item.goalTargetQuantityReg || item.goalTargetQuantityFoil || item.goalTargetQuantityAll) &&
      item.goalFullyMet === false;

    // Calculate total quantity for red/green row coloring
    const totalQuantity = (item?.quantityReg || 0) + (item?.quantityFoil || 0);

    return { isIncomplete: !!isIncomplete, totalQuantity };
  };

  const handleResetSearch = () => {
    // Clear goal and location explicitly before resetting search
    // This ensures proper query invalidation (prevents double-click bug)
    dispatch(clearSelectedGoal());
    dispatch(clearSelectedLocation());

    // Reset all other search fields
    dispatch(resetSearch({ preserveGoal: false, preserveLocation: false }));
  };

  // CSV Export handler
  const handleExtractCellValue = useCallback(
    (item: any, columnId: string) => {
      return extractCardCellValue(item, columnId, priceType);
    },
    [priceType],
  );

  // Generate dynamic filename based on context
  const generateFileName = () => {
    const today = new Date().toISOString().split('T')[0];
    const context = isOwnCollection ? 'collection' : 'browse';
    return `mtgcb-cards-${context}-${today}.csv`;
  };

  const emptyStateComponent = (
    <InfoBanner
      title="No cards found matching your search criteria"
      message="Try adjusting your filters or search terms, or use the button below to reset all search criteria."
      action={
        <Button variant="outlined" startIcon={<RestartAltIcon />} onClick={handleResetSearch}>
          Reset Search
        </Button>
      }
    />
  );

  return (
    <VirtualizedTable
      key="browse-card-table"
      items={items}
      columns={tableColumns}
      renderRowContent={renderCardRow}
      isLoading={loading}
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSortChange={onSort}
      emptyMessage="No cards found matching your search criteria."
      emptyStateComponent={emptyStateComponent}
      computeItemKey={(index) => items[index]?.id || index}
      getRowProps={getRowProps}
      useRedGreenRows={redGreenTableRows}
      exportable={true}
      exportFileName={generateFileName()}
      onExtractCellValue={handleExtractCellValue}
    />
  );
};

export default CardTable;
