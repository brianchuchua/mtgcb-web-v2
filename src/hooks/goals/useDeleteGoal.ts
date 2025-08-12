import { useSnackbar } from 'notistack';
import { useState } from 'react';
import { useDeleteGoalMutation } from '@/api/goals/goalsApi';
import { Goal } from '@/api/goals/types';

interface UseDeleteGoalOptions {
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export function useDeleteGoal(userId: number, options?: UseDeleteGoalOptions) {
  const { enqueueSnackbar } = useSnackbar();
  const [deleteGoal, { isLoading: isDeleting }] = useDeleteGoalMutation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);

  const handleDeleteClick = (goal: Goal) => {
    setGoalToDelete(goal);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!goalToDelete) return;

    try {
      await deleteGoal({ userId, goalId: goalToDelete.id }).unwrap();
      enqueueSnackbar('Goal deleted successfully', { variant: 'success' });
      options?.onSuccess?.();
    } catch (error) {
      enqueueSnackbar('Failed to delete goal', { variant: 'error' });
      options?.onError?.(error);
    } finally {
      setDeleteDialogOpen(false);
      setGoalToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setGoalToDelete(null);
  };

  return {
    isDeleting,
    deleteDialogOpen,
    goalToDelete,
    handleDeleteClick,
    handleConfirmDelete,
    handleCancelDelete,
  };
}