'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Alert from '@mui/material/Alert';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CreateLocationForm from '@/components/locations/CreateLocationForm';
import { useAuth } from '@/hooks/useAuth';

export default function CreateLocationClient() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/locations');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return (
      <Container>
        <Typography variant="h4" component="h1" gutterBottom>
          Create Location
        </Typography>
        <Alert severity="info">Please log in to create locations.</Alert>
      </Container>
    );
  }

  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        Create Location
      </Typography>
      <CreateLocationForm />
    </Container>
  );
}