import { Suspense } from 'react';
import { CircularProgress, Box } from '@mui/material';
import { GoalsClient } from './GoalsClient';

export default function GoalsPage() {
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