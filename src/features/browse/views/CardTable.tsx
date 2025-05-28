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
  isOwnCollection = false,
}) => {
  const tableColumns = useCardTableColumns(
    { priceType, displaySettings: tableSettings },
    sortBy,
  );

  const renderCardRow = useCardRowRenderer(priceType, tableSettings, onCardClick);

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
      onClick={onCardClick}
      getItemId={(card) => card.id}
    />
  );
};

export default CardTable;