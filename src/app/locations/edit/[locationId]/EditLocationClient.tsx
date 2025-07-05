'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import EditLocationForm from '@/components/locations/EditLocationForm';
import { useAuth } from '@/hooks/useAuth';
import { useGetLocationQuery } from '@/api/locations/locationsApi';

interface EditLocationClientProps {
  locationId: number;
}

export default function EditLocationClient({ locationId }: EditLocationClientProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { data: locationResponse, isLoading, error } = useGetLocationQuery(locationId, {
    skip: !isAuthenticated || !locationId,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/locations');
    }
  }, [isAuthenticated, router]);

  if (isLoading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!isAuthenticated) {
    return (
      <Container>
        <Typography variant="h4" component="h1" gutterBottom>
          Edit Location
        </Typography>
        <Alert severity="info">Please log in to edit locations.</Alert>
      </Container>
    );
  }

  if (error || !locationResponse?.data) {
    return (
      <Container>
        <Typography variant="h4" component="h1" gutterBottom>
          Edit Location
        </Typography>
        <Alert severity="error">Location not found or you don't have permission to edit it.</Alert>
      </Container>
    );
  }

  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        Edit Location
      </Typography>
      <EditLocationForm location={locationResponse.data} />
    </Container>
  );
}