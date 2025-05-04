'use client';

import { IconButton, MenuItem, Paper, Select } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectColors, setColors } from '@/redux/slices/browseSlice';
import { ColorMatchType, MTG_COLORS, MtgColor } from '@/types/browse';

const ColorSelector = () => {
  const dispatch = useDispatch();
  const colorFilter = useSelector(selectColors);

  // Get current values from Redux state, with defaults if not set
  const selectedColors = colorFilter?.colors || [];
  const matchType = colorFilter?.matchType || 'exactly';
  const includeColorless = colorFilter?.includeColorless || false;

  const handleColorClick = useCallback(
    (color: MtgColor | 'C') => {
      if (color === 'C') {
        // Toggle colorless
        const newIncludeColorless = !includeColorless;

        dispatch(
          setColors({
            colors: newIncludeColorless ? [] : selectedColors,
            matchType,
            includeColorless: newIncludeColorless,
          }),
        );
      } else {
        // If selecting a color, disable colorless if it's enabled
        const newColors = selectedColors.includes(color)
          ? selectedColors.filter((c) => c !== color)
          : [...selectedColors, color];

        dispatch(
          setColors({
            colors: newColors,
            matchType,
            includeColorless: false, // Always disable colorless when selecting a color
          }),
        );
      }
    },
    [dispatch, matchType, selectedColors, includeColorless],
  );

  const handleMatchTypeChange = useCallback(
    (event: any) => {
      const newMatchType = event.target.value as ColorMatchType;
      dispatch(
        setColors({
          colors: selectedColors,
          matchType: newMatchType,
          includeColorless,
        }),
      );
    },
    [dispatch, selectedColors, includeColorless],
  );

  const getMatchTypeLabel = (type: ColorMatchType): string => {
    switch (type) {
      case 'exactly':
        return 'Only These Colors';
      case 'atLeast':
        return 'At Least These Colors';
      case 'atMost':
        return 'At Most These Colors';
      default:
        return type;
    }
  };

  return (
    <ColorSelectorWrapper variant="outlined">
      <ColorSelect>
        {MTG_COLORS.map((color) => (
          <ColorButton
            key={color}
            size="small"
            onClick={() => handleColorClick(color)}
            isSelected={selectedColors.includes(color)}
          >
            <i className={`ms ms-${color.toLowerCase()} ms-cost ms-2x`} />
          </ColorButton>
        ))}
        <ColorButton size="small" onClick={() => handleColorClick('C')} isSelected={includeColorless}>
          <i className="ms ms-c ms-cost ms-2x" />
        </ColorButton>
      </ColorSelect>

      <ColorTypeSelect>
        <Select
          fullWidth
          size="small"
          value={matchType}
          onChange={handleMatchTypeChange}
          sx={{
            '& .MuiSelect-select': {
              py: 1,
            },
          }}
        >
          <MenuItem value="exactly">{getMatchTypeLabel('exactly')}</MenuItem>
          <MenuItem value="atLeast">{getMatchTypeLabel('atLeast')}</MenuItem>
          <MenuItem value="atMost">{getMatchTypeLabel('atMost')}</MenuItem>
        </Select>
      </ColorTypeSelect>
    </ColorSelectorWrapper>
  );
};

const ColorSelectorWrapper = styled(Paper)(({ theme }) => ({
  '&&': { margin: theme.spacing(0), marginTop: '12px' },
  paddingTop: theme.spacing(1),
  borderColor: theme.palette.grey[700],
}));

const ColorSelect = styled('div')({
  display: 'flex',
  justifyContent: 'center',
  gap: 6,
  padding: '0 8px',
});

const ColorTypeSelect = styled('div')(({ theme }) => ({
  padding: theme.spacing(1),
  paddingTop: theme.spacing(1.25),
  paddingBottom: theme.spacing(1.25),
}));

interface ColorButtonProps {
  isSelected: boolean;
}

const ColorButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== 'isSelected',
})<ColorButtonProps>(({ isSelected, theme }) => ({
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

export default ColorSelector;
