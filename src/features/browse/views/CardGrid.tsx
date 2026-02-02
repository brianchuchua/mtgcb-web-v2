'use client';

import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { Button } from '@mui/material';
import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import CardItemRenderer from '@/components/cards/CardItemRenderer';
import VirtualizedRowGallery from '@/components/common/VirtualizedRowGallery';
import InfoBanner from '@/features/browse/views/InfoBanner';
import { resetSearch, clearSelectedGoal, clearSelectedLocation } from '@/redux/slices/browse';
import { PriceType } from '@/types/pricing';

interface CardGridProps {
  items: any[];
  loading: boolean;
  onCardClick: (cardId: string) => void;
  pageSize: number;
  gallerySettings: {
    cardsPerRow: number;
    mobileCardsPerRow: number;
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
  const dispatch = useDispatch();

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
    [cardDisplaySettings, priceType, onCardClick, isOwnCollection, goalId, hasLocations],
  );

  const handleResetSearch = () => {
    // Clear goal and location explicitly before resetting search
    // This ensures proper query invalidation (prevents double-click bug)
    dispatch(clearSelectedGoal());
    dispatch(clearSelectedLocation());

    // Reset all other search fields
    dispatch(resetSearch({ preserveGoal: false, preserveLocation: false }));
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
    <VirtualizedRowGallery
      key="browse-card-gallery"
      items={items}
      renderItem={renderItem}
      isLoading={loading}
      columnsPerRow={gallerySettings.cardsPerRow}
      mobileColumnsPerRow={gallerySettings.mobileCardsPerRow}
      galleryWidth={100}
      horizontalPadding={gallerySettings.cardSizeMargin}
      emptyMessage="No cards found matching your search criteria."
      emptyStateComponent={emptyStateComponent}
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
