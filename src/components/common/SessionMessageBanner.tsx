'use client';

import React, { useEffect, useState } from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  IconButton,
  Collapse,
  Typography,
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

const useCountdown = (targetDate: string | undefined) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isPast, setIsPast] = useState(false);

  useEffect(() => {
    if (!targetDate) return;

    const update = () => {
      const now = Date.now();
      const target = new Date(targetDate).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setIsPast(true);
        setTimeLeft('');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      const parts: string[] = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0) parts.push(`${hours}h`);
      if (minutes > 0) parts.push(`${minutes}m`);
      parts.push(`${seconds}s`);

      setTimeLeft(parts.join(' '));
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return { timeLeft, isPast };
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
      <SessionBannerAlert
        message={activeMessage}
        onDismiss={() => dismissBanner(activeMessage.id)}
      />
    </Collapse>
  );
};

const SessionBannerAlert = ({
  message,
  onDismiss,
}: {
  message: { id: string; severity: 'error' | 'warning' | 'info' | 'success'; title?: string; message: string; dismissable?: boolean; icon?: React.ReactNode; scheduledAt?: string };
  onDismiss: () => void;
}) => {
  const { timeLeft, isPast } = useCountdown(message.scheduledAt);

  return (
    <Alert
      severity={message.severity}
      icon={message.icon || getDefaultIcon(message.severity)}
      action={
        message.dismissable && (
          <IconButton
            aria-label="close"
            color="inherit"
            size="small"
            onClick={onDismiss}
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
      {message.title && (
        <AlertTitle sx={{ fontWeight: 600 }}>
          {message.title}
        </AlertTitle>
      )}
      <Box sx={{ mt: message.title ? 1 : 0 }}>
        {message.message}
        {message.scheduledAt && (
          <Typography component="span" sx={{ fontWeight: 700, ml: 0.5, fontVariantNumeric: 'tabular-nums' }}>
            {isPast ? '(maintenance has begun)' : `Maintenance will start in: ${timeLeft}`}
          </Typography>
        )}
      </Box>
    </Alert>
  );
};