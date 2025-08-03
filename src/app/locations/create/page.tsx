'use client';

import { Suspense } from 'react';
import CreateLocationClient from './CreateLocationClient';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import { withAuth } from '@/components/auth/withAuth';

function CreateLocationPage() {
  return (
    <Suspense 
      fallback={
        <Container>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        </Container>
      }
    >
      <CreateLocationClient />
    </Suspense>
  );
}

export default withAuth(CreateLocationPage);