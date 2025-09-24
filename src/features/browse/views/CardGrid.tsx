'use client';

import React, { useCallback } from 'react';
import CardItemRenderer from '@/components/cards/CardItemRenderer';
import VirtualizedRowGallery from '@/components/common/VirtualizedRowGallery';
import { PriceType } from '@/types/pricing';

interface CardGridProps {
  items: any[];
  loading: boolean;
  onCardClick: (cardId: string) => void;
  pageSize: number;
  gallerySettings: {
    cardsPerRow: number;
    cardSizeMargin: number;
    nameIsVisible: boolean;
    setIsVisible: boolean;
    priceIsVisible: boolean;
  };
  cardDisplaySettings: {
    nameIsVisible: boolean;
    setIsVisible: boolean;
    priceIsVisible: boolean;
    goalProgressIsVisible?: boolean;
    locationsIsVisible?: boolean;
  };
  priceType: PriceType;
  isOwnCollection?: boolean;
  goalId?: string;
  hasLocations?: boolean;
}

const CardGridComponent: React.FC<CardGridProps> = ({
  items,
  loading,
  onCardClick,
  gallerySettings,
  cardDisplaySettings,
  priceType,
  isOwnCollection = false,
  goalId,
  hasLocations = false,
}) => {
  // Memoize the render function to prevent unnecessary re-renders
  const renderItem = useCallback(
    (card: any) => (
      <CardItemRenderer 
        card={card} 
        settings={cardDisplaySettings} 
        priceType={priceType} 
        onClick={onCardClick}
        isOwnCollection={isOwnCollection}
        goalId={goalId}
        hasLocations={hasLocations}
      />
    ),
    [cardDisplaySettings, priceType, onCardClick, isOwnCollection, goalId, hasLocations]
  );
  
  return (
    <VirtualizedRowGallery
      key="browse-card-gallery"
      items={items}
      renderItem={renderItem}
      isLoading={loading}
      columnsPerRow={gallerySettings.cardsPerRow}
      galleryWidth={100}
      horizontalPadding={gallerySettings.cardSizeMargin}
      emptyMessage="No cards found"
      computeItemKey={(index) => {
        const item = items[index];
        if (!item) return index;
        // Include locations in the key so items re-render when locations change
        const locationsKey = item.locations ? JSON.stringify(item.locations) : '';
        return `${item.id}-${locationsKey}`;
      }}
      data-testid="cards-grid"
    />
  );
};

const CardGrid = React.memo(CardGridComponent);

export default CardGrid;
