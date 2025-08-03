'use client';

import { Suspense } from 'react';
import { CircularProgress, Box } from '@mui/material';
import { GoalsClient } from './GoalsClient';
import { withAuth } from '@/components/auth/withAuth';

function GoalsPage() {
  return (
    <Suspense
      fallback={
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      }
    >
      <GoalsClient />
    </Suspense>
  );
}

export default withAuth(GoalsPage);