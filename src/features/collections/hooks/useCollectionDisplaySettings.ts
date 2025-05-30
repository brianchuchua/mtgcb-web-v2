import { useMemo } from 'react';
import { useCardSettingGroups } from '@/hooks/useCardSettingGroups';
import { useCollectionSetSettingGroups } from '@/hooks/useCollectionSetSettingGroups';
import { useCollectionSetDisplaySettings } from '@/hooks/useCollectionSetDisplaySettings';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { usePriceType } from '@/hooks/usePriceType';

interface UseCollectionDisplaySettingsProps {
  viewMode: 'grid' | 'table';
  view?: 'cards' | 'sets';
}

/**
 * Manages all display settings for collection views
 * Includes set gallery and table settings, and card display settings
 */
export function useCollectionDisplaySettings({ viewMode, view = 'sets' }: UseCollectionDisplaySettingsProps) {
  // Settings for display components
  const setDisplaySettings = useCollectionSetDisplaySettings(viewMode);
  const setSettingGroups = useCollectionSetSettingGroups(viewMode);
  const cardSettingGroups = useCardSettingGroups(viewMode);
  const currentPriceType = usePriceType();

  const [setsPerRow] = useLocalStorage<number>('setsPerRow', 0); // Default to 0 (responsive)
  
  // Card gallery settings
  const [cardsPerRow] = useLocalStorage<number>('cardsPerRow', 0); // Default to 0 (auto/responsive)
  const [cardSizeMargin] = useLocalStorage('cardSizeMargin', 0);
  const [nameIsVisible] = useLocalStorage('cardNameIsVisible', true);
  const [setIsVisible] = useLocalStorage('cardSetIsVisible', true);
  const [priceIsVisible] = useLocalStorage('cardPriceIsVisible', true);
  const [quantityIsVisible] = useLocalStorage('cardQuantityIsVisible', true); // Default to true for collections

  // Card table settings
  const [tableSetIsVisible] = useLocalStorage('tableSetIsVisible', true);
  const [collectorNumberIsVisible] = useLocalStorage('tableCollectorNumberIsVisible', true);
  const [mtgcbNumberIsVisible] = useLocalStorage('tableMtgcbNumberIsVisible', false);
  const [rarityIsVisible] = useLocalStorage('tableRarityIsVisible', true);
  const [typeIsVisible] = useLocalStorage('tableTypeIsVisible', false);
  const [artistIsVisible] = useLocalStorage('tableArtistIsVisible', false);
  const [manaCostIsVisible] = useLocalStorage('tableManaCostIsVisible', true);
  const [powerIsVisible] = useLocalStorage('tablePowerIsVisible', false);
  const [toughnessIsVisible] = useLocalStorage('tableToughnessIsVisible', false);
  const [loyaltyIsVisible] = useLocalStorage('tableLoyaltyIsVisible', false);
  const [tablePriceIsVisible] = useLocalStorage('tablePriceIsVisible', true);
  const [tableQuantityIsVisible] = useLocalStorage('tableQuantityIsVisible', true); // Default to true for collections

  // Formatted set display settings
  const formattedSetDisplaySettings = useMemo(
    () => ({
      grid: {
        nameIsVisible: Boolean(setDisplaySettings.nameIsVisible),
        codeIsVisible: Boolean(setDisplaySettings.codeIsVisible),
        releaseDateIsVisible: Boolean(setDisplaySettings.releaseDateIsVisible),
        typeIsVisible: Boolean(setDisplaySettings.typeIsVisible),
        categoryIsVisible: Boolean(setDisplaySettings.categoryIsVisible),
        cardCountIsVisible: Boolean(setDisplaySettings.cardCountIsVisible),
        costsIsVisible: Boolean(setDisplaySettings.costsIsVisible),
        setsPerRow: setsPerRow,
      },
      table: {
        codeIsVisible: Boolean(setDisplaySettings.codeIsVisible),
        cardCountIsVisible: Boolean(setDisplaySettings.cardCountIsVisible),
        releaseDateIsVisible: Boolean(setDisplaySettings.releaseDateIsVisible),
        typeIsVisible: Boolean(setDisplaySettings.typeIsVisible),
        categoryIsVisible: Boolean(setDisplaySettings.categoryIsVisible),
        isDraftableIsVisible: Boolean(setDisplaySettings.isDraftableIsVisible),
        completionIsVisible: Boolean(setDisplaySettings.completionIsVisible),
        costToCompleteIsVisible: Boolean(setDisplaySettings.costToCompleteIsVisible),
        valueIsVisible: Boolean(setDisplaySettings.valueIsVisible),
      },
    }),
    [setDisplaySettings, setsPerRow],
  );

  // Gallery settings
  const gallerySettings = useMemo(
    () => ({
      cardsPerRow,
      cardSizeMargin,
      nameIsVisible,
      setIsVisible,
      priceIsVisible,
    }),
    [cardsPerRow, cardSizeMargin, nameIsVisible, setIsVisible, priceIsVisible],
  );

  // Table settings
  const tableSettings = useMemo(
    () => ({
      setIsVisible: tableSetIsVisible,
      collectorNumberIsVisible,
      mtgcbNumberIsVisible,
      rarityIsVisible,
      typeIsVisible,
      artistIsVisible,
      manaCostIsVisible,
      powerIsVisible,
      toughnessIsVisible,
      loyaltyIsVisible,
      priceIsVisible: tablePriceIsVisible,
      quantityIsVisible: tableQuantityIsVisible,
    }),
    [
      tableSetIsVisible,
      collectorNumberIsVisible,
      mtgcbNumberIsVisible,
      rarityIsVisible,
      typeIsVisible,
      artistIsVisible,
      manaCostIsVisible,
      powerIsVisible,
      toughnessIsVisible,
      loyaltyIsVisible,
      tablePriceIsVisible,
      tableQuantityIsVisible,
    ],
  );

  // Card display settings (includes quantity for collections)
  const cardDisplaySettings = useMemo(
    () => ({
      nameIsVisible,
      setIsVisible,
      priceIsVisible,
      quantityIsVisible,
    }),
    [nameIsVisible, setIsVisible, priceIsVisible, quantityIsVisible],
  );

  return {
    settingGroups: view === 'cards' ? cardSettingGroups : setSettingGroups,
    setDisplaySettings: formattedSetDisplaySettings,
    gallerySettings,
    tableSettings,
    cardDisplaySettings,
    priceType: currentPriceType,
  };
}