'use client';

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Public as PublicIcon,
  Link as LinkIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  Person as PersonIcon,
  Groups as GroupsIcon,
} from '@mui/icons-material';
import { useGetShareLinkQuery } from '@/api/user/shareLinkApi';

interface AccessSummaryProps {
  isPublic: boolean;
}

export const AccessSummary = ({ isPublic }: AccessSummaryProps) => {
  const theme = useTheme();
  const { data: shareLinkData } = useGetShareLinkQuery();
  
  const hasActiveShareLink = shareLinkData?.data?.hasShareLink && 
    (!shareLinkData.data.expiresAt || new Date(shareLinkData.data.expiresAt) > new Date());

  const getAccessLevel = () => {
    if (isPublic) {
      return {
        icon: <PublicIcon />,
        title: 'Public Collection',
        description: 'Visible at your public URL',
        color: theme.palette.info.main,
        bgColor: alpha(theme.palette.info.main, 0.1),
        chips: [
          { icon: <GroupsIcon fontSize="small" />, label: 'Anyone with URL', color: 'info' as const },
          { icon: <VisibilityIcon fontSize="small" />, label: 'No authentication required', color: 'default' as const },
        ],
      };
    } else if (hasActiveShareLink) {
      return {
        icon: <LinkIcon />,
        title: 'Private with Share Link',
        description: 'Only people with your share link can view',
        color: theme.palette.warning.main,
        bgColor: alpha(theme.palette.warning.main, 0.1),
        chips: [
          { icon: <PersonIcon fontSize="small" />, label: 'You', color: 'default' as const },
          { icon: <LinkIcon fontSize="small" />, label: 'Share link holders', color: 'warning' as const },
        ],
      };
    } else {
      return {
        icon: <LockIcon />,
        title: 'Private Collection',
        description: 'Only you can view your collection',
        color: theme.palette.success.main,
        bgColor: alpha(theme.palette.success.main, 0.1),
        chips: [
          { icon: <PersonIcon fontSize="small" />, label: 'Only you', color: 'success' as const },
        ],
      };
    }
  };

  const access = getAccessLevel();

  return (
    <Card 
      sx={{ 
        bgcolor: access.bgColor,
        borderLeft: `4px solid ${access.color}`,
      }}
    >
      <CardContent>
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: access.color,
                color: 'white',
              }}
            >
              {access.icon}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {access.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {access.description}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
              Who can access:
            </Typography>
            {access.chips.map((chip, index) => (
              <Chip
                key={index}
                icon={chip.icon}
                label={chip.label}
                size="small"
                color={chip.color}
                variant="outlined"
              />
            ))}
          </Box>

          {hasActiveShareLink && shareLinkData?.data?.expiresAt && (
            <Typography variant="caption" color="text.secondary">
              Share link expires: {new Date(shareLinkData.data.expiresAt).toLocaleDateString()}
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};