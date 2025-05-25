import { useMemo } from 'react';
import { useCollectionSetSettingGroups } from '@/hooks/useCollectionSetSettingGroups';
import { useCollectionSetDisplaySettings } from '@/hooks/useCollectionSetDisplaySettings';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { usePriceType } from '@/hooks/usePriceType';

interface UseCollectionDisplaySettingsProps {
  viewMode: 'grid' | 'table';
}

/**
 * Manages all display settings for collection views
 * Includes set gallery and table settings
 */
export function useCollectionDisplaySettings({ viewMode }: UseCollectionDisplaySettingsProps) {
  // Settings for display components
  const setDisplaySettings = useCollectionSetDisplaySettings(viewMode);
  const settingGroups = useCollectionSetSettingGroups(viewMode);
  const currentPriceType = usePriceType();

  const [setsPerRow] = useLocalStorage<number>('setsPerRow', 0); // Default to 0 (responsive)

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

  return {
    settingGroups,
    setDisplaySettings: formattedSetDisplaySettings,
    priceType: currentPriceType,
  };
}