'use client';

import { Typography, Box } from '@mui/material';
import { useAuth } from '@/hooks/useAuth';

export default function EditCardsPage() {
  const { user } = useAuth();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Edit Cards
      </Typography>
      <Typography>
        Edit cards page placeholder for user: {user?.username}
      </Typography>
    </Box>
  );
}