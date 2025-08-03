'use client';

import { Suspense } from 'react';
import { CircularProgress, Box } from '@mui/material';
import { ResetCollectionClient } from './ResetCollectionClient';
import { withAuth } from '@/components/auth/withAuth';

function ResetCollectionPage() {
  return (
    <Suspense
      fallback={
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      }
    >
      <ResetCollectionClient />
    </Suspense>
  );
}

export default withAuth(ResetCollectionPage);