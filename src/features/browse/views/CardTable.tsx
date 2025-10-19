'use client';

import React from 'react';
import { useCardRowRenderer, useCardTableColumns } from '@/components/cards/CardTableRenderer';
import VirtualizedTable from '@/components/common/VirtualizedTable';
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

    return { isIncomplete: !!isIncomplete };
  };

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
      computeItemKey={(index) => items[index]?.id || index}
      getRowProps={getRowProps}
    />
  );
};

export default CardTable;
