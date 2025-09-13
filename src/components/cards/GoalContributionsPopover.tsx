import { Box, Typography, Popover, IconButton } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { useState, MouseEvent, ReactNode } from 'react';

interface ContributingVersion {
  cardId: string;
  setId: string;
  setName?: string;
  quantityReg: number;
  quantityFoil: number;
}

interface GoalContributionsPopoverProps {
  contributingVersions: ContributingVersion[];
  children: ReactNode;
  isGoalMet?: boolean;
  anchorOriginVertical?: 'top' | 'center' | 'bottom';
  anchorOriginHorizontal?: 'left' | 'center' | 'right';
  transformOriginVertical?: 'top' | 'center' | 'bottom';
  transformOriginHorizontal?: 'left' | 'center' | 'right';
  justifyContent?: 'flex-start' | 'center' | 'flex-end';
  marginTop?: number;
}

export function GoalContributionsPopover({
  contributingVersions,
  children,
  isGoalMet = false,
  anchorOriginVertical = 'bottom',
  anchorOriginHorizontal = 'left',
  transformOriginVertical = 'top',
  transformOriginHorizontal = 'left',
  justifyContent = 'flex-start',
  marginTop,
}: GoalContributionsPopoverProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  const renderPopoverContent = () => {
    if (!contributingVersions || contributingVersions.length === 0) return null;

    return (
      <Box sx={{ p: 2, maxWidth: 350, position: 'relative' }}>
        <IconButton
          size="small"
          onClick={handleClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1, pr: 3 }}>
          Contributions from other sets:
        </Typography>
        <Box sx={{ maxHeight: 300, overflowY: 'auto', pr: 1 }}>
          {contributingVersions.map((version, index) => (
            <Box key={`${version.cardId}-${index}`} sx={{ mb: 0.5 }}>
              <Typography variant="body2">
                {version.setName || `Set ${version.setId}`}:{version.quantityReg > 0 && ` ${version.quantityReg} regular`}
                {version.quantityReg > 0 && version.quantityFoil > 0 && ','}
                {version.quantityFoil > 0 && ` ${version.quantityFoil} foil`}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  return (
    <>
      <Box sx={{ display: 'block', textAlign: justifyContent === 'center' ? 'center' : 'left', mt: marginTop, lineHeight: 0 }}>
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.125 }}>
          {children}
          <IconButton
            size="small"
            onClick={handleClick}
            sx={{
              padding: 0,
              color: isGoalMet ? 'success.main' : 'warning.main',
              marginTop: marginTop ? '-2px' : 0,
            }}
          >
            <InfoOutlinedIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Box>
      </Box>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: anchorOriginVertical,
          horizontal: anchorOriginHorizontal,
        }}
        transformOrigin={{
          vertical: transformOriginVertical,
          horizontal: transformOriginHorizontal,
        }}
      >
        {renderPopoverContent()}
      </Popover>
    </>
  );
}