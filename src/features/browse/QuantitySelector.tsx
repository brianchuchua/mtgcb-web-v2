import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Collapse,
  styled,
  Chip,
  FormControlLabel,
  IconButton,
  Popover,
  Switch,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useDispatch, useSelector } from 'react-redux';
import { setStats, selectStats, setIncludeBadDataOnly, selectIncludeBadDataOnly, selectSelectedGoalId } from '@/redux/slices/browse';
import { StatFilters } from '@/types/browse';
import OutlinedBox from '@/components/ui/OutlinedBox';


const StyledToggleButton = styled(ToggleButton)(({ theme }) => ({
  flex: 1,
  fontSize: '0.875rem',
}));

const ExpandableText = styled(Box)(({ theme }) => ({
  cursor: 'pointer',
  color: theme.palette.primary.main,
  fontSize: '0.875rem',
  marginTop: theme.spacing(1),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(0.5),
  '&:hover': {
    textDecoration: 'underline',
  },
}));

interface QuantitySelectorProps {
  isCollectionPage?: boolean;
}

type QuantityOption = 'all' | '0x' | '1x' | '2x' | '3x' | '4x' | '5x+';
type QuantityType = 'quantityAll' | 'quantityReg' | 'quantityFoil';

const QUANTITY_OPTIONS: QuantityOption[] = ['all', '0x', '1x', '2x', '3x', '4x', '5x+'];

const QuantitySelector: React.FC<QuantitySelectorProps> = ({ isCollectionPage }) => {
  const dispatch = useDispatch();
  const statFilters = useSelector(selectStats);
  const includeBadDataOnly = useSelector(selectIncludeBadDataOnly) ?? false;
  const selectedGoalId = useSelector(selectSelectedGoalId);
  const [expanded, setExpanded] = useState(false);
  const [infoAnchorEl, setInfoAnchorEl] = useState<HTMLElement | null>(null);

  // Parse current stat filters to determine selected values and custom filters
  const parseQuantityFilter = (quantityType: QuantityType): { selected: QuantityOption[]; hasCustomFilter: boolean } => {
    const filters = statFilters?.[quantityType] || [];
    if (filters.length === 0) return { selected: [], hasCustomFilter: false };

    const matchedOptions: QuantityOption[] = [];
    let hasUnmatchedFilters = false;

    // Look for exact matches that correspond to our button options
    for (const filter of filters) {
      // Extract operator and value from filter string (e.g., "eq0", "gte5")
      const match = filter.match(/^(eq|gte|gt|lte|lt|not)(\d+(?:\.\d+)?)$/);
      if (!match) {
        hasUnmatchedFilters = true;
        continue;
      }

      const [, operator, value] = match;

      // Check for exact matches for our button options
      if (operator === 'eq') {
        switch (value) {
          case '0':
            matchedOptions.push('0x');
            break;
          case '1':
            matchedOptions.push('1x');
            break;
          case '2':
            matchedOptions.push('2x');
            break;
          case '3':
            matchedOptions.push('3x');
            break;
          case '4':
            matchedOptions.push('4x');
            break;
          default:
            hasUnmatchedFilters = true;
        }
      } else if ((operator === 'gte' && value === '5') ||
                 (operator === 'gt' && value === '4')) {
        matchedOptions.push('5x+');
      } else {
        hasUnmatchedFilters = true;
      }
    }

    // If we have unmatched filters, it's a custom filter
    const hasCustomFilter = hasUnmatchedFilters;

    return { selected: matchedOptions, hasCustomFilter };
  };

  // Use useMemo to prevent unnecessary recalculations
  const allFilterState = useMemo(() => parseQuantityFilter('quantityAll'), [statFilters]);
  const regFilterState = useMemo(() => parseQuantityFilter('quantityReg'), [statFilters]);
  const foilFilterState = useMemo(() => parseQuantityFilter('quantityFoil'), [statFilters]);

  // Convert a QuantityOption to its filter condition string
  const optionToFilterCondition = (option: QuantityOption): string | null => {
    switch (option) {
      case '0x': return 'eq0';
      case '1x': return 'eq1';
      case '2x': return 'eq2';
      case '3x': return 'eq3';
      case '4x': return 'eq4';
      case '5x+': return 'gte5';
      default: return null;
    }
  };

  const handleQuantityChange = (
    quantityType: QuantityType,
    value: QuantityOption | null
  ) => {
    if (!value) return;

    // Create a copy of current stat filters
    const newStatFilters: StatFilters = { ...statFilters };
    const currentFilters = newStatFilters[quantityType] || [];

    if (value === 'all') {
      // "All" button clears the filter
      delete newStatFilters[quantityType];
    } else {
      const filterCondition = optionToFilterCondition(value);
      if (!filterCondition) return;

      // Toggle behavior: if already selected, remove it; otherwise add it
      const isCurrentlySelected = currentFilters.includes(filterCondition);

      if (isCurrentlySelected) {
        // Remove this filter condition
        const updatedFilters = currentFilters.filter(f => f !== filterCondition);
        if (updatedFilters.length === 0) {
          delete newStatFilters[quantityType];
        } else {
          newStatFilters[quantityType] = updatedFilters;
        }
      } else {
        // Add this filter condition to the existing ones
        newStatFilters[quantityType] = [...currentFilters, filterCondition];
      }
    }

    // Dispatch the updated filters, preserving all non-quantity filters
    dispatch(setStats(newStatFilters));
  };

  const handleIncludeBadDataToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setIncludeBadDataOnly(event.target.checked));
  };

  if (!isCollectionPage) {
    return null;
  }

  const renderQuantitySelector = (
    label: string,
    quantityType: QuantityType,
    filterState: { selected: QuantityOption[]; hasCustomFilter: boolean }
  ) => {
    // Check if "All" should appear selected (no filters active)
    const isAllSelected = filterState.selected.length === 0 && !filterState.hasCustomFilter;

    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1, gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
          {filterState.hasCustomFilter && (
            <Chip
              label="Custom filter active"
              size="small"
              color="primary"
              variant="outlined"
              sx={{ height: 20, fontSize: '0.75rem' }}
            />
          )}
        </Box>
        <ToggleButtonGroup
          value={filterState.selected}
          onChange={(_, value) => {
            // When clicking on a button, we get the new array of selected values
            // But we want toggle behavior, so we handle it in handleQuantityChange
          }}
          fullWidth
          size="small"
        >
          {QUANTITY_OPTIONS.map((option) => (
            <StyledToggleButton
              key={option}
              value={option}
              selected={option === 'all' ? isAllSelected : filterState.selected.includes(option)}
              onClick={() => handleQuantityChange(quantityType, option)}
            >
              {option === 'all' ? 'All' : option}
            </StyledToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>
    );
  };

  return (
    <OutlinedBox label="Quantity Collected">
      {renderQuantitySelector('All Cards', 'quantityAll', allFilterState)}
      
      <ExpandableText onClick={() => setExpanded(!expanded)}>
        <Typography variant="body2">
          {expanded ? 'Less' : 'More'} options
        </Typography>
        {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
      </ExpandableText>

      <Collapse in={expanded}>
        <Box sx={{ mt: 2 }}>
          {renderQuantitySelector('Normal Cards', 'quantityReg', regFilterState)}
        </Box>
        <Box sx={{ mt: 2 }}>
          {renderQuantitySelector('Foil Cards', 'quantityFoil', foilFilterState)}
        </Box>
        
        {!selectedGoalId && (
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={includeBadDataOnly}
                  onChange={handleIncludeBadDataToggle}
                  name="includeBadDataOnly"
                  color="primary"
                  size="small"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="body2">Show Bad Data</Typography>
                  <IconButton
                    size="small"
                    onClick={(e) => setInfoAnchorEl(e.currentTarget)}
                    sx={{
                      padding: 0,
                      color: 'text.secondary',
                      '&:hover': {
                        backgroundColor: 'transparent',
                        color: 'primary.main',
                      },
                    }}
                  >
                    <InfoOutlinedIcon sx={{ fontSize: '1rem' }} />
                  </IconButton>
                </Box>
              }
            />
          </Box>
        )}
      </Collapse>

      <Popover
        open={Boolean(infoAnchorEl)}
        anchorEl={infoAnchorEl}
        onClose={() => setInfoAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <Box sx={{ p: 2, maxWidth: 300 }}>
          <Typography variant="body2" component="div">
            Shows cards that were input that aren&apos;t possible to own, like foil printings of cards that don&apos;t come in foil
          </Typography>
        </Box>
      </Popover>
    </OutlinedBox>
  );
};

export default QuantitySelector;