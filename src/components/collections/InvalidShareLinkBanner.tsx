'use client';

import { ErrorOutline as ErrorIcon, Home as HomeIcon } from '@mui/icons-material';
import { Box, Button } from '@mui/material';
import { useRouter } from 'next/navigation';
import React from 'react';
import { Notice } from '@/components/ui/Notice';

interface InvalidShareLinkBannerProps {
  username?: string;
  errorType?: 'invalid' | 'expired' | 'revoked';
}

export const InvalidShareLinkBanner = ({ username, errorType = 'invalid' }: InvalidShareLinkBannerProps) => {
  const router = useRouter();

  const getErrorMessage = () => {
    switch (errorType) {
      case 'expired':
        return {
          title: 'Share Link Expired',
          message: `This share link has expired. Please request a new link from ${username || 'the collection owner'}.`,
        };
      case 'revoked':
        return {
          title: 'Share Link Revoked',
          message: `This share link has been revoked by ${username || 'the collection owner'}. Please request a new link if you need access.`,
        };
      case 'invalid':
      default:
        return {
          title: 'Invalid Share Link',
          message: `This share link is invalid or has been replaced. Please verify you have the correct link or request a new one from ${username || 'the collection owner'}.`,
        };
    }
  };

  const { title, message } = getErrorMessage();

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 3 }}>
      <Notice kind="error" icon={<ErrorIcon />} title={title}>
        <Box sx={{ mt: 1 }}>{message}</Box>
        <Box sx={{ mt: 1 }}>
          Share links provide controlled access to private collections. The owner can regenerate or revoke these links
          at any time.
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<HomeIcon />}
          onClick={() => router.push('/')}
          sx={{ mt: 2 }}
        >
          Go to Home
        </Button>
      </Notice>
    </Box>
  );
};
