'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useGetCardTreatmentsQuery } from '@/api/cards/cardsApi';
import AutocompleteWithNegation, { Option } from '@/components/ui/AutocompleteWithNegation';
import { formatBorderColorName } from '@/features/browse/treatmentLabels';
import { selectBorderColors, setBorderColors } from '@/redux/slices/browse';

const CATEGORY = 'Borders';

const BorderColorSelector = () => {
  const dispatch = useDispatch();
  const { data: treatments, isLoading, error } = useGetCardTreatmentsQuery();
  const [mappedBorderColors, setMappedBorderColors] = useState<Option[]>([]);
  const selectedBorderColors = useSelector(selectBorderColors);

  useEffect(() => {
    if (treatments) {
      setMappedBorderColors(
        treatments.borderColors.map((borderColor) => ({
          category: CATEGORY,
          label: formatBorderColorName(borderColor),
          value: borderColor,
          exclude: false,
        })),
      );
    }
  }, [treatments]);

  const toOption = (borderColor: string, exclude: boolean): Option => {
    const cleanBorderColor = borderColor.replace(/"/g, '');
    return {
      category: CATEGORY,
      label: formatBorderColorName(cleanBorderColor),
      value: cleanBorderColor,
      exclude,
    };
  };

  const selectedOptions = selectedBorderColors
    ? [
        ...selectedBorderColors.include.map((borderColor) => toOption(borderColor, false)),
        ...selectedBorderColors.exclude.map((borderColor) => toOption(borderColor, true)),
      ]
    : [];

  const handleChange = (options: Option[]) => {
    // Quoted, so each value matches the column exactly. A card carries exactly one
    // border colour, so include is an OR across the selection.
    dispatch(
      setBorderColors({
        include: options.filter((option) => !option.exclude).map((option) => `"${option.value}"`),
        exclude: options.filter((option) => option.exclude).map((option) => `"${option.value}"`),
      }),
    );
  };

  if (isLoading || error) {
    return null;
  }

  return (
    <AutocompleteWithNegation
      label="Borders"
      options={mappedBorderColors}
      selectedOptions={selectedOptions}
      setSelectedOptionsRemotely={handleChange}
    />
  );
};

export default BorderColorSelector;
