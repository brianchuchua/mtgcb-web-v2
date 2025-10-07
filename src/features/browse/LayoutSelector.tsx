'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useGetCardLayoutsQuery } from '@/api/cards/cardsApi';
import AutocompleteWithNegation, { Option } from '@/components/ui/AutocompleteWithNegation';
import { selectLayouts, setLayouts } from '@/redux/slices/browseSlice';

// Helper function to format layout names for display
const formatLayoutName = (layout: string): string => {
  return layout
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const LayoutSelector = () => {
  const dispatch = useDispatch();
  const { data: cardLayouts, isLoading, error } = useGetCardLayoutsQuery();
  const [mappedLayouts, setMappedLayouts] = useState<Option[]>([]);
  const selectedLayouts = useSelector(selectLayouts);

  useEffect(() => {
    if (cardLayouts) {
      const allLayouts: Option[] = cardLayouts.layouts.map((layout) => ({
        category: 'Layouts',
        label: formatLayoutName(layout),
        value: layout,
        exclude: false,
      }));

      setMappedLayouts(allLayouts);
    }
  }, [cardLayouts]);

  // Convert selectedLayouts from Redux to Option[] format
  const selectedOptions = selectedLayouts
    ? [
        ...selectedLayouts.include.map((layout) => {
          const cleanLayout = layout.replace(/"/g, '');
          return {
            category: 'Layouts',
            label: formatLayoutName(cleanLayout),
            value: cleanLayout,
            exclude: false,
          };
        }),
        ...selectedLayouts.exclude.map((layout) => {
          const cleanLayout = layout.replace(/"/g, '');
          return {
            category: 'Layouts',
            label: formatLayoutName(cleanLayout),
            value: cleanLayout,
            exclude: true,
          };
        }),
      ]
    : [];

  const handleLayoutChange = (selectedLayouts: Option[]) => {
    // Convert Option[] back to LayoutFilter format for Redux
    const layoutFilter = {
      include: selectedLayouts.filter((layout) => !layout.exclude).map((layout) => `"${layout.value}"`),
      exclude: selectedLayouts.filter((layout) => layout.exclude).map((layout) => `"${layout.value}"`),
    };

    dispatch(setLayouts(layoutFilter));
  };

  if (isLoading) {
    return null;
  }

  if (error) {
    return null;
  }

  return (
    <>
      <AutocompleteWithNegation
        label="Card Layouts"
        options={mappedLayouts}
        selectedOptions={selectedOptions}
        setSelectedOptionsRemotely={handleLayoutChange}
      />
    </>
  );
};

export default LayoutSelector;
