'use client';

import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Box, Typography, styled } from '@mui/material';
import React from 'react';

interface InfoBannerProps {
  title: string;
  message?: string;
  action?: React.ReactNode;
}

const InfoBanner: React.FC<InfoBannerProps> = ({ title, message, action }) => {
  return (
    <InfoContainer mb={3}>
      <InfoIcon />
      <InfoTitle variant="h6" gutterBottom fontWeight="bold" color="info.main">
        {title}
      </InfoTitle>
      {message && <Typography color="text.primary">{message}</Typography>}
      {action && <Box sx={{ mt: 2 }}>{action}</Box>}
    </InfoContainer>
  );
};

const InfoContainer = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  padding: 24,
  borderRadius: 4,
  border: '1px solid',
  borderColor: theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.3)' : 'rgba(33, 150, 243, 0.2)',
  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.08)' : 'rgba(33, 150, 243, 0.04)',
  maxWidth: '800px',
  margin: '0 auto',
  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
}));

const InfoIcon = styled(InfoOutlinedIcon)(({ theme }) => ({
  fontSize: 40,
  color: theme.palette.info.main,
  marginBottom: 8,
}));

const InfoTitle = styled(Typography)({
  fontWeight: 'bold',
});

export default InfoBanner;