import { useMemo } from 'react';
import { 
  useCardDisplaySettings, 
  useLayoutSettings, 
  useTableCardSettings,
  useSetDisplaySettings as useSetDisplaySettingsFromContext,
  useTableSetSettings,
  usePriceType 
} from '@/contexts/DisplaySettingsContext';
import { useCardSetSettingGroups } from '@/hooks/useCardSetSettingGroups';

interface UseDisplaySettingsProps {
  view: 'cards' | 'sets';
  viewMode: 'grid' | 'table';
}

/**
 * Manages all display settings for browse views
 * Includes card gallery, table, and set display settings
 */
export function useDisplaySettings({ view, viewMode }: UseDisplaySettingsProps) {
  // Settings from centralized context
  const cardDisplaySettings = useCardDisplaySettings();
  const layoutSettings = useLayoutSettings();
  const tableCardSettings = useTableCardSettings();
  const setDisplaySettings = useSetDisplaySettingsFromContext();
  const tableSetSettings = useTableSetSettings();
  const [currentPriceType] = usePriceType();
  
  // Settings for display components
  const settingGroups = useCardSetSettingGroups(view, viewMode);

  // Gallery settings
  const gallerySettings = useMemo(
    () => ({
      cardsPerRow: layoutSettings.cardsPerRow,
      cardSizeMargin: layoutSettings.cardSizeMargin,
      nameIsVisible: cardDisplaySettings.nameIsVisible,
      setIsVisible: cardDisplaySettings.setIconIsVisible,
      priceIsVisible: cardDisplaySettings.priceIsVisible,
    }),
    [
      layoutSettings.cardsPerRow, 
      layoutSettings.cardSizeMargin, 
      cardDisplaySettings.nameIsVisible, 
      cardDisplaySettings.setIconIsVisible, 
      cardDisplaySettings.priceIsVisible
    ],
  );

  // Table settings
  const tableSettings = useMemo(
    () => ({
      setIsVisible: tableCardSettings.setIsVisible,
      collectorNumberIsVisible: tableCardSettings.collectorNumberIsVisible,
      mtgcbNumberIsVisible: tableCardSettings.mtgcbNumberIsVisible,
      rarityIsVisible: tableCardSettings.rarityIsVisible,
      typeIsVisible: tableCardSettings.typeIsVisible,
      artistIsVisible: tableCardSettings.artistIsVisible,
      manaCostIsVisible: tableCardSettings.manaCostIsVisible,
      powerIsVisible: tableCardSettings.powerIsVisible,
      toughnessIsVisible: tableCardSettings.toughnessIsVisible,
      loyaltyIsVisible: tableCardSettings.loyaltyIsVisible,
      priceIsVisible: tableCardSettings.priceIsVisible,
    }),
    [tableCardSettings],
  );

  // Card display settings (simplified subset of gallery settings)
  const cardDisplaySettingsFormatted = useMemo(
    () => ({
      nameIsVisible: cardDisplaySettings.nameIsVisible,
      setIsVisible: cardDisplaySettings.setIconIsVisible,
      priceIsVisible: cardDisplaySettings.priceIsVisible,
    }),
    [cardDisplaySettings],
  );

  // Formatted set display settings
  const formattedSetDisplaySettings = useMemo(
    () => ({
      grid: {
        nameIsVisible: setDisplaySettings.nameIsVisible,
        codeIsVisible: setDisplaySettings.codeIsVisible,
        releaseDateIsVisible: setDisplaySettings.releaseDateIsVisible,
        typeIsVisible: setDisplaySettings.typeIsVisible,
        categoryIsVisible: setDisplaySettings.categoryIsVisible,
        cardCountIsVisible: setDisplaySettings.cardCountIsVisible,
        costsIsVisible: setDisplaySettings.priceIsVisible,
        setsPerRow: layoutSettings.setsPerRow,
      },
      table: {
        codeIsVisible: tableSetSettings.codeIsVisible,
        cardCountIsVisible: tableSetSettings.cardCountIsVisible,
        releaseDateIsVisible: tableSetSettings.releaseDateIsVisible,
        typeIsVisible: tableSetSettings.typeIsVisible,
        categoryIsVisible: tableSetSettings.categoryIsVisible,
        isDraftableIsVisible: tableSetSettings.isDraftableIsVisible,
      },
    }),
    [setDisplaySettings, tableSetSettings, layoutSettings.setsPerRow],
  );

  return {
    settingGroups,
    gallerySettings,
    tableSettings,
    cardDisplaySettings: cardDisplaySettingsFormatted,
    setDisplaySettings: formattedSetDisplaySettings,
    priceType: currentPriceType,
  };
}