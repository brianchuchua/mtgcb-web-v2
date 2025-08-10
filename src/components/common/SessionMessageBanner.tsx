'use client';

import React from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  Close as CloseIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
} from '@mui/icons-material';
import { useSessionMessages } from '@/contexts/SessionMessagesContext';

const getDefaultIcon = (severity: string) => {
  switch (severity) {
    case 'warning':
      return <WarningIcon />;
    case 'error':
      return <ErrorIcon />;
    case 'success':
      return <SuccessIcon />;
    case 'info':
    default:
      return <InfoIcon />;
  }
};

export const SessionMessageBanner = () => {
  const { messages, dismissBanner, isBannerDismissed, isLoaded } = useSessionMessages();

  // Don't show anything until we've loaded the dismissed state
  if (!isLoaded) {
    return null;
  }

  // Get the first non-dismissed banner message
  const activeMessage = messages.find(
    msg => !isBannerDismissed(msg.id) && (!msg.displayType || msg.displayType === 'banner' || msg.displayType === 'both')
  );

  if (!activeMessage) {
    return null;
  }

  return (
    <Collapse in={true}>
      <Alert
        severity={activeMessage.severity}
        icon={activeMessage.icon || getDefaultIcon(activeMessage.severity)}
        action={
          activeMessage.dismissable && (
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => dismissBanner(activeMessage.id)}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          )
        }
        sx={{
          mb: 2,
          borderRadius: 2,
          '& .MuiAlert-icon': {
            fontSize: 28,
          }
        }}
      >
        {activeMessage.title && (
          <AlertTitle sx={{ fontWeight: 600 }}>
            {activeMessage.title}
          </AlertTitle>
        )}
        <Box sx={{ mt: activeMessage.title ? 1 : 0 }}>
          {activeMessage.message}
        </Box>
      </Alert>
    </Collapse>
  );
};