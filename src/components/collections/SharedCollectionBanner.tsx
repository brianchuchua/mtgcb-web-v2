'use client';

import { Close as CloseIcon, Info as InfoIcon, Link as LinkIcon, Person as PersonIcon } from '@mui/icons-material';
import { Alert, AlertTitle, Box, Chip, Collapse, IconButton, Typography } from '@mui/material';
import React from 'react';
import { useShareTokenContext } from '@/contexts/ShareTokenContext';
import { useAuth } from '@/hooks/useAuth';

interface SharedCollectionBannerProps {
  username: string;
  userId: string | number;
}

export const SharedCollectionBanner = ({ username, userId }: SharedCollectionBannerProps) => {
  const { isViewingSharedCollection, clearShareToken } = useShareTokenContext();
  const [dismissed, setDismissed] = React.useState(false);
  const { user } = useAuth();

  // Don't show banner if viewing own collection while logged in
  const isOwnCollection = user?.userId === Number(userId);

  if (!isViewingSharedCollection(userId) || dismissed || isOwnCollection) {
    return null;
  }

  return (
    <Collapse in={!dismissed}>
      <Alert
        severity="info"
        icon={<LinkIcon />}
        action={
          <IconButton aria-label="close" color="inherit" size="small" onClick={() => setDismissed(true)}>
            <CloseIcon fontSize="inherit" />
          </IconButton>
        }
        sx={{
          mb: 2,
          borderRadius: 2,
          '& .MuiAlert-icon': {
            fontSize: 28,
          },
        }}
      >
        <AlertTitle sx={{ fontWeight: 600 }}>Viewing Shared Collection</AlertTitle>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
          <Typography variant="body2">You are viewing {username}'s collection through a private share link.</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <Chip icon={<PersonIcon />} label={`Owner: ${username}`} size="small" variant="outlined" />
            <Chip icon={<InfoIcon />} label="Read-only access" size="small" variant="outlined" color="info" />
          </Box>
        </Box>
      </Alert>
    </Collapse>
  );
};
