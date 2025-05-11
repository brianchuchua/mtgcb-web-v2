'use client';

import React from 'react';
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
}

const CardGrid: React.FC<CardGridProps> = ({
  items,
  loading,
  onCardClick,
  gallerySettings,
  cardDisplaySettings,
  priceType,
}) => {
  return (
    <VirtualizedGallery
      key="browse-card-gallery"
      items={items}
      renderItem={(card) => (
        <CardItemRenderer card={card} settings={cardDisplaySettings} priceType={priceType} onClick={onCardClick} />
      )}
      isLoading={loading}
      columnsPerRow={gallerySettings.cardsPerRow}
      galleryWidth={100}
      horizontalPadding={gallerySettings.cardSizeMargin}
      emptyMessage="No cards found"
      computeItemKey={(index) => items[index]?.id || index}
    />
  );
};

export default CardGrid;
