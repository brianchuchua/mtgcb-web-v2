'use client';

import { 
  useDisplaySettings,
  useCardDisplaySettings,
  useLayoutSettings,
  useTableCardSettings,
  usePriceType,
  usePreferredViewMode
} from '@/contexts/DisplaySettingsContext';
import { CardSelectSetting, CardSettingGroup, CardSliderSetting } from '@/components/cards/CardSettingsPanel';
import { PriceType } from '@/types/pricing';

export const useCardSettingGroups = (explicitViewMode?: 'grid' | 'table'): CardSettingGroup[] => {
  const { updateSetting } = useDisplaySettings();
  const cardDisplaySettings = useCardDisplaySettings();
  const layoutSettings = useLayoutSettings();
  const tableCardSettings = useTableCardSettings();
  const [priceType, setPriceType] = usePriceType();
  const [preferredViewMode] = usePreferredViewMode();

  const viewMode = explicitViewMode || preferredViewMode;

  const handleSetPriceType = (value: number): void => {
    setPriceType(value as unknown as PriceType);
  };

  // Base settings groups that are always available
  const settingGroups: CardSettingGroup[] = [
    // Price Settings (always shown)
    {
      label: 'Price Settings',
      type: 'select',
      settings: [
        {
          key: 'priceType',
          label: '', // Removed the redundant label
          value: priceType as unknown as number,
          setValue: handleSetPriceType,
          type: 'select',
          options: [
            { value: PriceType.Market as unknown as number, label: 'Market' },
            { value: PriceType.Low as unknown as number, label: 'Low' },
            { value: PriceType.Average as unknown as number, label: 'Average' },
            { value: PriceType.High as unknown as number, label: 'High' },
          ],
        },
      ],
    },
  ];

  // Create card gallery settings group (only shown in grid view)
  const cardGallerySettings: CardSettingGroup = {
    label: 'Card Fields',
    type: 'toggle',
    settings: [
      {
        key: 'name',
        label: 'Name',
        isVisible: cardDisplaySettings.nameIsVisible,
        setVisibility: (value: boolean) => updateSetting('cardNameIsVisible', value),
        type: 'toggle',
      },
      {
        key: 'set',
        label: 'Set',
        isVisible: cardDisplaySettings.setIconIsVisible,
        setVisibility: (value: boolean) => updateSetting('cardSetIconIsVisible', value),
        type: 'toggle',
      },
      {
        key: 'price',
        label: 'Price',
        isVisible: cardDisplaySettings.priceIsVisible,
        setVisibility: (value: boolean) => updateSetting('cardPriceIsVisible', value),
        type: 'toggle',
      },
      {
        key: 'locations',
        label: 'Locations',
        isVisible: cardDisplaySettings.locationsIsVisible,
        setVisibility: (value: boolean) => updateSetting('cardLocationsIsVisible', value),
        type: 'toggle',
      },
    ],
  };

  // Create card layout settings (only shown in grid view)
  const cardLayoutSettings: CardSettingGroup = {
    label: 'Layout Settings',
    type: 'select',
    settings: [
      {
        key: 'cardsPerRow',
        label: 'Cards per row (desktop only)',
        value: layoutSettings.cardsPerRow,
        setValue: layoutSettings.setCardsPerRow,
        type: 'select',
        options: [
          { value: 0, label: 'Auto' },
          { value: 1, label: '1' },
          { value: 2, label: '2' },
          { value: 3, label: '3' },
          { value: 4, label: '4' },
          { value: 5, label: '5' },
          { value: 6, label: '6' },
        ],
      },
    ],
  };

  // Create card size settings (only shown in grid view)
  const cardSizeSettings: CardSettingGroup = {
    label: 'Card Size',
    type: 'slider',
    settings: [
      {
        key: 'cardSizeMargin',
        label: 'Shrink cards (desktop only)',
        value: layoutSettings.cardSizeMargin,
        setValue: layoutSettings.setCardSizeMargin,
        min: 0,
        max: 40,
        step: 1,
        type: 'slider',
      },
    ],
  };

  // Create table column settings (only shown in table view)
  const tableColumnSettings: CardSettingGroup = {
    label: 'Table Columns',
    type: 'toggle',
    settings: [
      {
        key: 'tableSet',
        label: 'Set',
        isVisible: tableCardSettings.setIsVisible,
        setVisibility: (value: boolean) => updateSetting('tableSetIsVisible', value),
        type: 'toggle',
      },
      {
        key: 'tableCollectorNumber',
        label: 'Collector #',
        isVisible: tableCardSettings.collectorNumberIsVisible,
        setVisibility: (value: boolean) => updateSetting('tableCollectorNumberIsVisible', value),
        type: 'toggle',
      },
      {
        key: 'tableMtgcbNumber',
        label: 'MTG CB #',
        isVisible: tableCardSettings.mtgcbNumberIsVisible,
        setVisibility: (value: boolean) => updateSetting('tableMtgcbNumberIsVisible', value),
        type: 'toggle',
      },
      {
        key: 'tableRarity',
        label: 'Rarity',
        isVisible: tableCardSettings.rarityIsVisible,
        setVisibility: (value: boolean) => updateSetting('tableRarityIsVisible', value),
        type: 'toggle',
      },
      {
        key: 'tableType',
        label: 'Type',
        isVisible: tableCardSettings.typeIsVisible,
        setVisibility: (value: boolean) => updateSetting('tableTypeIsVisible', value),
        type: 'toggle',
      },
      {
        key: 'tableArtist',
        label: 'Artist',
        isVisible: tableCardSettings.artistIsVisible,
        setVisibility: (value: boolean) => updateSetting('tableArtistIsVisible', value),
        type: 'toggle',
      },
      {
        key: 'tableManaCost',
        label: 'Mana Cost',
        isVisible: tableCardSettings.manaCostIsVisible,
        setVisibility: (value: boolean) => updateSetting('tableManaCostIsVisible', value),
        type: 'toggle',
      },
      {
        key: 'tablePower',
        label: 'Power',
        isVisible: tableCardSettings.powerIsVisible,
        setVisibility: (value: boolean) => updateSetting('tablePowerIsVisible', value),
        type: 'toggle',
      },
      {
        key: 'tableToughness',
        label: 'Toughness',
        isVisible: tableCardSettings.toughnessIsVisible,
        setVisibility: (value: boolean) => updateSetting('tableToughnessIsVisible', value),
        type: 'toggle',
      },
      {
        key: 'tableLoyalty',
        label: 'Loyalty',
        isVisible: tableCardSettings.loyaltyIsVisible,
        setVisibility: (value: boolean) => updateSetting('tableLoyaltyIsVisible', value),
        type: 'toggle',
      },
      {
        key: 'tablePrice',
        label: 'Price',
        isVisible: tableCardSettings.priceIsVisible,
        setVisibility: (value: boolean) => updateSetting('tablePriceIsVisible', value),
        type: 'toggle',
      },
    ],
  };

  // Add appropriate setting groups based on view mode
  if (viewMode === 'grid') {
    // For grid view, show card gallery settings
    settingGroups.unshift(cardGallerySettings);
    settingGroups.push(cardLayoutSettings);
    settingGroups.push(cardSizeSettings);
  } else {
    // For table view, show table column settings
    settingGroups.unshift(tableColumnSettings);
  }

  return settingGroups;
};