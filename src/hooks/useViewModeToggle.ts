import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useGetGoalQuery } from '@/api/goals/goalsApi';
import { setViewContentType, setOneResultPerCardName, selectSelectedGoalId } from '@/redux/slices/browse';
import { useAuth } from '@/hooks/useAuth';

export const useViewModeToggle = () => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const userId = user?.userId;
  const selectedGoalId = useSelector(selectSelectedGoalId);
  
  // Only fetch the specific goal if we have a selectedGoalId
  const { data: goalResponse } = useGetGoalQuery(
    { userId: userId || 0, goalId: selectedGoalId || 0 },
    { skip: !userId || !selectedGoalId }
  );
  
  const selectedGoal = goalResponse?.data;

  const handleViewModeChange = useCallback((newMode: 'cards' | 'sets') => {
    dispatch(setViewContentType(newMode));
    
    // When switching to cards view, check if we need to set oneResultPerCardName based on selected goal
    if (newMode === 'cards' && selectedGoal?.onePrintingPerPureName) {
      dispatch(setOneResultPerCardName(true));
    }
  }, [dispatch, selectedGoal]);

  return { handleViewModeChange };
};