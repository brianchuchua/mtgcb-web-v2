'use client';

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
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

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'warning':
      return 'warning.main';
    case 'error':
      return 'error.main';
    case 'success':
      return 'success.main';
    case 'info':
    default:
      return 'info.main';
  }
};

export const SessionMessageModal = () => {
  const { messages, dismissMessage, isDismissed, isLoaded } = useSessionMessages();
  const [open, setOpen] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<typeof messages[0] | null>(null);

  useEffect(() => {
    // Don't do anything until we've loaded the dismissed state
    if (!isLoaded) {
      return;
    }

    // Find the first non-dismissed modal message
    const modalMessage = messages.find(
      msg => !isDismissed(msg.id) && (msg.displayType === 'modal' || msg.displayType === 'both')
    );
    
    if (modalMessage) {
      setCurrentMessage(modalMessage);
      setOpen(true);
    }
  }, [messages, isDismissed, isLoaded]);

  const handleClose = () => {
    if (currentMessage) {
      dismissMessage(currentMessage.id);
    }
    setOpen(false);
    setCurrentMessage(null);
  };

  if (!currentMessage) {
    return null;
  }

  const icon = currentMessage.icon || getDefaultIcon(currentMessage.severity);

  return (
    <Dialog
      open={open}
      onClose={currentMessage.dismissable ? handleClose : undefined}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1.5,
        pb: 1,
      }}>
        <Box sx={{ 
          color: getSeverityColor(currentMessage.severity),
          display: 'flex',
          alignItems: 'center',
        }}>
          {icon}
        </Box>
        <Typography variant="h6" component="span" sx={{ flexGrow: 1 }}>
          {currentMessage.title}
        </Typography>
        {currentMessage.dismissable && (
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        )}
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body1">
          {currentMessage.message}
        </Typography>
      </DialogContent>
      {currentMessage.dismissable && (
        <DialogActions>
          <Button onClick={handleClose} variant="contained" color="primary">
            I Understand
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};