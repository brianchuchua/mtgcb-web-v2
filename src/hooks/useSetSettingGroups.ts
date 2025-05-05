'use client';

import { useLocalStorage } from './useLocalStorage';
import { CardSettingGroup } from '@/components/cards/CardSettingsPanel';
import { PriceType } from '@/types/pricing';

export const useSetSettingGroups = (explicitViewMode?: 'grid' | 'table'): CardSettingGroup[] => {
  // Set Gallery visibility settings
  const [nameIsVisible, setNameIsVisible] = useLocalStorage('setNameIsVisible', true);
  const [codeIsVisible, setCodeIsVisible] = useLocalStorage('setCodeIsVisible', true);
  const [releaseDateIsVisible, setReleaseDateIsVisible] = useLocalStorage('setReleaseDateIsVisible', true);
  const [typeIsVisible, setTypeIsVisible] = useLocalStorage('setTypeIsVisible', true);
  const [categoryIsVisible, setCategoryIsVisible] = useLocalStorage('setCategoryIsVisible', true);
  const [cardCountIsVisible, setCardCountIsVisible] = useLocalStorage('setCardCountIsVisible', true);

  // Set Table column visibility settings
  const [tableCodeIsVisible, setTableCodeIsVisible] = useLocalStorage('tableSetCodeIsVisible', true);
  const [tableCardCountIsVisible, setTableCardCountIsVisible] = useLocalStorage('tableSetCardCountIsVisible', true);
  const [tableReleaseDateIsVisible, setTableReleaseDateIsVisible] = useLocalStorage(
    'tableSetReleaseDateIsVisible',
    true,
  );
  const [tableTypeIsVisible, setTableTypeIsVisible] = useLocalStorage('tableSetTypeIsVisible', true);
  const [tableCategoryIsVisible, setTableCategoryIsVisible] = useLocalStorage('tableSetCategoryIsVisible', false);
  const [tableIsDraftableIsVisible, setTableIsDraftableIsVisible] = useLocalStorage(
    'tableSetIsDraftableIsVisible',
    false,
  );

  // Layout settings
  const [setsPerRow, setSetsPerRow] = useLocalStorage('setsPerRow', 4);

  // Shared price display setting - uses the same key as card settings
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
          label: '',
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

  // Create set gallery settings group (only shown in grid view)
  const setGallerySettings: CardSettingGroup = {
    label: 'Set Fields',
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
        key: 'code',
        label: 'Code',
        isVisible: codeIsVisible,
        setVisibility: setCodeIsVisible,
        type: 'toggle',
      },
      {
        key: 'releaseDate',
        label: 'Release Date',
        isVisible: releaseDateIsVisible,
        setVisibility: setReleaseDateIsVisible,
        type: 'toggle',
      },
      {
        key: 'category',
        label: 'Category',
        isVisible: categoryIsVisible,
        setVisibility: setCategoryIsVisible,
        type: 'toggle',
      },
      {
        key: 'type',
        label: 'Type',
        isVisible: typeIsVisible,
        setVisibility: setTypeIsVisible,
        type: 'toggle',
      },
      {
        key: 'cardCount',
        label: 'Card Count',
        isVisible: cardCountIsVisible,
        setVisibility: setCardCountIsVisible,
        type: 'toggle',
      },
    ],
  };

  // Create set layout settings (only shown in grid view)
  const setLayoutSettings: CardSettingGroup = {
    label: 'Layout Settings',
    type: 'select',
    settings: [
      {
        key: 'setsPerRow',
        label: 'Sets per row (desktop only)',
        value: setsPerRow,
        setValue: setSetsPerRow,
        type: 'select',
        options: [
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

  // Create table column settings (only shown in table view)
  const tableColumnSettings: CardSettingGroup = {
    label: 'Table Columns',
    type: 'toggle',
    settings: [
      {
        key: 'tableCode',
        label: 'Code',
        isVisible: tableCodeIsVisible,
        setVisibility: setTableCodeIsVisible,
        type: 'toggle',
      },
      {
        key: 'tableCardCount',
        label: 'Card Count',
        isVisible: tableCardCountIsVisible,
        setVisibility: setTableCardCountIsVisible,
        type: 'toggle',
      },
      {
        key: 'tableReleaseDate',
        label: 'Release Date',
        isVisible: tableReleaseDateIsVisible,
        setVisibility: setTableReleaseDateIsVisible,
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
        key: 'tableCategory',
        label: 'Category',
        isVisible: tableCategoryIsVisible,
        setVisibility: setTableCategoryIsVisible,
        type: 'toggle',
      },
      {
        key: 'tableIsDraftable',
        label: 'Draftable',
        isVisible: tableIsDraftableIsVisible,
        setVisibility: setTableIsDraftableIsVisible,
        type: 'toggle',
      },
    ],
  };

  // Add appropriate setting groups based on view mode
  if (viewMode === 'grid') {
    // For grid view, show set gallery settings
    settingGroups.unshift(setGallerySettings);
    settingGroups.push(setLayoutSettings);
  } else {
    // For table view, show table column settings
    settingGroups.unshift(tableColumnSettings);
  }

  return settingGroups;
};
