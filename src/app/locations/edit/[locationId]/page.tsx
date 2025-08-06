'use client';

import { Suspense, use } from 'react';
import EditLocationClient from './EditLocationClient';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import { withAuth } from '@/components/auth/withAuth';

interface EditLocationPageProps {
  params: Promise<{
    locationId: string;
  }>;
}

function EditLocationPage({ params }: EditLocationPageProps) {
  const unwrappedParams = use(params);
  
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
      <EditLocationClient locationId={parseInt(unwrappedParams.locationId, 10)} />
    </Suspense>
  );
}

export default withAuth(EditLocationPage);