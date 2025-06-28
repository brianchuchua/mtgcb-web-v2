'use client';

import { 
  useDisplaySettings,
  useSetDisplaySettings,
  useTableSetSettings,
  useLayoutSettings,
  useCollectionSetSettings,
  usePriceType,
  usePreferredViewMode
} from '@/contexts/DisplaySettingsContext';
import { CardSettingGroup } from '@/components/cards/CardSettingsPanel';
import { PriceType } from '@/types/pricing';

export const useCollectionSetSettingGroups = (explicitViewMode?: 'grid' | 'table'): CardSettingGroup[] => {
  const { updateSetting } = useDisplaySettings();
  const setDisplaySettings = useSetDisplaySettings();
  const tableSetSettings = useTableSetSettings();
  const layoutSettings = useLayoutSettings();
  const collectionSetSettings = useCollectionSetSettings();
  const [priceType, setPriceType] = usePriceType();
  const [preferredViewMode] = usePreferredViewMode();

  const handleSetPriceType = (value: number): void => {
    setPriceType(value as unknown as PriceType);
  };

  const viewMode = explicitViewMode || preferredViewMode;

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

  // Create set gallery settings group (only shown in grid view)
  const setGallerySettings: CardSettingGroup = {
    label: 'Set Fields',
    type: 'toggle',
    settings: [
      {
        key: 'name',
        label: 'Name',
        isVisible: setDisplaySettings.nameIsVisible,
        setVisibility: (value: boolean) => updateSetting('setNameIsVisible', value),
        type: 'toggle',
      },
      {
        key: 'code',
        label: 'Code',
        isVisible: setDisplaySettings.codeIsVisible,
        setVisibility: (value: boolean) => updateSetting('setCodeIsVisible', value),
        type: 'toggle',
      },
      {
        key: 'releaseDate',
        label: 'Release Date',
        isVisible: setDisplaySettings.releaseDateIsVisible,
        setVisibility: (value: boolean) => updateSetting('setReleaseDateIsVisible', value),
        type: 'toggle',
      },
      {
        key: 'category',
        label: 'Category',
        isVisible: setDisplaySettings.categoryIsVisible,
        setVisibility: (value: boolean) => updateSetting('setCategoryIsVisible', value),
        type: 'toggle',
      },
      {
        key: 'type',
        label: 'Type',
        isVisible: setDisplaySettings.typeIsVisible,
        setVisibility: (value: boolean) => updateSetting('setTypeIsVisible', value),
        type: 'toggle',
      },
      {
        key: 'cardCount',
        label: 'Cards In Set',
        isVisible: setDisplaySettings.cardCountIsVisible,
        setVisibility: (value: boolean) => updateSetting('setCardCountIsVisible', value),
        type: 'toggle',
      },
      {
        key: 'costs',
        label: 'Costs to Purchase',
        isVisible: setDisplaySettings.priceIsVisible,
        setVisibility: (value: boolean) => updateSetting('setPriceIsVisible', value),
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
        value: layoutSettings.setsPerRow,
        setValue: layoutSettings.setSetsPerRow,
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

  // Create table column settings (only shown in table view)
  const tableColumnSettings: CardSettingGroup = {
    label: 'Table Columns',
    type: 'toggle',
    settings: [
      {
        key: 'tableCode',
        label: 'Code',
        isVisible: tableSetSettings.codeIsVisible,
        setVisibility: (value: boolean) => updateSetting('tableSetCodeIsVisible', value),
        type: 'toggle',
      },
      {
        key: 'tableCardCount',
        label: 'Cards In Set',
        isVisible: tableSetSettings.cardCountIsVisible,
        setVisibility: (value: boolean) => updateSetting('tableSetCardCountIsVisible', value),
        type: 'toggle',
      },
      {
        key: 'tableCompletion',
        label: 'Completion',
        isVisible: collectionSetSettings.tableCompletionIsVisible,
        setVisibility: (value: boolean) => updateSetting('tableCollectionCompletionIsVisible', value),
        type: 'toggle',
      },
      {
        key: 'tableValue',
        label: 'Value',
        isVisible: collectionSetSettings.tableValueIsVisible,
        setVisibility: (value: boolean) => updateSetting('tableCollectionValueIsVisible', value),
        type: 'toggle',
      },
      {
        key: 'tableCostToComplete',
        label: '$ to Complete',
        isVisible: collectionSetSettings.tableCostToCompleteIsVisible,
        setVisibility: (value: boolean) => updateSetting('tableCollectionCostToCompleteIsVisible', value),
        type: 'toggle',
      },
      {
        key: 'tableReleaseDate',
        label: 'Release Date',
        isVisible: tableSetSettings.releaseDateIsVisible,
        setVisibility: (value: boolean) => updateSetting('tableSetReleaseDateIsVisible', value),
        type: 'toggle',
      },
      {
        key: 'tableType',
        label: 'Type',
        isVisible: tableSetSettings.typeIsVisible,
        setVisibility: (value: boolean) => updateSetting('tableSetTypeIsVisible', value),
        type: 'toggle',
      },
      {
        key: 'tableCategory',
        label: 'Category',
        isVisible: tableSetSettings.categoryIsVisible,
        setVisibility: (value: boolean) => updateSetting('tableSetCategoryIsVisible', value),
        type: 'toggle',
      },
      {
        key: 'tableIsDraftable',
        label: 'Draftable',
        isVisible: tableSetSettings.isDraftableIsVisible,
        setVisibility: (value: boolean) => updateSetting('tableSetIsDraftableIsVisible', value),
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
