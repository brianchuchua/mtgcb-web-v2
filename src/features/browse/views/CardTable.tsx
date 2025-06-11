'use client';

import React from 'react';
import VirtualizedTable from '@/components/common/VirtualizedTable';
import { useCardRowRenderer, useCardTableColumns } from '@/components/cards/CardTableRenderer';
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
  };
  cardDisplaySettings?: {
    goalProgressIsVisible?: boolean;
  };
  isOwnCollection?: boolean;
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
}) => {
  // Merge table settings with card display settings
  const mergedDisplaySettings = {
    ...tableSettings,
    ...cardDisplaySettings,
  };

  const tableColumns = useCardTableColumns(
    { priceType, displaySettings: mergedDisplaySettings },
    sortBy,
  );

  const renderCardRow = useCardRowRenderer(priceType, mergedDisplaySettings, onCardClick, isOwnCollection);

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
      emptyMessage="No cards found"
      computeItemKey={(index) => items[index]?.id || index}
    />
  );
};

export default CardTable;