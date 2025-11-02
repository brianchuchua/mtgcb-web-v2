'use client';

import React, { useMemo } from 'react';
import CardItem, { CardItemProps } from './CardItem';
import { PriceType } from '@/types/pricing';
import { getCollectionCardUrl } from '@/utils/collectionUrls';
import { generateCardSlug } from '@/utils/cards/generateCardSlug';
import { useBrowseUrlContext } from '@/features/browse/BrowseSearchForm/hooks/useBrowseUrlContext';

export interface CardItemRendererProps {
  card: CardItemProps;
  settings?: {
    nameIsVisible?: boolean;
    setIsVisible?: boolean;
    priceIsVisible?: boolean;
    goalProgressIsVisible?: boolean;
    locationsIsVisible?: boolean;
  };
  priceType?: PriceType;
  onClick?: (cardId: string, cardName?: string) => void;
  isOwnCollection?: boolean;
  goalId?: string;
  hasLocations?: boolean;
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
  hasLocations = false,
}: CardItemRendererProps) => {
  const { isCollectionPage, userId } = useBrowseUrlContext();

  // Generate href for Link-based navigation
  const cardHref = useMemo(() => {
    if (!onClick) return undefined;

    const cardSlug = generateCardSlug(card.name);

    // For collection/shared pages, use collection URL
    if (isCollectionPage && userId) {
      return getCollectionCardUrl(userId, cardSlug, card.id);
    }

    // Default to browse URL
    return `/browse/cards/${cardSlug}/${card.id}`;
  }, [card.id, card.name, onClick, isCollectionPage, userId]);

  return (
    <CardItem
      {...card}
      href={cardHref}
      display={settings}
      priceType={priceType}
      isOwnCollection={isOwnCollection}
      goalId={goalId}
      hasLocations={hasLocations}
    />
  );
};

export default CardItemRenderer;
