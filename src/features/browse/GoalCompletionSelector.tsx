'use client';

import { ToggleButton, ToggleButtonGroup, styled } from '@mui/material';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectSelectedGoalId, selectShowGoals, setShowGoals } from '@/redux/slices/browseSlice';
import OutlinedBox from '@/components/ui/OutlinedBox';

const StyledToggleButton = styled(ToggleButton)(({ theme }) => ({
  flex: 1,
  fontSize: '0.875rem',
}));

type ShowGoalsOption = 'all' | 'complete' | 'incomplete';

const SHOW_GOALS_OPTIONS: { value: ShowGoalsOption; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'incomplete', label: 'Missing' },
  { value: 'complete', label: 'Done' },
];

const GoalCompletionSelector: React.FC = () => {
  const dispatch = useDispatch();
  const showGoals = useSelector(selectShowGoals);
  const selectedGoalId = useSelector(selectSelectedGoalId);

  const handleChange = (_: React.MouseEvent<HTMLElement>, value: ShowGoalsOption | null) => {
    if (value) {
      dispatch(setShowGoals(value));
    }
  };

  // Only show when a goal is selected
  if (!selectedGoalId) {
    return null;
  }

  return (
    <OutlinedBox label="Goal Completion Status">
      <ToggleButtonGroup value={showGoals} exclusive onChange={handleChange} fullWidth size="small">
        {SHOW_GOALS_OPTIONS.map((option) => (
          <StyledToggleButton key={option.value} value={option.value}>
            {option.label}
          </StyledToggleButton>
        ))}
      </ToggleButtonGroup>
    </OutlinedBox>
  );
};

export default GoalCompletionSelector;
