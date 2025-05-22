'use client';

import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
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
import React, { useCallback, useState } from 'react';
import SetIcon from '@/components/sets/SetIcon';
import capitalize from '@/utils/capitalize';
import { formatISODate } from '@/utils/dateUtils';

interface SubsetDropdownProps {
  subsets: any[];
  onSubsetSelect: (subsetId: string) => void;
}

const SubsetDropdown: React.FC<SubsetDropdownProps> = ({ subsets, onSubsetSelect }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const theme = useTheme();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));

  const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleSubsetClick = useCallback(
    (subsetId: string) => {
      onSubsetSelect(subsetId);
      handleClose();
    },
    [onSubsetSelect, handleClose],
  );

  const formatSetCategoryAndType = (set: any) => {
    const category = set.category ? capitalize(set.category) : null;
    const type = set.setType ? capitalize(set.setType) : null;

    if (category && type) return `${category} Set - ${type}`;
    if (category) return `${category} Set`;
    if (type) return type;
    return 'Special Set';
  };

  if (!subsets.length) {
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
          Subsets
        </Button>
      ) : (
        <Tooltip title="Jump to subset">
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
            Jump to Subset
          </Typography>
        </Box>

        {subsets.map((subset) => (
          <MenuItem
            key={subset.id}
            onClick={() => handleSubsetClick(subset.id)}
            sx={{
              py: 1.5,
              px: 2,
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              {subset.code && <SetIcon code={subset.code} size="lg" fixedWidth />}
            </ListItemIcon>
            <ListItemText
              primary={subset.name}
              secondary={
                <>
                  <Typography variant="body2" color="text.secondary" noWrap component="span">
                    {formatSetCategoryAndType(subset)}
                  </Typography>
                  <br />
                  <Typography variant="caption" color="text.secondary" noWrap component="span">
                    {subset.releasedAt && formatISODate(subset.releasedAt)} •{' '}
                    {subset.cardCount ? `${subset.cardCount} cards` : 'N/A'}
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
        ))}
      </Menu>
    </Box>
  );
};

export default SubsetDropdown;
