'use client';

import { useDispatch, useSelector } from 'react-redux';
import AutocompleteWithNegation, { Option } from '@/components/ui/AutocompleteWithNegation';
import { selectSetCategories, setSetCategories } from '@/redux/slices/browseSlice';

const CATEGORY_MAP = [
  { name: 'Normal', value: 'normal' },
  { name: 'Sealed', value: 'sealed' },
  { name: 'Special', value: 'special' },
];

const SetCategorySelector = () => {
  const dispatch = useDispatch();
  const selectedCategories = useSelector(selectSetCategories);

  const mappedCategories: Option[] = CATEGORY_MAP.map((category) => ({
    category: 'Set Categories',
    label: category.name,
    value: category.value,
    exclude: false,
  }));

  const selectedOptions = selectedCategories
    ? [
        ...selectedCategories.include.map((categoryValue) => ({
          category: 'Set Categories',
          label: CATEGORY_MAP.find((r) => r.value === categoryValue)?.name || 'Unknown',
          value: categoryValue,
          exclude: false,
        })),
        ...selectedCategories.exclude.map((categoryValue) => ({
          category: 'Set Categories',
          label: CATEGORY_MAP.find((r) => r.value === categoryValue)?.name || 'Unknown',
          value: categoryValue,
          exclude: true,
        })),
      ]
    : [];

  const handleCategoryChange = (selectedCategories: Option[]) => {
    const categoryFilter = {
      include: selectedCategories.filter((category) => !category.exclude).map((category) => category.value),
      exclude: selectedCategories.filter((category) => category.exclude).map((category) => category.value),
    };

    dispatch(setSetCategories(categoryFilter));
  };

  return (
    <AutocompleteWithNegation
      label="Set Categories"
      options={mappedCategories}
      selectedOptions={selectedOptions}
      setSelectedOptionsRemotely={handleCategoryChange}
    />
  );
};

export default SetCategorySelector;