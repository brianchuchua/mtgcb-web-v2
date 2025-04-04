import { useLocalStorage } from './useLocalStorage';

export const useSetDisplaySettings = (viewMode: 'grid' | 'table') => {
  // Grid view settings
  const [nameIsVisible] = useLocalStorage('setNameIsVisible', true);
  const [codeIsVisible] = useLocalStorage('setCodeIsVisible', true);
  const [releaseDateIsVisible] = useLocalStorage('setReleaseDateIsVisible', true);
  const [cardCountIsVisible] = useLocalStorage('setCardCountIsVisible', true);

  // Table view settings
  const [tableCodeIsVisible] = useLocalStorage('tableSetCodeIsVisible', true);
  const [tableCardCountIsVisible] = useLocalStorage('tableSetCardCountIsVisible', true);
  const [tableReleaseDateIsVisible] = useLocalStorage('tableSetReleaseDateIsVisible', true);
  const [tableTypeIsVisible] = useLocalStorage('tableSetTypeIsVisible', true);
  const [tableCategoryIsVisible] = useLocalStorage('tableSetCategoryIsVisible', false);
  const [tableIsDraftableIsVisible] = useLocalStorage('tableSetIsDraftableIsVisible', false);

  if (viewMode === 'grid') {
    return {
      nameIsVisible,
      codeIsVisible,
      releaseDateIsVisible,
      cardCountIsVisible,
    };
  }

  return {
    codeIsVisible: tableCodeIsVisible,
    cardCountIsVisible: tableCardCountIsVisible,
    releaseDateIsVisible: tableReleaseDateIsVisible,
    typeIsVisible: tableTypeIsVisible,
    categoryIsVisible: tableCategoryIsVisible,
    isDraftableIsVisible: tableIsDraftableIsVisible,
  };
};
