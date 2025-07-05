import { Suspense } from 'react';
import EditLocationClient from './EditLocationClient';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';

interface EditLocationPageProps {
  params: {
    locationId: string;
  };
}

export default function EditLocationPage({ params }: EditLocationPageProps) {
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
      <EditLocationClient locationId={parseInt(params.locationId, 10)} />
    </Suspense>
  );
}