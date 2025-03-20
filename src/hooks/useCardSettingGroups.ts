'use client';

import { useLocalStorage } from './useLocalStorage';
import {
  CardSelectSetting,
  CardSettingGroup,
  CardSliderSetting,
} from '@/components/cards/CardSettingsPanel';

export const useCardSettingGroups = (): CardSettingGroup[] => {
  const [nameIsVisible, setNameIsVisible] = useLocalStorage('cardNameIsVisible', true);
  const [setIsVisible, setSetIsVisible] = useLocalStorage('cardSetIsVisible', true);
  const [priceIsVisible, setPriceIsVisible] = useLocalStorage('cardPriceIsVisible', true);
  const [cardsPerRow, setCardsPerRow] = useLocalStorage('cardsPerRow', 4);
  const [cardSizeMargin, setCardSizeMargin] = useLocalStorage('cardSizeMargin', 5);

  return [
    {
      label: 'Show Fields',
      type: 'toggle',
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
    {
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
            { value: 1, label: '1' },
            { value: 2, label: '2' },
            { value: 3, label: '3' },
            { value: 4, label: '4' },
            { value: 5, label: '5' },
            { value: 6, label: '6' },
          ],
        },
      ],
    },
    {
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
    },
  ];
};
