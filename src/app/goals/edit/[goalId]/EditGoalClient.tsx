'use client';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Alert, Box, CircularProgress, IconButton, Paper, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useGetUserGoalsQuery } from '@/api/goals/goalsApi';
import { Goal } from '@/api/goals/types';
import { EditGoalForm } from '@/components/goals/EditGoalForm';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { useAuth } from '@/hooks/useAuth';

interface EditGoalClientProps {
  goalId: number;
}

export function EditGoalClient({ goalId }: EditGoalClientProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  const { data, isLoading, error } = useGetUserGoalsQuery(
    {
      userId: user?.userId || 0,
      includeProgress: false,
    },
    {
      skip: !user?.userId,
    },
  );

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      setShouldRedirect(true);
    }
  }, [isAuthLoading, isAuthenticated]);

  useEffect(() => {
    if (shouldRedirect) {
      router.push('/login?returnUrl=/goals/edit/' + goalId);
    }
  }, [shouldRedirect, router, goalId]);

  useEffect(() => {
    if (data?.data?.goals) {
      const foundGoal = data.data.goals.find((g) => g.id === goalId);
      if (foundGoal) {
        setGoal(foundGoal);
      } else {
        // Goal not found, redirect to goals page
        router.push('/goals');
      }
    }
  }, [data, goalId, router]);

  const handleClose = () => {
    router.push('/goals');
  };

  const handleSuccess = () => {
    router.push('/goals');
  };

  if (isAuthLoading || isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated || shouldRedirect) {
    return null;
  }

  if (error) {
    return (
      <Box>
        <Breadcrumbs
          items={[{ label: 'Home', href: '/' }, { label: 'Goals', href: '/goals' }, { label: 'Edit Goal' }]}
        />
        <Box sx={{ maxWidth: 'md', mx: 'auto' }}>
          <Alert severity="error">Failed to load goal. Please try again later.</Alert>
        </Box>
      </Box>
    );
  }

  if (!goal) {
    return null; // Will redirect in useEffect
  }

  return (
    <Box>
      <Breadcrumbs
        items={[{ label: 'Home', href: '/' }, { label: 'Goals', href: '/goals' }, { label: goal.name || 'Edit Goal' }]}
      />

      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={handleClose} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1" color="primary">
          Edit Collection Goal
        </Typography>
      </Box>

      <Box sx={{ maxWidth: 'md', mx: 'auto' }}>
        <Paper
          variant="outlined"
          sx={{
            p: 2,
          }}
        >
          <EditGoalForm goal={goal} userId={user?.userId || 0} onClose={handleClose} onSuccess={handleSuccess} />
        </Paper>
      </Box>
    </Box>
  );
}
