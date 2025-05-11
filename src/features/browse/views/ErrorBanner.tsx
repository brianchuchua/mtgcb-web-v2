'use client';

import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { Box, Typography, styled } from '@mui/material';
import React from 'react';

interface ErrorBannerProps {
  type: string;
}

const ErrorBanner: React.FC<ErrorBannerProps> = ({ type }) => {
  return (
    <ErrorContainer mb={3}>
      <ErrorIcon />
      <ErrorTitle variant="h6" gutterBottom fontWeight="bold" color="error.main">
        Unable to load {type}
      </ErrorTitle>
      <Typography color="text.primary">There was a problem with your request. Please try again later.</Typography>
    </ErrorContainer>
  );
};

const ErrorContainer = styled(Box)({
  textAlign: 'center',
  padding: 24,
  borderRadius: 4,
  border: '1px solid',
  borderColor: 'rgba(211, 47, 47, 0.3)',
  backgroundColor: 'rgba(211, 47, 47, 0.03)',
  maxWidth: '800px',
  margin: '0 auto',
  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
});

const ErrorIcon = styled(ErrorOutlineIcon)({
  fontSize: 40,
  color: 'error.main',
  marginBottom: 8,
});

const ErrorTitle = styled(Typography)({
  fontWeight: 'bold',
});

export default ErrorBanner;
