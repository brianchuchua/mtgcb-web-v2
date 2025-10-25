'use client';

import { ToggleButton, ToggleButtonGroup, styled } from '@mui/material';
import React, { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectStats, setStats, selectViewContentType, selectCompletionStatus, setCompletionStatus } from '@/redux/slices/browse';
import { StatFilters, CompletionStatusFilter } from '@/types/browse';
import OutlinedBox from '@/components/ui/OutlinedBox';

const StyledToggleButton = styled(ToggleButton)(({ theme }) => ({
  flex: 1,
  fontSize: '0.875rem',
}));

type OwnershipStatusOption = 'all' | 'owned' | 'missing';

const OWNERSHIP_STATUS_OPTIONS: { value: OwnershipStatusOption; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'owned', label: 'Owned' },
  { value: 'missing', label: 'Missing' },
];

const OwnershipStatusSelector: React.FC = () => {
  const dispatch = useDispatch();
  const viewContentType = useSelector(selectViewContentType);
  const statFilters = useSelector(selectStats);
  const completionStatus = useSelector(selectCompletionStatus);

  // Parse current state to determine selected value
  const selectedValue = useMemo((): OwnershipStatusOption => {
    if (viewContentType === 'cards') {
      // For cards: check quantityAll stat filter
      const quantityAllFilters = statFilters?.quantityAll || [];

      if (quantityAllFilters.length === 0) {
        return 'all';
      }

      // Check for "owned" filter (quantityAll >= 1)
      if (quantityAllFilters.includes('gte1')) {
        return 'owned';
      }

      // Check for "missing" filter (quantityAll = 0)
      if (quantityAllFilters.includes('eq0')) {
        return 'missing';
      }

      // If there's a custom filter we don't recognize, show as 'all'
      return 'all';
    } else {
      // For sets: check completionStatus filter
      if (!completionStatus || (completionStatus.include.length === 0 && completionStatus.exclude.length === 0)) {
        return 'all';
      }

      // Check for "owned" (complete or partial)
      const hasComplete = completionStatus.include.includes('complete');
      const hasPartial = completionStatus.include.includes('partial');
      const hasEmpty = completionStatus.include.includes('empty');

      if (hasComplete && hasPartial && !hasEmpty) {
        return 'owned';
      }

      // Check for "missing" (empty only)
      if (hasEmpty && !hasComplete && !hasPartial) {
        return 'missing';
      }

      // Otherwise show as 'all' (custom or mixed filter)
      return 'all';
    }
  }, [viewContentType, statFilters, completionStatus]);

  const handleChange = (_: React.MouseEvent<HTMLElement>, value: OwnershipStatusOption | null) => {
    if (!value) return;

    if (viewContentType === 'cards') {
      // For cards: update quantityAll stat filter
      const newStatFilters: StatFilters = { ...statFilters };

      if (value === 'all') {
        // Remove the quantityAll filter
        delete newStatFilters.quantityAll;
      } else if (value === 'owned') {
        // Set quantityAll >= 1
        newStatFilters.quantityAll = ['gte1'];
      } else if (value === 'missing') {
        // Set quantityAll = 0
        newStatFilters.quantityAll = ['eq0'];
      }

      dispatch(setStats(newStatFilters));
    } else {
      // For sets: update completionStatus filter
      let newCompletionStatus: CompletionStatusFilter;

      if (value === 'all') {
        // Clear the filter
        newCompletionStatus = { include: [], exclude: [] };
      } else if (value === 'owned') {
        // Include complete and partial (anything > 0%)
        newCompletionStatus = { include: ['complete', 'partial'], exclude: [] };
      } else if (value === 'missing') {
        // Include only empty (0%)
        newCompletionStatus = { include: ['empty'], exclude: [] };
      } else {
        newCompletionStatus = { include: [], exclude: [] };
      }

      dispatch(setCompletionStatus(newCompletionStatus));
    }
  };

  return (
    <OutlinedBox label="Ownership Status">
      <ToggleButtonGroup value={selectedValue} exclusive onChange={handleChange} fullWidth size="small">
        {OWNERSHIP_STATUS_OPTIONS.map((option) => (
          <StyledToggleButton key={option.value} value={option.value}>
            {option.label}
          </StyledToggleButton>
        ))}
      </ToggleButtonGroup>
    </OutlinedBox>
  );
};

export default OwnershipStatusSelector;
