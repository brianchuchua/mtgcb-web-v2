'use client';

import { Info as InfoIcon, Link as LinkIcon, Person as PersonIcon } from '@mui/icons-material';
import { Box, Collapse } from '@mui/material';
import React from 'react';
import { Notice } from '@/components/ui/Notice';
import { Tag } from '@/components/ui/Tag';
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
      <Notice
        kind="info"
        icon={<LinkIcon />}
        title="Viewing Shared Collection"
        onClose={() => setDismissed(true)}
        sx={{ mb: 2 }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
          <div>You are viewing {username}'s collection through a private share link.</div>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <Tag tone="neutral" icon={<PersonIcon />}>{`Owner: ${username}`}</Tag>
            <Tag tone="blue" icon={<InfoIcon />}>
              Read-only access
            </Tag>
          </Box>
        </Box>
      </Notice>
    </Collapse>
  );
};
