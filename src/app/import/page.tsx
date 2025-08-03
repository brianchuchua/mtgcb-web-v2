'use client';

import { Suspense } from 'react';
import { CircularProgress, Box } from '@mui/material';
import { ImportClient } from './ImportClient';
import { withAuth } from '@/components/auth/withAuth';

function ImportPage() {
  return (
    <Suspense
      fallback={
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      }
    >
      <ImportClient />
    </Suspense>
  );
}

export default withAuth(ImportPage);