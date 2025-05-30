'use client';

import { useLocalStorage } from './useLocalStorage';
import { CardSelectSetting, CardSettingGroup, CardSliderSetting } from '@/components/cards/CardSettingsPanel';
import { PriceType } from '@/types/pricing';

export const useCardSettingGroups = (explicitViewMode?: 'grid' | 'table'): CardSettingGroup[] => {
  // Card Gallery visibility settings
  const [nameIsVisible, setNameIsVisible] = useLocalStorage('cardNameIsVisible', true);
  const [setIsVisible, setSetIsVisible] = useLocalStorage('cardSetIsVisible', true);
  const [priceIsVisible, setPriceIsVisible] = useLocalStorage('cardPriceIsVisible', true);

  // Card Table column visibility settings
  const [tableSetIsVisible, setTableSetIsVisible] = useLocalStorage('tableSetIsVisible', true);
  const [tableCollectorNumberIsVisible, setTableCollectorNumberIsVisible] = useLocalStorage(
    'tableCollectorNumberIsVisible',
    true,
  );
  const [tableMtgcbNumberIsVisible, setTableMtgcbNumberIsVisible] = useLocalStorage('tableMtgcbNumberIsVisible', false);
  const [tableRarityIsVisible, setTableRarityIsVisible] = useLocalStorage('tableRarityIsVisible', true);
  const [tableManaCostIsVisible, setTableManaCostIsVisible] = useLocalStorage('tableManaCostIsVisible', false);
  const [tablePowerIsVisible, setTablePowerIsVisible] = useLocalStorage('tablePowerIsVisible', false);
  const [tableToughnessIsVisible, setTableToughnessIsVisible] = useLocalStorage('tableToughnessIsVisible', false);
  const [tableLoyaltyIsVisible, setTableLoyaltyIsVisible] = useLocalStorage('tableLoyaltyIsVisible', false);
  const [tablePriceIsVisible, setTablePriceIsVisible] = useLocalStorage('tablePriceIsVisible', true);
  const [tableTypeIsVisible, setTableTypeIsVisible] = useLocalStorage('tableTypeIsVisible', false);
  const [tableArtistIsVisible, setTableArtistIsVisible] = useLocalStorage('tableArtistIsVisible', false);

  // Layout settings
  const [cardsPerRow, setCardsPerRow] = useLocalStorage('cardsPerRow', 0); // Default to 0 (auto/responsive)
  const [cardSizeMargin, setCardSizeMargin] = useLocalStorage('cardSizeMargin', 0);

  // Price display setting
  const [displayPriceType, setDisplayPriceType] = useLocalStorage<PriceType>('displayPriceType', PriceType.Market);

  const handleSetPriceType = (value: number): void => {
    setDisplayPriceType(value as unknown as PriceType);
  };

  const [localStorageViewMode] = useLocalStorage<'grid' | 'table'>('preferredViewMode', 'grid');
  const viewMode = explicitViewMode || localStorageViewMode;

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
          value: displayPriceType as unknown as number,
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
        isVisible: nameIsVisible,
        setVisibility: setNameIsVisible,
        type: 'toggle',
      },
      {
        key: 'set',
        label: 'Set',
        isVisible: setIsVisible,
        setVisibility: setSetIsVisible,
        type: 'toggle',
      },
      {
        key: 'price',
        label: 'Price',
        isVisible: priceIsVisible,
        setVisibility: setPriceIsVisible,
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
        value: cardsPerRow,
        setValue: setCardsPerRow,
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
        value: cardSizeMargin,
        setValue: setCardSizeMargin,
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
        isVisible: tableSetIsVisible,
        setVisibility: setTableSetIsVisible,
        type: 'toggle',
      },
      {
        key: 'tableCollectorNumber',
        label: 'Collector #',
        isVisible: tableCollectorNumberIsVisible,
        setVisibility: setTableCollectorNumberIsVisible,
        type: 'toggle',
      },
      {
        key: 'tableMtgcbNumber',
        label: 'MTG CB #',
        isVisible: tableMtgcbNumberIsVisible,
        setVisibility: setTableMtgcbNumberIsVisible,
        type: 'toggle',
      },
      {
        key: 'tableRarity',
        label: 'Rarity',
        isVisible: tableRarityIsVisible,
        setVisibility: setTableRarityIsVisible,
        type: 'toggle',
      },
      {
        key: 'tableType',
        label: 'Type',
        isVisible: tableTypeIsVisible,
        setVisibility: setTableTypeIsVisible,
        type: 'toggle',
      },
      {
        key: 'tableArtist',
        label: 'Artist',
        isVisible: tableArtistIsVisible,
        setVisibility: setTableArtistIsVisible,
        type: 'toggle',
      },
      {
        key: 'tableManaCost',
        label: 'Mana Cost',
        isVisible: tableManaCostIsVisible,
        setVisibility: setTableManaCostIsVisible,
        type: 'toggle',
      },
      {
        key: 'tablePower',
        label: 'Power',
        isVisible: tablePowerIsVisible,
        setVisibility: setTablePowerIsVisible,
        type: 'toggle',
      },
      {
        key: 'tableToughness',
        label: 'Toughness',
        isVisible: tableToughnessIsVisible,
        setVisibility: setTableToughnessIsVisible,
        type: 'toggle',
      },
      {
        key: 'tableLoyalty',
        label: 'Loyalty',
        isVisible: tableLoyaltyIsVisible,
        setVisibility: setTableLoyaltyIsVisible,
        type: 'toggle',
      },
      {
        key: 'tablePrice',
        label: 'Price',
        isVisible: tablePriceIsVisible,
        setVisibility: setTablePriceIsVisible,
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
