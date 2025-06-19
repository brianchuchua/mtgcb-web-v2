'use client';

import { Add as AddIcon } from '@mui/icons-material';
import { Alert, Box, Button, Paper, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useGetUserGoalsQuery } from '@/api/goals/goalsApi';
import { GoalsList } from '@/components/goals/GoalsList';
import { useAuth } from '@/hooks/useAuth';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { PriceType } from '@/types/pricing';

export function GoalsClient() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [displayPriceType] = useLocalStorage<PriceType>('displayPriceType', PriceType.Market);

  const { data, isLoading, error } = useGetUserGoalsQuery(
    {
      userId: user?.userId ?? 0,
      includeProgress: true,
      priceType: displayPriceType.toLowerCase(),
    },
    {
      skip: !user?.userId,
    },
  );

  const goals = data?.data?.goals || [];

  const handleCreateClick = () => {
    router.push('/goals/create');
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
    <Box p={0}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" color="primary">
          Goals
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

      {goals.length > 0 && <GoalsList goals={goals} userId={user?.userId || 0} />}
    </Box>
  );
}
