'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Collapse,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Info as InfoIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
} from '@mui/icons-material';
import { useSessionMessages } from '@/contexts/SessionMessagesContext';
import { Notice } from '@/components/ui/Notice';

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

const formatLocalTime = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(date);
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
  message: { id: string; severity: 'error' | 'warning' | 'info' | 'success'; title?: string; message: string; dismissable?: boolean; icon?: React.ReactNode; scheduledAt?: string; scheduleDisplay?: 'countdown' | 'localTime' };
  onDismiss: () => void;
}) => {
  const useLocalTime = message.scheduleDisplay === 'localTime';
  const { timeLeft, isPast } = useCountdown(useLocalTime ? undefined : message.scheduledAt);
  const localTime = useLocalTime && message.scheduledAt ? formatLocalTime(message.scheduledAt) : '';

  return (
    <Notice
      kind={message.severity}
      icon={message.icon || getDefaultIcon(message.severity)}
      title={message.title || undefined}
      onClose={message.dismissable ? onDismiss : undefined}
      sx={{ mb: 4 }}
    >
      <Box sx={{ mt: message.title ? 1 : 0 }}>
        {message.message}
        {message.scheduledAt && (
          <Box component="span" sx={{ fontWeight: 700, ml: 0.5, fontVariantNumeric: 'tabular-nums' }}>
            {useLocalTime
              ? `Maintenance starts at: ${localTime}`
              : isPast
                ? '(maintenance has begun)'
                : `Maintenance will start in: ${timeLeft}`}
          </Box>
        )}
      </Box>
    </Notice>
  );
};