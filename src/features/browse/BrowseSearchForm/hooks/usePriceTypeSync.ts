import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSnackbar } from 'notistack';
import { CardSelectSetting } from '@/components/cards/CardSettingsPanel';
import { useCardSettingGroups } from '@/hooks/useCardSettingGroups';
import { usePriceType } from '@/hooks/usePriceType';
import { selectSortBy, selectViewContentType, setSortBy } from '@/redux/slices/browseSlice';
import { SortByOption } from '@/types/browse';
import { PriceType } from '@/types/pricing';

export const usePriceTypeSync = () => {
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const initialCheckDone = useRef(false);
  const prevDisplayPriceType = useRef<string | null>(null);
  const initialRenderComplete = useRef(false);

  const contentType = useSelector(selectViewContentType);
  const reduxSortBy = useSelector(selectSortBy) || 'releasedAt';
  const displayPriceType = usePriceType();

  const cardSettings = useCardSettingGroups();
  const priceSettings = cardSettings?.[1]?.settings?.[0] as CardSelectSetting | undefined;
  const setDisplayPriceType = priceSettings?.setValue;

  useEffect(() => {
    if (!initialRenderComplete.current) {
      const timer = setTimeout(() => {
        initialRenderComplete.current = true;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (prevDisplayPriceType.current === null) {
      prevDisplayPriceType.current = displayPriceType;
      return;
    }

    if (prevDisplayPriceType.current !== displayPriceType) {
      if (isPriceSort(reduxSortBy) && reduxSortBy !== displayPriceType && reduxSortBy !== 'foil') {
        dispatch(setSortBy(displayPriceType as SortByOption));
        enqueueSnackbar(`Changed your sort to ${displayPriceType} prices to match your display price setting.`, {
          variant: 'info',
        });
      }

      prevDisplayPriceType.current = displayPriceType;
    }
  }, [displayPriceType, reduxSortBy, dispatch, enqueueSnackbar]);

  useEffect(() => {
    if (initialCheckDone.current) return;

    const isPriceSortValue = isPriceSort(reduxSortBy);

    if (isPriceSortValue && reduxSortBy !== displayPriceType && reduxSortBy !== 'foil') {
      enqueueSnackbar(
        `You're sorting by ${reduxSortBy} prices, but displaying ${displayPriceType} prices in the gallery. This may be confusing.`,
        {
          variant: 'warning',
          autoHideDuration: 8000,
        },
      );
    }

    initialCheckDone.current = true;
  }, [reduxSortBy, displayPriceType, enqueueSnackbar]);

  const handlePriceSortChange = (newSortBy: SortByOption) => {
    if (
      contentType === 'cards' &&
      isPriceSort(newSortBy) &&
      newSortBy !== displayPriceType &&
      newSortBy !== 'foil' &&
      setDisplayPriceType
    ) {
      const priceTypeValue = getPriceTypeEnum(newSortBy);
      setDisplayPriceType(priceTypeValue);

      enqueueSnackbar(`Changed your display price setting to ${newSortBy} to match your sort selection.`, {
        variant: 'info',
      });
    }
  };

  return {
    displayPriceType,
    isPriceSort,
    isPriceMismatched: (priceOption: string) => isPriceMismatched(priceOption, displayPriceType),
    handlePriceSortChange,
  };
};

function isPriceSort(option: string): boolean {
  return option === 'market' || option === 'low' || option === 'average' || option === 'high' || option === 'foil';
}

function isPriceMismatched(priceOption: string, displayPriceType: string): boolean {
  return isPriceSort(priceOption) && priceOption !== displayPriceType && priceOption !== 'foil';
}

function getPriceTypeEnum(priceType: string): number {
  switch (priceType) {
    case 'market':
      return PriceType.Market as unknown as number;
    case 'low':
      return PriceType.Low as unknown as number;
    case 'average':
      return PriceType.Average as unknown as number;
    case 'high':
      return PriceType.High as unknown as number;
    default:
      return PriceType.Market as unknown as number;
  }
}