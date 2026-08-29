'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useGetCardTreatmentsQuery } from '@/api/cards/cardsApi';
import AutocompleteWithNegation, { Option } from '@/components/ui/AutocompleteWithNegation';
import { formatFrameStyleName } from '@/features/browse/treatmentLabels';
import { selectFrameStyles, setFrameStyles } from '@/redux/slices/browse';

const CATEGORY = 'Frames';

const FrameStyleSelector = () => {
  const dispatch = useDispatch();
  const { data: treatments, isLoading, error } = useGetCardTreatmentsQuery();
  const [mappedFrameStyles, setMappedFrameStyles] = useState<Option[]>([]);
  const selectedFrameStyles = useSelector(selectFrameStyles);

  useEffect(() => {
    if (treatments) {
      // An API that predates this filter answers without `frameStyles` at all,
      // so the vocabulary is defaulted rather than mapped over blindly — the
      // selector then renders empty instead of taking the page down with it.
      setMappedFrameStyles(
        (treatments.frameStyles ?? []).map((frameStyle) => ({
          category: CATEGORY,
          label: formatFrameStyleName(frameStyle),
          value: frameStyle,
          exclude: false,
        })),
      );
    }
  }, [treatments]);

  const toOption = (frameStyle: string, exclude: boolean): Option => {
    const cleanFrameStyle = frameStyle.replace(/"/g, '');
    return {
      category: CATEGORY,
      label: formatFrameStyleName(cleanFrameStyle),
      value: cleanFrameStyle,
      exclude,
    };
  };

  const selectedOptions = selectedFrameStyles
    ? [
        ...selectedFrameStyles.include.map((frameStyle) => toOption(frameStyle, false)),
        ...selectedFrameStyles.exclude.map((frameStyle) => toOption(frameStyle, true)),
      ]
    : [];

  const handleChange = (options: Option[]) => {
    // Unquoted, unlike border colours: the API matches this field exactly on its
    // own, because the frame era is a closed vocabulary of whole tokens. A card
    // has exactly one, so include is an OR across the selection.
    dispatch(
      setFrameStyles({
        include: options.filter((option) => !option.exclude).map((option) => option.value),
        exclude: options.filter((option) => option.exclude).map((option) => option.value),
      }),
    );
  };

  if (isLoading || error) {
    return null;
  }

  return (
    <AutocompleteWithNegation
      label="Frames"
      options={mappedFrameStyles}
      selectedOptions={selectedOptions}
      setSelectedOptionsRemotely={handleChange}
    />
  );
};

export default FrameStyleSelector;
