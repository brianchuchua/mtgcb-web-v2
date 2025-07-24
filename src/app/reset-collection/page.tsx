import { Suspense } from 'react';
import { CircularProgress, Box } from '@mui/material';
import { ResetCollectionClient } from './ResetCollectionClient';

export default function ResetCollectionPage() {
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