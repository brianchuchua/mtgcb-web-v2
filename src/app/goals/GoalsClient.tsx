'use client';

import { useState } from 'react';
import { Box, Typography, Button, Alert, Paper } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import { useGetUserGoalsQuery } from '@/api/goals/goalsApi';
import { CreateGoalDialog } from '@/components/goals/CreateGoalDialog';
import { GoalsList } from '@/components/goals/GoalsList';

export function GoalsClient() {
  const { user, isAuthenticated } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data, isLoading, error } = useGetUserGoalsQuery(user?.userId ?? 0, {
    skip: !user?.userId,
  });

  const goals = data?.data?.goals || [];

  const handleCreateClick = () => {
    setCreateDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setCreateDialogOpen(false);
  };

  if (!isAuthenticated) {
    return (
      <Box p={3}>
        <Alert severity="info">
          Please log in to view and manage your collection goals.
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Collection Goals
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateClick}
        >
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
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreateClick}
          >
            Create Your First Goal
          </Button>
        </Paper>
      )}

      {goals.length > 0 && (
        <GoalsList goals={goals} userId={user?.userId || 0} />
      )}

      <CreateGoalDialog
        open={createDialogOpen}
        onClose={handleCloseDialog}
      />
    </Box>
  );
}