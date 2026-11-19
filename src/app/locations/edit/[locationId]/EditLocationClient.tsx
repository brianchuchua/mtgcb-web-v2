'use client';

import { useEffect, useState } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import EditLocationForm from '@/components/locations/EditLocationForm';
import { Notice, noticeActionSx } from '@/components/ui/Notice';
import { useAuth } from '@/hooks/useAuth';
import { useGetLocationQuery } from '@/api/locations/locationsApi';

interface EditLocationClientProps {
  locationId: number;
}

export default function EditLocationClient({ locationId }: EditLocationClientProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const { data: locationResponse, isLoading, error } = useGetLocationQuery(locationId, {
    skip: !isAuthenticated || !locationId || isDeleting,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/locations');
    }
  }, [isAuthenticated, router]);

  if (isLoading || isDeleting) {
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
        <Notice
          kind="note"
          icon={<LockOutlinedIcon />}
          action={
            <Button component={NextLink} href="/login" size="small" color="primary" sx={noticeActionSx}>
              Log in
            </Button>
          }
        >
          Log in to edit this location.
        </Notice>
      </Container>
    );
  }

  if (error || !locationResponse?.data) {
    return (
      <Container>
        <Typography variant="h4" component="h1" gutterBottom>
          Edit Location
        </Typography>
        <Notice kind="error">Location not found or you don't have permission to edit it.</Notice>
      </Container>
    );
  }

  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        Edit Location
      </Typography>
      <EditLocationForm
        location={locationResponse.data}
        onDeleteStart={() => setIsDeleting(true)}
      />
    </Container>
  );
}