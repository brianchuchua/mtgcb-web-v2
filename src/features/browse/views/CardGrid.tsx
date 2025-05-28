'use client';

import React, { useCallback } from 'react';
import CardItemRenderer from '@/components/cards/CardItemRenderer';
import VirtualizedGallery from '@/components/common/VirtualizedGallery';
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
  };
  priceType: PriceType;
  isOwnCollection?: boolean;
}

const CardGridComponent: React.FC<CardGridProps> = ({
  items,
  loading,
  onCardClick,
  gallerySettings,
  cardDisplaySettings,
  priceType,
  isOwnCollection = false,
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
      />
    ),
    [cardDisplaySettings, priceType, onCardClick, isOwnCollection]
  );
  
  return (
    <VirtualizedGallery
      key="browse-card-gallery"
      items={items}
      renderItem={renderItem}
      isLoading={loading}
      columnsPerRow={gallerySettings.cardsPerRow}
      galleryWidth={100}
      horizontalPadding={gallerySettings.cardSizeMargin}
      emptyMessage="No cards found"
      computeItemKey={(index) => items[index]?.id || index}
    />
  );
};

const CardGrid = React.memo(CardGridComponent);

export default CardGrid;
