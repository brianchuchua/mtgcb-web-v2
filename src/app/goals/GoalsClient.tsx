'use client';

import { Add as AddIcon } from '@mui/icons-material';
import { Alert, Box, Button, Paper, Typography } from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useGetUserGoalsQuery } from '@/api/goals/goalsApi';
import { CreateGoalDialog } from '@/components/goals/CreateGoalDialog';
import { GoalsList } from '@/components/goals/GoalsList';
import { useAuth } from '@/hooks/useAuth';

export function GoalsClient() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [goalIdToEdit, setGoalIdToEdit] = useState<number | null>(null);

  const { data, isLoading, error } = useGetUserGoalsQuery(user?.userId ?? 0, {
    skip: !user?.userId,
  });

  const goals = data?.data?.goals || [];

  // Check for edit or create query parameters on mount
  useEffect(() => {
    const editParam = searchParams.get('edit');
    const createParam = searchParams.get('create');

    if (editParam) {
      const goalId = parseInt(editParam, 10);
      if (!isNaN(goalId) && goals.some((g) => g.id === goalId)) {
        setGoalIdToEdit(goalId);
        // Remove the edit parameter from URL immediately
        const params = new URLSearchParams(searchParams);
        params.delete('edit');
        router.replace(`/goals${params.toString() ? `?${params.toString()}` : ''}`);
      }
    }

    if (createParam === 'true') {
      setCreateDialogOpen(true);
      const params = new URLSearchParams(searchParams);
      params.delete('create');
      router.replace(`/goals${params.toString() ? `?${params.toString()}` : ''}`);
    }
  }, [searchParams, goals, router]);

  const handleCreateClick = () => {
    setCreateDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setCreateDialogOpen(false);
  };

  if (isAuthLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <Box p={3}>
        <Alert severity="info">Please log in to view and manage your collection goals.</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Collection Goals
        </Typography>
        <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleCreateClick}>
          Create Goal
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load goals. Please try again later.
        </Alert>
      )}

      {goals.length === 0 && !isLoading && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No goals yet
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Create your first collection goal to start tracking your progress.
          </Typography>
          <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleCreateClick}>
            Create Your First Goal
          </Button>
        </Paper>
      )}

      {goals.length > 0 && (
        <GoalsList
          goals={goals}
          userId={user?.userId || 0}
          initialEditGoalId={goalIdToEdit}
          onEditComplete={() => {
            setGoalIdToEdit(null);
          }}
        />
      )}

      <CreateGoalDialog open={createDialogOpen} onClose={handleCloseDialog} />
    </Box>
  );
}
