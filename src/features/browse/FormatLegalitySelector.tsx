'use client';

import { useDispatch, useSelector } from 'react-redux';
import AutocompleteWithNegation, { Option } from '@/components/ui/AutocompleteWithNegation';
import {
  FORMAT_LEGALITY_OPTIONS,
  FormatLegalityOption,
  getFormatLabel,
  isDigitalFormat,
} from '@/features/browse/formatLegalityConstants';
import { selectFormatsLegal, setFormatsLegal } from '@/redux/slices/browse';

const PAPER_CATEGORY = 'Paper Formats';
const DIGITAL_CATEGORY = 'Digital Formats (Arena / MTGO)';

function formatToOption(format: FormatLegalityOption, exclude: boolean): Option {
  return {
    category: format.digital ? DIGITAL_CATEGORY : PAPER_CATEGORY,
    label: format.label,
    value: format.value,
    exclude,
  };
}

const FormatLegalitySelector = () => {
  const dispatch = useDispatch();
  const selectedFormats = useSelector(selectFormatsLegal);

  const availableOptions: Option[] = FORMAT_LEGALITY_OPTIONS.map((format) => formatToOption(format, false));

  const selectedOptions: Option[] = selectedFormats
    ? [
        ...selectedFormats.include.map((value) => ({
          category: isDigitalFormat(value) ? DIGITAL_CATEGORY : PAPER_CATEGORY,
          label: getFormatLabel(value),
          value,
          exclude: false,
        })),
        ...selectedFormats.exclude.map((value) => ({
          category: isDigitalFormat(value) ? DIGITAL_CATEGORY : PAPER_CATEGORY,
          label: getFormatLabel(value),
          value,
          exclude: true,
        })),
      ]
    : [];

  const handleChange = (next: Option[]) => {
    dispatch(
      setFormatsLegal({
        include: next.filter((o) => !o.exclude).map((o) => o.value),
        exclude: next.filter((o) => o.exclude).map((o) => o.value),
      }),
    );
  };

  return (
    <AutocompleteWithNegation
      label="Format Legality"
      options={availableOptions}
      selectedOptions={selectedOptions}
      setSelectedOptionsRemotely={handleChange}
    />
  );
};

export default FormatLegalitySelector;
