'use client';

import { 
  useSetDisplaySettings as useSetDisplaySettingsFromContext,
  useTableSetSettings,
  useCollectionSetSettings
} from '@/contexts/DisplaySettingsContext';

interface CollectionSetDisplaySettings {
  // Grid visibility settings (reusing existing keys)
  nameIsVisible?: boolean;
  codeIsVisible?: boolean;
  releaseDateIsVisible?: boolean;
  typeIsVisible?: boolean;
  categoryIsVisible?: boolean;
  cardCountIsVisible?: boolean;
  costsIsVisible?: boolean;
  
  // Table column visibility settings (mapped from table* keys)
  isDraftableIsVisible?: boolean;
  completionIsVisible?: boolean;
  costToCompleteIsVisible?: boolean;
  valueIsVisible?: boolean;
}

export const useCollectionSetDisplaySettings = (viewMode: 'grid' | 'table'): CollectionSetDisplaySettings => {
  const setDisplaySettings = useSetDisplaySettingsFromContext();
  const tableSetSettings = useTableSetSettings();
  const collectionSetSettings = useCollectionSetSettings();

  if (viewMode === 'table') {
    return {
      codeIsVisible: tableSetSettings.codeIsVisible,
      cardCountIsVisible: tableSetSettings.cardCountIsVisible,
      releaseDateIsVisible: tableSetSettings.releaseDateIsVisible,
      typeIsVisible: tableSetSettings.typeIsVisible,
      categoryIsVisible: tableSetSettings.categoryIsVisible,
      isDraftableIsVisible: tableSetSettings.isDraftableIsVisible,
      completionIsVisible: collectionSetSettings.tableCompletionIsVisible,
      costToCompleteIsVisible: collectionSetSettings.tableCostToCompleteIsVisible,
      valueIsVisible: collectionSetSettings.tableValueIsVisible,
    };
  }

  // Grid view settings
  return {
    nameIsVisible: setDisplaySettings.nameIsVisible,
    codeIsVisible: setDisplaySettings.codeIsVisible,
    releaseDateIsVisible: setDisplaySettings.releaseDateIsVisible,
    typeIsVisible: setDisplaySettings.typeIsVisible,
    categoryIsVisible: setDisplaySettings.categoryIsVisible,
    cardCountIsVisible: setDisplaySettings.cardCountIsVisible,
    costsIsVisible: setDisplaySettings.priceIsVisible,
  };
};