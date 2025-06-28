'use client';

import { 
  useSetDisplaySettings as useSetDisplaySettingsFromContext,
  useTableSetSettings 
} from '@/contexts/DisplaySettingsContext';

export const useSetDisplaySettings = (viewMode: 'grid' | 'table') => {
  const setDisplaySettings = useSetDisplaySettingsFromContext();
  const tableSetSettings = useTableSetSettings();

  if (viewMode === 'grid') {
    return {
      nameIsVisible: setDisplaySettings.nameIsVisible,
      codeIsVisible: setDisplaySettings.codeIsVisible,
      releaseDateIsVisible: setDisplaySettings.releaseDateIsVisible,
      typeIsVisible: setDisplaySettings.typeIsVisible,
      categoryIsVisible: setDisplaySettings.categoryIsVisible,
      cardCountIsVisible: setDisplaySettings.cardCountIsVisible,
      costsIsVisible: setDisplaySettings.priceIsVisible,
    };
  }

  return {
    codeIsVisible: tableSetSettings.codeIsVisible,
    cardCountIsVisible: tableSetSettings.cardCountIsVisible,
    releaseDateIsVisible: tableSetSettings.releaseDateIsVisible,
    typeIsVisible: tableSetSettings.typeIsVisible,
    categoryIsVisible: tableSetSettings.categoryIsVisible,
    isDraftableIsVisible: tableSetSettings.isDraftableIsVisible,
  };
};