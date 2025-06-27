'use client';

import React from 'react';
import CardItem, { CardItemProps } from './CardItem';
import { PriceType } from '@/types/pricing';

export interface CardItemRendererProps {
  card: CardItemProps;
  settings?: {
    nameIsVisible?: boolean;
    setIsVisible?: boolean;
    priceIsVisible?: boolean;
    goalProgressIsVisible?: boolean;
  };
  priceType?: PriceType;
  onClick?: (cardId: string, cardName?: string) => void;
  isOwnCollection?: boolean;
  goalId?: string;
}

const CardItemRenderer = ({
  card,
  settings = {
    nameIsVisible: true,
    setIsVisible: true,
    priceIsVisible: true,
  },
  priceType = PriceType.Market,
  onClick,
  isOwnCollection = false,
  goalId,
}: CardItemRendererProps) => {
  const handleCardClick = () => {
    if (onClick) {
      onClick(card.id, card.name);
    }
  };

  return (
    <CardItem 
      {...card} 
      onClick={onClick ? handleCardClick : undefined} 
      display={settings} 
      priceType={priceType}
      isOwnCollection={isOwnCollection}
      goalId={goalId}
    />
  );
};

export default CardItemRenderer;
