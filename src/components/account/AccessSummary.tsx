'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import {
  Public as PublicIcon,
  Link as LinkIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  Person as PersonIcon,
  Groups as GroupsIcon,
} from '@mui/icons-material';
import { useGetShareLinkQuery } from '@/api/user/shareLinkApi';
import { Notice } from '@/components/ui/Notice';
import { Tag } from '@/components/ui/Tag';

interface AccessSummaryProps {
  isPublic: boolean;
}

export const AccessSummary = ({ isPublic }: AccessSummaryProps) => {
  const { data: shareLinkData } = useGetShareLinkQuery();
  
  const hasActiveShareLink = shareLinkData?.data?.hasShareLink && 
    (!shareLinkData.data.expiresAt || new Date(shareLinkData.data.expiresAt) > new Date());

  const getAccessLevel = () => {
    if (isPublic) {
      return {
        icon: <PublicIcon />,
        title: 'Public Collection',
        description: 'Visible at your public URL',
        kind: 'info' as const,
        chips: [
          { icon: <GroupsIcon />, label: 'Anyone with URL', tone: 'blue' as const },
          { icon: <VisibilityIcon />, label: 'No authentication required', tone: 'neutral' as const },
        ],
      };
    } else if (hasActiveShareLink) {
      return {
        icon: <LinkIcon />,
        title: 'Private with Share Link',
        description: 'Only people with your share link can view',
        kind: 'warning' as const,
        chips: [
          { icon: <PersonIcon />, label: 'You', tone: 'neutral' as const },
          { icon: <LinkIcon />, label: 'Share link holders', tone: 'amber' as const },
        ],
      };
    } else {
      return {
        icon: <LockIcon />,
        title: 'Private Collection',
        description: 'Only you can view your collection',
        kind: 'success' as const,
        chips: [
          { icon: <PersonIcon />, label: 'Only you', tone: 'green' as const },
        ],
      };
    }
  };

  const access = getAccessLevel();

  return (
    <Notice kind={access.kind} icon={access.icon} title={access.title}>
      {access.description}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mt: 1 }}>
        <span>Who can access:</span>
        {access.chips.map((chip, index) => (
          <Tag key={index} tone={chip.tone} icon={chip.icon}>
            {chip.label}
          </Tag>
        ))}
      </Box>

      {hasActiveShareLink && shareLinkData?.data?.expiresAt && (
        <Typography variant="caption" component="div" color="text.secondary" sx={{ mt: 1 }}>
          Share link expires: {new Date(shareLinkData.data.expiresAt).toLocaleDateString()}
        </Typography>
      )}
    </Notice>
  );
};