import { Suspense } from 'react';
import { CircularProgress, Box } from '@mui/material';
import { ImportClient } from './ImportClient';

export default function ImportPage() {
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