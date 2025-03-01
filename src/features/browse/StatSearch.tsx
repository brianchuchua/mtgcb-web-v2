'use client';

import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { IconButton, MenuItem, Paper, Select, Stack, TextField } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectStats, setStats } from '@/redux/slices/browseSlice';
import { StatCondition, StatFilters } from '@/types/browse';

const STAT_ATTRIBUTES = [
  { label: 'Mana Value', value: 'convertedManaCost' },
  { label: 'Power', value: 'powerNumeric' },
  { label: 'Toughness', value: 'toughnessNumeric' },
  { label: 'Loyalty', value: 'loyaltyNumeric' },
];

const OPERATORS = [
  { label: '>=', value: 'gte' },
  { label: '>', value: 'gt' },
  { label: '<=', value: 'lte' },
  { label: '<', value: 'lt' },
  { label: '=', value: 'eq' },
  { label: '≠', value: 'not' },
];

const parseReduxStats = (reduxStats: StatFilters | undefined): StatCondition[] => {
  if (!reduxStats) return [{ attribute: 'convertedManaCost', operator: 'gte', value: '' }];

  return Object.entries(reduxStats)
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
};

const StatSearch = () => {
  const dispatch = useDispatch();
  const reduxStats = useSelector(selectStats);
  const userModified = useRef(false);
  const [conditions, setConditions] = useState<StatCondition[]>(() => parseReduxStats(reduxStats));

  // Sync with Redux state when it changes from URL
  useEffect(() => {
    if (!userModified.current) {
      setConditions(parseReduxStats(reduxStats));
    }
  }, [reduxStats]);

  // Update Redux when local state changes
  useEffect(() => {
    if (!userModified.current) return;

    const statFilters: StatFilters = {};

    conditions.forEach(({ attribute, operator, value }) => {
      if (!value) return;

      if (!statFilters[attribute]) {
        statFilters[attribute] = [];
      }
      statFilters[attribute].push(`${operator}${value}`);
    });

    dispatch(setStats(statFilters));
  }, [conditions, dispatch]);

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
    setConditions([...conditions, { attribute: 'convertedManaCost', operator: 'gte', value: '' }]);
  };

  const removeCondition = () => {
    userModified.current = true;
    if (conditions.length > 1) {
      setConditions(conditions.slice(0, -1));
    }
  };

  return (
    <>
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
              value={condition.value}
              onChange={(e) => handleValueChange(index, e.target.value as string)}
              placeholder="0"
            />
          </StatRow>
        ))}

        <Actions>
          <InstructionText>Add or remove stat filters:</InstructionText>
          <IconButton size="small" onClick={removeCondition} disabled={conditions.length === 1}>
            <RemoveIcon />
          </IconButton>
          <IconButton size="small" onClick={addCondition}>
            <AddIcon />
          </IconButton>
        </Actions>
      </Stack>
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
