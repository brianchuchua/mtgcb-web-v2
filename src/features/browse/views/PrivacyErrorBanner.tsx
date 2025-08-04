'use client';

import LockIcon from '@mui/icons-material/Lock';
import { Box, Typography, styled } from '@mui/material';
import React from 'react';

interface PrivacyErrorBannerProps {
  username?: string;
}

const PrivacyErrorBanner: React.FC<PrivacyErrorBannerProps> = ({ username }) => {
  return (
    <ErrorContainer mb={3}>
      <LockIconStyled />
      <ErrorTitle variant="h6" gutterBottom fontWeight="bold">
        Collection is Private
      </ErrorTitle>
      <Typography color="text.primary">
        {username ? `${username}'s` : "This user's"} collection is private and cannot be viewed.
      </Typography>
      <Typography color="text.secondary" mt={2}>
        If you're the user, just log in.
      </Typography>
      <Typography color="text.secondary" mt={1}>
        If you know the user, ask them to set their collection to public.
      </Typography>
    </ErrorContainer>
  );
};

const ErrorContainer = styled(Box)({
  textAlign: 'center',
  padding: 24,
  borderRadius: 4,
  border: '1px solid',
  borderColor: 'rgba(156, 163, 175, 0.3)',
  backgroundColor: 'rgba(156, 163, 175, 0.03)',
  maxWidth: '800px',
  margin: '0 auto',
  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
});

const LockIconStyled = styled(LockIcon)(({ theme }) => ({
  fontSize: 40,
  color: theme.palette.text.secondary,
  marginBottom: 8,
}));

const ErrorTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 'bold',
  color: theme.palette.text.primary,
}));

export default PrivacyErrorBanner;
