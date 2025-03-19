'use client';

import { useLocalStorage } from './useLocalStorage';
import { CardSettingGroup } from '@/components/cards/CardSettingsPanel';

export const useCardSettingGroups = (): CardSettingGroup[] => {
  const [nameIsVisible, setNameIsVisible] = useLocalStorage('cardNameIsVisible', true);
  const [setIsVisible, setSetIsVisible] = useLocalStorage('cardSetIsVisible', true);
  const [priceIsVisible, setPriceIsVisible] = useLocalStorage('cardPriceIsVisible', true);

  return [
    {
      label: 'Show Fields',
      type: 'toggleFilters',
      settings: [
        {
          key: 'name',
          label: 'Name',
          isVisible: nameIsVisible,
          setVisibility: setNameIsVisible,
        },
        {
          key: 'set',
          label: 'Set',
          isVisible: setIsVisible,
          setVisibility: setSetIsVisible,
        },
        {
          key: 'price',
          label: 'Price',
          isVisible: priceIsVisible,
          setVisibility: setPriceIsVisible,
        },
      ],
    },
  ];
};
