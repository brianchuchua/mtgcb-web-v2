import { useMemo } from 'react';
import {
  useCardDisplaySettings,
  useCollectionSetSettings,
  useCollectionSettings,
  useLayoutSettings,
  usePriceType,
  useSetDisplaySettings as useSetDisplaySettingsFromContext,
  useTableCardSettings,
  useTableSetSettings,
} from '@/contexts/DisplaySettingsContext';
import { useCardSettingGroups } from '@/hooks/useCardSettingGroups';
import { useCollectionSetSettingGroups } from '@/hooks/useCollectionSetSettingGroups';

interface UseCollectionDisplaySettingsProps {
  viewMode: 'grid' | 'table';
  view?: 'cards' | 'sets';
}

/**
 * Manages all display settings for collection views
 * Includes set gallery and table settings, and card display settings
 */
export function useCollectionDisplaySettings({ viewMode, view = 'sets' }: UseCollectionDisplaySettingsProps) {
  // Settings from centralized context
  const cardDisplaySettings = useCardDisplaySettings();
  const layoutSettings = useLayoutSettings();
  const tableCardSettings = useTableCardSettings();
  const setDisplaySettings = useSetDisplaySettingsFromContext();
  const tableSetSettings = useTableSetSettings();
  const collectionSettings = useCollectionSettings();
  const collectionSetSettings = useCollectionSetSettings();
  const [currentPriceType] = usePriceType();

  // Settings for display components
  const setSettingGroups = useCollectionSetSettingGroups(viewMode);
  const cardSettingGroups = useCardSettingGroups(viewMode);

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
        completionIsVisible: collectionSetSettings.tableCompletionIsVisible,
        costToCompleteIsVisible: collectionSetSettings.tableCostToCompleteIsVisible,
        valueIsVisible: collectionSetSettings.tableValueIsVisible,
      },
    }),
    [setDisplaySettings, tableSetSettings, collectionSetSettings, layoutSettings.setsPerRow],
  );

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
      cardDisplaySettings.priceIsVisible,
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
      quantityIsVisible: collectionSettings.tableQuantityIsVisible,
      locationsIsVisible: collectionSettings.tableLocationsIsVisible,
    }),
    [
      tableCardSettings.setIsVisible,
      tableCardSettings.collectorNumberIsVisible,
      tableCardSettings.mtgcbNumberIsVisible,
      tableCardSettings.rarityIsVisible,
      tableCardSettings.typeIsVisible,
      tableCardSettings.artistIsVisible,
      tableCardSettings.manaCostIsVisible,
      tableCardSettings.powerIsVisible,
      tableCardSettings.toughnessIsVisible,
      tableCardSettings.loyaltyIsVisible,
      tableCardSettings.priceIsVisible,
      collectionSettings.tableQuantityIsVisible,
      collectionSettings.tableLocationsIsVisible,
    ],
  );

  // Card display settings (includes quantity for collections)
  const cardDisplaySettingsFormatted = useMemo(
    () => ({
      nameIsVisible: cardDisplaySettings.nameIsVisible,
      setIsVisible: cardDisplaySettings.setIconIsVisible,
      priceIsVisible: cardDisplaySettings.priceIsVisible,
      quantityIsVisible: collectionSettings.quantityIsVisible,
      locationsIsVisible: cardDisplaySettings.locationsIsVisible,
    }),
    [cardDisplaySettings, collectionSettings.quantityIsVisible],
  );

  return {
    settingGroups: view === 'cards' ? cardSettingGroups : setSettingGroups,
    setDisplaySettings: formattedSetDisplaySettings,
    gallerySettings,
    tableSettings,
    cardDisplaySettings: cardDisplaySettingsFormatted,
    priceType: currentPriceType,
  };
}
