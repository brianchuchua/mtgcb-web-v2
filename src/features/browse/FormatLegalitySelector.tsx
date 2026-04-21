'use client';

import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Box, FormControlLabel, Switch, Tooltip, Typography } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import AutocompleteWithNegation, { Option } from '@/components/ui/AutocompleteWithNegation';
import {
  FORMAT_LEGALITY_OPTIONS,
  FormatLegalityOption,
  getFormatLabel,
  isDigitalFormat,
} from '@/features/browse/formatLegalityConstants';
import {
  selectFormatsLegal,
  selectFormatsLegalIncludeBanned,
  setFormatsLegal,
  setFormatsLegalIncludeBanned,
} from '@/redux/slices/browse';

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
  const includeBanned = useSelector(selectFormatsLegalIncludeBanned);

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

  const hasAnyFormatSelected = selectedOptions.length > 0;

  return (
    <Box>
      <AutocompleteWithNegation
        label="Format Legality"
        options={availableOptions}
        selectedOptions={selectedOptions}
        setSelectedOptionsRemotely={handleChange}
      />
      {hasAnyFormatSelected && (
        <FormControlLabel
          sx={{ ml: 0.5, mt: 0.5, mb: -0.75 }}
          control={
            <Switch
              size="small"
              checked={includeBanned}
              onChange={(e) => dispatch(setFormatsLegalIncludeBanned(e.target.checked))}
            />
          }
          label={
            <Typography variant="body2" color="text.secondary">
              Include banned cards
              <Tooltip
                title="Banned cards aren't currently playable but have been printed in the format. Turn on to include them — useful for 'collect every card printed for Modern' instead of 'cards currently playable in Modern'."
                placement="top"
                arrow
              >
                <InfoOutlinedIcon
                  sx={{
                    fontSize: '0.875rem',
                    ml: 0.5,
                    verticalAlign: 'middle',
                    color: 'action.disabled',
                  }}
                />
              </Tooltip>
            </Typography>
          }
        />
      )}
    </Box>
  );
};

export default FormatLegalitySelector;
