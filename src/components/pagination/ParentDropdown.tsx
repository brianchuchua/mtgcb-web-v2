'use client';

import AccountTreeIcon from '@mui/icons-material/AccountTree';
import {
  Box,
  Button,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import React, { useCallback, useState } from 'react';
import SetIcon from '@/components/sets/SetIcon';
import capitalize from '@/utils/capitalize';
import { formatISODate } from '@/utils/dateUtils';

interface ParentDropdownProps {
  parentSet: any;
  currentPath: string;
  userId?: string;
  goalId?: string;
}

const ParentDropdown: React.FC<ParentDropdownProps> = ({ parentSet, currentPath, userId, goalId }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const theme = useTheme();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));
  const router = useRouter();

  const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleParentClick = useCallback(() => {
    let path = '';

    if (currentPath.includes('/collections/')) {
      path = `/collections/${userId}/${parentSet.slug}`;
      if (goalId) {
        path += `?goalId=${goalId}`;
      }
    } else {
      path = `/browse/sets/${parentSet.slug}`;
    }

    router.push(path);
    handleClose();
  }, [currentPath, userId, goalId, parentSet.slug, router, handleClose]);

  const formatSetCategoryAndType = (set: any) => {
    const category = set.category ? capitalize(set.category) : null;
    const type = set.setType ? capitalize(set.setType) : null;

    if (category && type) return `${category} Set - ${type}`;
    if (category) return `${category} Set`;
    if (type) return type;
    return 'Special Set';
  };

  if (!parentSet) {
    return null;
  }

  return (
    <Box sx={{ ml: 0.5 }}>
      {isLargeScreen ? (
        <Button
          size="small"
          variant="outlined"
          onClick={handleClick}
          startIcon={<AccountTreeIcon fontSize="small" />}
          sx={{
            textTransform: 'none',
            minWidth: 'auto',
            px: 1.5,
            py: 0.5,
            height: 40,
            color: 'white',
            borderColor: 'rgba(255, 255, 255, 0.23)',
          }}
        >
          Parent
        </Button>
      ) : (
        <Tooltip title="Jump to parent">
          <IconButton
            size="small"
            onClick={handleClick}
            sx={{
              width: 32,
              height: 32,
            }}
          >
            <AccountTreeIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      <Menu
        elevation={0}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            maxHeight: 400,
            minWidth: 280,
            maxWidth: 400,
            backgroundColor: theme.palette.background.paper,
            boxShadow: `0 6px 16px 0 rgba(0, 0, 0, 0.12)`,
          },
        }}
      >
        <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle1" fontWeight="600" color="primary">
            Jump to Parent
          </Typography>
        </Box>

        <MenuItem
          onClick={handleParentClick}
          sx={{
            py: 1.5,
            px: 2,
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            {parentSet.code && <SetIcon code={parentSet.code} size="lg" fixedWidth />}
          </ListItemIcon>
          <ListItemText
            primary={parentSet.name}
            secondary={
              <>
                <Typography variant="body2" color="text.secondary" noWrap component="span">
                  {formatSetCategoryAndType(parentSet)}
                </Typography>
                <br />
                <Typography variant="caption" color="text.secondary" noWrap component="span">
                  {parentSet.releasedAt && formatISODate(parentSet.releasedAt)} •{' '}
                  {parentSet.cardCount ? `${parentSet.cardCount} cards` : 'N/A'}
                </Typography>
              </>
            }
            primaryTypographyProps={{
              variant: 'body1',
              fontWeight: 500,
              noWrap: true,
            }}
          />
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ParentDropdown;