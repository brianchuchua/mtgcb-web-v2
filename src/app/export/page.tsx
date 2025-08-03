'use client';

import { Suspense } from 'react';
import { CircularProgress, Box } from '@mui/material';
import { ExportClient } from './ExportClient';
import { withAuth } from '@/components/auth/withAuth';

function ExportPage() {
  return (
    <Suspense
      fallback={
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      }
    >
      <ExportClient />
    </Suspense>
  );
}

export default withAuth(ExportPage);