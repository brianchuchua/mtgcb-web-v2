'use client';

import { useLocalStorage } from './useLocalStorage';

export const useSetDisplaySettings = (viewMode: 'grid' | 'table') => {
  // Grid view settings
  const [nameIsVisible] = useLocalStorage('setNameIsVisible', true);
  const [codeIsVisible] = useLocalStorage('setCodeIsVisible', true);
  const [releaseDateIsVisible] = useLocalStorage('setReleaseDateIsVisible', true);
  const [typeIsVisible] = useLocalStorage('setTypeIsVisible', true);
  const [categoryIsVisible] = useLocalStorage('setCategoryIsVisible', true);
  const [cardCountIsVisible] = useLocalStorage('setCardCountIsVisible', true);
  const [costsIsVisible] = useLocalStorage('setCostsIsVisible', true);

  // Table view settings
  const [tableCodeIsVisible] = useLocalStorage('tableSetCodeIsVisible', true);
  const [tableCardCountIsVisible] = useLocalStorage('tableSetCardCountIsVisible', true);
  const [tableReleaseDateIsVisible] = useLocalStorage('tableSetReleaseDateIsVisible', true);
  const [tableTypeIsVisible] = useLocalStorage('tableSetTypeIsVisible', true);
  const [tableCategoryIsVisible] = useLocalStorage('tableSetCategoryIsVisible', false);
  const [tableIsDraftableIsVisible] = useLocalStorage('tableSetIsDraftableIsVisible', false);

  if (viewMode === 'grid') {
    return {
      nameIsVisible: true, // Boolean(nameIsVisible),
      codeIsVisible: true, // Boolean(codeIsVisible),
      releaseDateIsVisible: true, // Boolean(releaseDateIsVisible),
      typeIsVisible: true, // Boolean(typeIsVisible),
      categoryIsVisible: true, // Boolean(categoryIsVisible),
      cardCountIsVisible: true, // Boolean(cardCountIsVisible),
      costsIsVisible: Boolean(costsIsVisible),
    };
  }

  return {
    codeIsVisible: Boolean(tableCodeIsVisible),
    cardCountIsVisible: Boolean(tableCardCountIsVisible),
    releaseDateIsVisible: Boolean(tableReleaseDateIsVisible),
    typeIsVisible: Boolean(tableTypeIsVisible),
    categoryIsVisible: Boolean(tableCategoryIsVisible),
    isDraftableIsVisible: Boolean(tableIsDraftableIsVisible),
  };
};
