'use client';

import { useEffect } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CreateLocationForm from '@/components/locations/CreateLocationForm';
import { Notice, noticeActionSx } from '@/components/ui/Notice';
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
        <Notice
          kind="note"
          icon={<LockOutlinedIcon />}
          action={
            <Button component={NextLink} href="/login" size="small" color="primary" sx={noticeActionSx}>
              Log in
            </Button>
          }
        >
          Log in to create a location.
        </Notice>
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