'use client';

import {
  Box,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  SelectChangeEvent,
  Skeleton,
  Typography,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useGetUserGoalsQuery } from '@/api/goals/goalsApi';
import { Goal } from '@/api/goals/types';
import { selectSelectedGoalId, setSelectedGoalId } from '@/redux/slices/browseSlice';

interface GoalSelectorProps {
  userId: number;
}

const GoalSelector = ({ userId }: GoalSelectorProps) => {
  const dispatch = useDispatch();
  const selectedGoalId = useSelector(selectSelectedGoalId);

  const { data: goalsResponse, isLoading, error } = useGetUserGoalsQuery(userId);
  const goals = goalsResponse?.data?.goals || [];

  // Filter to only show active goals
  const activeGoals = goals.filter((goal) => goal.isActive);

  const handleChange = (event: SelectChangeEvent<number | ''>) => {
    const value = event.target.value;
    dispatch(setSelectedGoalId(value === '' ? null : Number(value)));
  };

  if (isLoading) {
    return (
      <FormControl fullWidth margin="dense">
        <Skeleton variant="rectangular" height={40} />
      </FormControl>
    );
  }

  if (error || !goalsResponse?.success) {
    return null; // Silently fail if goals can't be loaded
  }

  if (activeGoals.length === 0) {
    return null; // Don't show selector if no active goals
  }

  return (
    <FormControl fullWidth margin="dense">
      <InputLabel id="goal-selector-label">View Collection Goal</InputLabel>
      <Select
        labelId="goal-selector-label"
        value={selectedGoalId || ''}
        onChange={handleChange}
        label="View Collection Goal"
        displayEmpty
        renderValue={(value) => {
          if (value === '' || value === null) {
            return 'Default (all cards)';
          }
          const selectedGoal = activeGoals.find(goal => goal.id === value);
          return selectedGoal?.name || 'Default (all cards)';
        }}
      >
        <MenuItem value="">
          <em>Default (all cards)</em>
        </MenuItem>
        {activeGoals.map((goal) => (
          <MenuItem key={goal.id} value={goal.id}>
            <Box sx={{ width: '100%' }}>
              <Typography variant="body2">{goal.name}</Typography>
              {goal.description && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {goal.description}
                </Typography>
              )}
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default GoalSelector;
