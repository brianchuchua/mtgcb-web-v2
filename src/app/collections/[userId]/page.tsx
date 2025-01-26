'use client';

import { Typography, Box } from '@mui/material';
import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function CollectionPage() {
  const params = useParams();
  const { user } = useAuth();
  const userId = params.userId as string;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Collection
      </Typography>
      <Typography gutterBottom>
        Collection page placeholder for user ID: {userId}
      </Typography>
      {user?.userId === userId && (
        <Typography>
          This is your collection!
        </Typography>
      )}
    </Box>
  );
}