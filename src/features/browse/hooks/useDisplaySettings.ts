import { useMemo } from 'react';
import { useCardSetSettingGroups } from '@/hooks/useCardSetSettingGroups';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { usePriceType } from '@/hooks/usePriceType';
import { useSetDisplaySettings } from '@/hooks/useSetDisplaySettings';

interface UseDisplaySettingsProps {
  view: 'cards' | 'sets';
  viewMode: 'grid' | 'table';
}

/**
 * Manages all display settings for browse views
 * Includes card gallery, table, and set display settings
 */
export function useDisplaySettings({ view, viewMode }: UseDisplaySettingsProps) {
  // Settings for display components
  const setDisplaySettings = useSetDisplaySettings(viewMode);
  const settingGroups = useCardSetSettingGroups(view, viewMode);
  const currentPriceType = usePriceType();

  // Gallery settings
  const [cardsPerRow] = useLocalStorage<number>('cardsPerRow', 4);
  const [cardSizeMargin] = useLocalStorage('cardSizeMargin', 0);
  const [nameIsVisible] = useLocalStorage('cardNameIsVisible', true);
  const [setIsVisible] = useLocalStorage('cardSetIsVisible', true);
  const [priceIsVisible] = useLocalStorage('cardPriceIsVisible', true);

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
    ],
  );

  // Card display settings (simplified subset of gallery settings)
  const cardDisplaySettings = useMemo(
    () => ({
      nameIsVisible: gallerySettings.nameIsVisible,
      setIsVisible: gallerySettings.setIsVisible,
      priceIsVisible: gallerySettings.priceIsVisible,
    }),
    [gallerySettings],
  );

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
      },
      table: {
        codeIsVisible: Boolean(setDisplaySettings.codeIsVisible),
        cardCountIsVisible: Boolean(setDisplaySettings.cardCountIsVisible),
        releaseDateIsVisible: Boolean(setDisplaySettings.releaseDateIsVisible),
        typeIsVisible: Boolean(setDisplaySettings.typeIsVisible),
        categoryIsVisible: Boolean(setDisplaySettings.categoryIsVisible),
        isDraftableIsVisible: Boolean(setDisplaySettings.isDraftableIsVisible),
      },
    }),
    [setDisplaySettings],
  );

  return {
    settingGroups,
    gallerySettings,
    tableSettings,
    cardDisplaySettings,
    setDisplaySettings: formattedSetDisplaySettings,
    priceType: currentPriceType,
  };
}
