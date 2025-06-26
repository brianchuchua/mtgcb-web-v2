'use client';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Box, CircularProgress, IconButton, Paper, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Goal } from '@/api/goals/types';
import { CreateGoalForm } from '@/components/goals/CreateGoalForm';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { useAuth } from '@/hooks/useAuth';

export function CreateGoalClient() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  const handleClose = () => {
    router.push('/goals');
  };

  const handleSuccess = (goal: Goal) => {
    if (user?.userId) {
      router.push(`/collections/${user.userId}?contentType=cards&goalId=${goal.id}&oneResultPerCardName=${goal.onePrintingPerPureName ? 'true' : 'false'}`);
    } else {
      router.push('/goals');
    }
  };

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      setShouldRedirect(true);
    }
  }, [isAuthLoading, isAuthenticated]);

  useEffect(() => {
    if (shouldRedirect) {
      router.push('/login?returnUrl=/goals/create');
    }
  }, [shouldRedirect, router]);

  if (isAuthLoading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated || shouldRedirect) {
    return null;
  }

  return (
    <Box>
      <Breadcrumbs
        items={[{ label: 'Home', href: '/' }, { label: 'Goals', href: '/goals' }, { label: 'Create Goal' }]}
      />

      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={handleClose} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1" color="primary">
          Create Goal
        </Typography>
      </Box>

      <Box sx={{ maxWidth: 'md', mx: 'auto' }}>
        <Paper
          variant="outlined"
          sx={{
            p: 2,
          }}
        >
          <CreateGoalForm onClose={handleClose} onSuccess={handleSuccess} />
        </Paper>
      </Box>
    </Box>
  );
}
