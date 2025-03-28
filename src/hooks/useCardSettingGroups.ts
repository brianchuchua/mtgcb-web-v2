'use client';

import { useLocalStorage } from './useLocalStorage';
import {
  CardSelectSetting,
  CardSettingGroup,
  CardSliderSetting,
} from '@/components/cards/CardSettingsPanel';
import { PriceType } from '@/types/pricing';

export const useCardSettingGroups = (): CardSettingGroup[] => {
  // Card visibility settings
  const [nameIsVisible, setNameIsVisible] = useLocalStorage('cardNameIsVisible', true);
  const [setIsVisible, setSetIsVisible] = useLocalStorage('cardSetIsVisible', true);
  const [priceIsVisible, setPriceIsVisible] = useLocalStorage('cardPriceIsVisible', true);

  // Layout settings
  const [cardsPerRow, setCardsPerRow] = useLocalStorage('cardsPerRow', 4);
  const [cardSizeMargin, setCardSizeMargin] = useLocalStorage('cardSizeMargin', 0);

  // Price display setting
  const [displayPriceType, setDisplayPriceType] = useLocalStorage<PriceType>(
    'displayPriceType',
    PriceType.Market,
  );

  const handleSetPriceType = (value: number): void => {
    setDisplayPriceType(value as unknown as PriceType);
  };

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
    },
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
