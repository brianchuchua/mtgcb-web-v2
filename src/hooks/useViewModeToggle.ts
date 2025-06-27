import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useGetUserGoalsQuery } from '@/api/goals/goalsApi';
import { setViewContentType, setOneResultPerCardName, selectSelectedGoalId } from '@/redux/slices/browseSlice';
import { useAuth } from '@/hooks/useAuth';

export const useViewModeToggle = () => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const userId = user?.userId;
  const selectedGoalId = useSelector(selectSelectedGoalId);
  
  const { data: goalsResponse } = useGetUserGoalsQuery(
    { userId: userId || 0, includeProgress: false },
    { skip: !userId || !selectedGoalId }
  );
  
  const goals = goalsResponse?.data?.goals || [];

  const handleViewModeChange = useCallback((newMode: 'cards' | 'sets') => {
    dispatch(setViewContentType(newMode));
    
    // When switching to cards view, check if we need to set oneResultPerCardName based on selected goal
    if (newMode === 'cards' && selectedGoalId !== null && goals.length > 0) {
      const selectedGoal = goals.find(goal => goal.id === selectedGoalId);
      if (selectedGoal?.onePrintingPerPureName) {
        dispatch(setOneResultPerCardName(true));
      }
    }
  }, [dispatch, selectedGoalId, goals]);

  return { handleViewModeChange };
};