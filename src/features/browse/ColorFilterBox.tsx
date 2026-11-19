'use client';

import { IconButton, MenuItem, Select } from '@mui/material';
import { styled } from '@mui/material/styles';
import OutlinedBox from '@/components/ui/OutlinedBox';
import { ColorFilter, ColorMatchType, MTG_COLORS } from '@/types/browse';

/**
 * The five mana symbols, a colorless toggle and a match-type select. Shared by
 * the Colors and Color Identity filters on the browse form and the goal form,
 * which differ only in their label and where the value is stored.
 */
const ColorFilterBox = ({ label, testId, value, onChange }: ColorFilterBoxProps) => {
  const selectedColors = value?.colors || [];
  const matchType = value?.matchType || 'exactly';
  const includeColorless = value?.includeColorless || false;

  const handleColorClick = (color: string) => {
    if (color === 'C') {
      const newIncludeColorless = !includeColorless;
      onChange({
        colors: newIncludeColorless ? [] : selectedColors,
        matchType,
        includeColorless: newIncludeColorless,
      });
      return;
    }

    onChange({
      colors: selectedColors.includes(color) ? selectedColors.filter((c) => c !== color) : [...selectedColors, color],
      matchType,
      includeColorless: false,
    });
  };

  return (
    <OutlinedBox label={label}>
      <ColorSelect data-testid={testId}>
        {MTG_COLORS.map((color) => (
          <ColorButton
            key={color}
            size="small"
            onClick={() => handleColorClick(color)}
            isSelected={selectedColors.includes(color)}
            aria-label={`${label}: ${COLOR_NAMES[color]}`}
            aria-pressed={selectedColors.includes(color)}
            data-testid={`${testId}-${color}`}
          >
            <i className={`ms ms-${color.toLowerCase()} ms-cost ms-2x`} />
          </ColorButton>
        ))}
        <ColorButton
          size="small"
          onClick={() => handleColorClick('C')}
          isSelected={includeColorless}
          aria-label={`${label}: Colorless`}
          aria-pressed={includeColorless}
          data-testid={`${testId}-C`}
        >
          <i className="ms ms-c ms-cost ms-2x" />
        </ColorButton>
      </ColorSelect>

      <ColorTypeSelect>
        <Select
          fullWidth
          size="small"
          value={matchType}
          onChange={(event) =>
            onChange({
              colors: selectedColors,
              matchType: event.target.value as ColorMatchType,
              includeColorless,
            })
          }
          data-testid={`${testId}-match-type`}
          inputProps={{ 'aria-label': `${label} match type` }}
          sx={{
            '& .MuiSelect-select': {
              py: 1,
            },
          }}
        >
          <MenuItem value="exactly">Only These Colors</MenuItem>
          <MenuItem value="atLeast">At Least These Colors</MenuItem>
          <MenuItem value="atMost">At Most These Colors</MenuItem>
        </Select>
      </ColorTypeSelect>
    </OutlinedBox>
  );
};

interface ColorFilterBoxProps {
  label: string;
  testId: string;
  value: ColorFilter | undefined;
  onChange: (value: ColorFilter) => void;
}

const COLOR_NAMES: Record<string, string> = {
  W: 'White',
  U: 'Blue',
  B: 'Black',
  R: 'Red',
  G: 'Green',
};

const ColorSelect = styled('div')({
  display: 'flex',
  justifyContent: 'center',
  gap: 6,
  paddingBottom: 8,
});

const ColorTypeSelect = styled('div')({
  paddingTop: 8,
});

interface ColorButtonProps {
  isSelected: boolean;
}

const ColorButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== 'isSelected',
})<ColorButtonProps>(({ isSelected }) => ({
  padding: 0,
  borderRadius: '50%',
  opacity: isSelected ? 1 : 0.3,
  '&:hover': {
    borderRadius: '50%',
    opacity: isSelected ? 1 : 0.5,
    margin: 0,
  },
  '&.Mui-disabled': {
    opacity: 0.2,
  },
  '& .ms': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
}));

export default ColorFilterBox;
