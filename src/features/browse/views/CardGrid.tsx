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
  };
  priceType: PriceType;
  isOwnCollection?: boolean;
  goalId?: string;
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
      />
    ),
    [cardDisplaySettings, priceType, onCardClick, isOwnCollection, goalId]
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
      computeItemKey={(index) => items[index]?.id || index}
      data-testid="cards-grid"
    />
  );
};

const CardGrid = React.memo(CardGridComponent);

export default CardGrid;
