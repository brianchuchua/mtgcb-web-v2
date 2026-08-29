'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useGetCardTreatmentsQuery } from '@/api/cards/cardsApi';
import AutocompleteWithNegation, { Option } from '@/components/ui/AutocompleteWithNegation';
import { formatFrameEffectName } from '@/features/browse/treatmentLabels';
import { selectFrameEffects, setFrameEffects } from '@/redux/slices/browse';

const CATEGORY = 'Frame Effects';

const FrameEffectSelector = () => {
  const dispatch = useDispatch();
  const { data: treatments, isLoading, error } = useGetCardTreatmentsQuery();
  const [mappedFrameEffects, setMappedFrameEffects] = useState<Option[]>([]);
  const selectedFrameEffects = useSelector(selectFrameEffects);

  useEffect(() => {
    if (treatments) {
      setMappedFrameEffects(
        treatments.frameEffects.map((frameEffect) => ({
          category: CATEGORY,
          label: formatFrameEffectName(frameEffect),
          value: frameEffect,
          exclude: false,
        })),
      );
    }
  }, [treatments]);

  const toOption = (frameEffect: string, exclude: boolean): Option => {
    const cleanFrameEffect = frameEffect.replace(/"/g, '');
    return {
      category: CATEGORY,
      label: formatFrameEffectName(cleanFrameEffect),
      value: cleanFrameEffect,
      exclude,
    };
  };

  const selectedOptions = selectedFrameEffects
    ? [
        ...selectedFrameEffects.include.map((frameEffect) => toOption(frameEffect, false)),
        ...selectedFrameEffects.exclude.map((frameEffect) => toOption(frameEffect, true)),
      ]
    : [];

  const handleChange = (options: Option[]) => {
    // Deliberately unquoted, unlike border colours. A card can carry several frame
    // effects and they live in one text column as a Postgres array literal, so the
    // filter has to match as a substring — quoting would demand the column equal the
    // single effect and would miss every multi-effect card. Safe because no effect
    // token is a substring of another.
    dispatch(
      setFrameEffects({
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
      label="Frame Effects"
      options={mappedFrameEffects}
      selectedOptions={selectedOptions}
      setSelectedOptionsRemotely={handleChange}
    />
  );
};

export default FrameEffectSelector;
