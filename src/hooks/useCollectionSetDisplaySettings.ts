'use client';

import { useLocalStorage } from './useLocalStorage';

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
  // Grid visibility settings
  const [nameIsVisible] = useLocalStorage('setNameIsVisible', true);
  const [codeIsVisible] = useLocalStorage('setCodeIsVisible', true);
  const [releaseDateIsVisible] = useLocalStorage('setReleaseDateIsVisible', true);
  const [typeIsVisible] = useLocalStorage('setTypeIsVisible', true);
  const [categoryIsVisible] = useLocalStorage('setCategoryIsVisible', true);
  const [cardCountIsVisible] = useLocalStorage('setCardCountIsVisible', true);
  const [costsIsVisible] = useLocalStorage('setCostsIsVisible', true);

  // Table column visibility settings
  const [tableCodeIsVisible] = useLocalStorage('tableSetCodeIsVisible', true);
  const [tableCardCountIsVisible] = useLocalStorage('tableSetCardCountIsVisible', true);
  const [tableReleaseDateIsVisible] = useLocalStorage('tableSetReleaseDateIsVisible', true);
  const [tableTypeIsVisible] = useLocalStorage('tableSetTypeIsVisible', true);
  const [tableCategoryIsVisible] = useLocalStorage('tableSetCategoryIsVisible', false);
  const [tableIsDraftableIsVisible] = useLocalStorage('tableSetIsDraftableIsVisible', false);
  
  // Collection-specific table columns
  const [tableCompletionIsVisible] = useLocalStorage('tableCollectionCompletionIsVisible', true);
  const [tableCostToCompleteIsVisible] = useLocalStorage('tableCollectionCostToCompleteIsVisible', true);
  const [tableValueIsVisible] = useLocalStorage('tableCollectionValueIsVisible', true);

  if (viewMode === 'table') {
    return {
      codeIsVisible: tableCodeIsVisible,
      cardCountIsVisible: tableCardCountIsVisible,
      releaseDateIsVisible: tableReleaseDateIsVisible,
      typeIsVisible: tableTypeIsVisible,
      categoryIsVisible: tableCategoryIsVisible,
      isDraftableIsVisible: tableIsDraftableIsVisible,
      completionIsVisible: tableCompletionIsVisible,
      costToCompleteIsVisible: tableCostToCompleteIsVisible,
      valueIsVisible: tableValueIsVisible,
    };
  }

  // Grid view settings
  return {
    nameIsVisible,
    codeIsVisible,
    releaseDateIsVisible,
    typeIsVisible,
    categoryIsVisible,
    cardCountIsVisible,
    costsIsVisible,
  };
};