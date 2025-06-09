'use client';

import {
  Box,
  FormControl,
  InputLabel,
  LinearProgress,
  Link,
  MenuItem,
  Select,
  SelectChangeEvent,
  Skeleton,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { useGetUserGoalsQuery } from '@/api/goals/goalsApi';
import { Goal } from '@/api/goals/types';
import { selectSelectedGoalId, setSelectedGoalId } from '@/redux/slices/browseSlice';

interface GoalSelectorProps {
  userId: number;
}

const GoalSelector = ({ userId }: GoalSelectorProps) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const selectedGoalId = useSelector(selectSelectedGoalId);

  const { data: goalsResponse, isLoading, error } = useGetUserGoalsQuery(userId);
  const goals = goalsResponse?.data?.goals || [];

  // Filter to only show active goals
  const activeGoals = goals.filter((goal) => goal.isActive);

  const handleChange = (event: SelectChangeEvent<number | ''>) => {
    const value = event.target.value;
    dispatch(setSelectedGoalId(value === '' ? null : Number(value)));
  };

  const handleEditClick = (goalId: number) => {
    // Navigate to goals page with the goal ID as a query parameter
    router.push(`/goals?edit=${goalId}`);
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
      <InputLabel id="goal-selector-label" shrink>Collection Goal</InputLabel>
      <Select
        labelId="goal-selector-label"
        value={selectedGoalId || ''}
        onChange={handleChange}
        label="Collection Goal"
        displayEmpty
        renderValue={(value: number | '') => {
          if (!value) {
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
          <MenuItem key={goal.id} value={goal.id} sx={{ p: 0 }}>
            <Box sx={{ width: '100%', display: 'flex', alignItems: 'center' }}>
              <Box sx={{ flex: 1, minWidth: 0, p: 1.5, pr: 0.5 }}>
                <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {goal.name}
                </Typography>
                {goal.description && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {goal.description}
                  </Typography>
                )}
              </Box>
              <Box sx={{ px: 1.5, py: 1.5 }}>
                <Link
                  component="button"
                  variant="caption"
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleEditClick(goal.id);
                  }}
                  onMouseDown={(e: React.MouseEvent) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  sx={{
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Edit
                </Link>
              </Box>
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default GoalSelector;
