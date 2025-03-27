'use client';

import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import RemoveIcon from '@mui/icons-material/Remove';
import {
  Box,
  Button,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectSearchParams, selectStats, setStats } from '@/redux/slices/browseSlice';
import { StatCondition, StatFilters } from '@/types/browse';

const STAT_ATTRIBUTES = [
  { label: 'Mana Value', value: 'convertedManaCost' },
  { label: 'Power', value: 'powerNumeric' },
  { label: 'Toughness', value: 'toughnessNumeric' },
  { label: 'Loyalty', value: 'loyaltyNumeric' },
  { label: 'Price (Market)', value: 'market' },
  { label: 'Price (Low)', value: 'low' },
  { label: 'Price (Average)', value: 'average' },
  { label: 'Price (High)', value: 'high' },
  { label: 'Price (Foil)', value: 'foil' },
];

const OPERATORS = [
  { label: '>=', value: 'gte' },
  { label: '>', value: 'gt' },
  { label: '<=', value: 'lte' },
  { label: '<', value: 'lt' },
  { label: '=', value: 'eq' },
  { label: '≠', value: 'not' },
];

const DEFAULT_CONDITION: StatCondition = {
  attribute: 'convertedManaCost',
  operator: 'gte',
  value: '',
};

const parseReduxStats = (reduxStats: StatFilters | undefined): StatCondition[] => {
  if (!reduxStats) return [];

  const parsed = Object.entries(reduxStats)
    .flatMap(([attribute, conditions]) =>
      conditions.map((condition) => {
        for (const op of ['gte', 'gt', 'lte', 'lt', 'eq', 'not']) {
          if (condition.startsWith(op)) {
            const value = condition.slice(op.length);
            return { attribute, operator: op, value };
          }
        }
        return null;
      }),
    )
    .filter((condition): condition is StatCondition => condition !== null);

  return parsed.length > 0 ? parsed : [];
};

const StatSearch = () => {
  const dispatch = useDispatch();
  const reduxStats = useSelector(selectStats);
  const searchParams = useSelector(selectSearchParams);
  const userModified = useRef(false);
  const [conditions, setConditions] = useState<StatCondition[]>(() => parseReduxStats(reduxStats));
  const [filtersActive, setFiltersActive] = useState(conditions.length > 0);

  // Check if search parameters are empty (after reset)
  const everyConditionHasAEmptyValue = conditions.every((condition) => condition.value === '');
  const isEmptySearchParams =
    everyConditionHasAEmptyValue || Object.keys(searchParams || {}).length === 0;

  // Sync with Redux state when it changes
  useEffect(() => {
    // Reset our local state if the search params are empty (after reset action)
    if (isEmptySearchParams) {
      userModified.current = false;
      setConditions([]);
      setFiltersActive(false);
      return;
    }

    // Normal sync with Redux for URL changes
    if (!userModified.current) {
      const parsedConditions = parseReduxStats(reduxStats);
      setConditions(parsedConditions);
      setFiltersActive(parsedConditions.length > 0);
    }
  }, [reduxStats, searchParams, isEmptySearchParams]);

  // Update Redux when local state changes
  useEffect(() => {
    if (!userModified.current) return;

    // If filters are not active, ensure we clear any existing stats from redux
    if (!filtersActive) {
      dispatch(setStats({}));
      return;
    }

    const statFilters: StatFilters = {};

    conditions.forEach(({ attribute, operator, value }) => {
      if (!value) return;

      if (!statFilters[attribute]) {
        statFilters[attribute] = [];
      }
      statFilters[attribute].push(`${operator}${value}`);
    });

    dispatch(setStats(statFilters));
  }, [conditions, dispatch, filtersActive]);

  const handleAttributeChange = (index: number, newValue: string) => {
    userModified.current = true;
    const newConditions = [...conditions];
    newConditions[index].attribute = newValue;
    setConditions(newConditions);
  };

  const handleOperatorChange = (index: number, newValue: string) => {
    userModified.current = true;
    const newConditions = [...conditions];
    newConditions[index].operator = newValue;
    setConditions(newConditions);
  };

  const handleValueChange = (index: number, newValue: string) => {
    userModified.current = true;
    const newConditions = [...conditions];
    newConditions[index].value = newValue;
    setConditions(newConditions);
  };

  const addCondition = () => {
    userModified.current = true;
    setConditions([...conditions, { ...DEFAULT_CONDITION }]);
  };

  const removeCondition = () => {
    userModified.current = true;
    if (conditions.length > 1) {
      setConditions(conditions.slice(0, -1));
    } else if (conditions.length === 1) {
      setConditions([]);
      setFiltersActive(false);
    }
  };

  const activateFilters = () => {
    userModified.current = true;
    setFiltersActive(true);
    setConditions([{ ...DEFAULT_CONDITION }]);
  };

  // Helper to determine if input should be a number with decimal places (prices)
  const isDecimalNumberInput = (attribute: string) => {
    return ['market', 'low', 'average', 'high', 'foil'].includes(attribute);
  };

  // Helper to get a placeholder based on attribute
  const getPlaceholder = (attribute: string) => {
    if (isDecimalNumberInput(attribute)) {
      return "0.00";
    }
    return "";
  };

  // Helper to configure input props based on attribute type
  const getInputProps = (attribute: string) => {
    if (isDecimalNumberInput(attribute)) {
      return {
        min: "0",
        step: "any" // Disables step arrows
      };
    }
    return {
      min: "0",
      step: "1"
    };
  };

  return (
    <>
      {!filtersActive ? (
        <Button
          variant="outlined"
          startIcon={<FilterListIcon />}
          onClick={activateFilters}
          fullWidth
          sx={{ mt: 1 }}
        >
          Add Stat Filters
        </Button>
      ) : (
        <Stack spacing={1.5}>
          {conditions.map((condition, index) => (
            <StatRow key={index}>
              <AttributeSelect
                size="small"
                value={condition.attribute}
                onChange={(e) => handleAttributeChange(index, e.target.value as string)}
              >
                {STAT_ATTRIBUTES.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </AttributeSelect>

              <OperatorSelect
                size="small"
                value={condition.operator}
                onChange={(e) => handleOperatorChange(index, e.target.value as string)}
              >
                {OPERATORS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </OperatorSelect>

              <ValueInput
                size="small"
                type="number"
                inputProps={getInputProps(condition.attribute)}
                placeholder={getPlaceholder(condition.attribute)}
                value={condition.value}
                onChange={(e) => handleValueChange(index, e.target.value as string)}
              />
            </StatRow>
          ))}

          <Actions>
            <InstructionText>Add or remove stat filters:</InstructionText>
            <IconButton size="small" onClick={removeCondition}>
              <RemoveIcon />
            </IconButton>
            <IconButton size="small" onClick={addCondition}>
              <AddIcon />
            </IconButton>
          </Actions>
        </Stack>
      )}
    </>
  );
};

const StatRow = styled('div')({
  display: 'flex',
  gap: '7px',
  width: '100%',
});

const AttributeSelect = styled(Select)({
  width: '45%',
  minWidth: '45%',
});

const OperatorSelect = styled(Select)({
  width: '25%',
  minWidth: '25%',
});

const ValueInput = styled(TextField)({
  width: '25%',
  minWidth: '25%',
});

const Actions = styled('div')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: '4px',
});

const InstructionText = styled('span')(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontStyle: 'italic',
  marginRight: 'auto',
  fontSize: '0.875rem',
}));

export default StatSearch;
