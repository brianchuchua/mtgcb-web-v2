import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';

interface SetNavigationButtonsProps {
  previousSet: { name: string; slug: string } | null;
  nextSet: { name: string; slug: string } | null;
  onNavigate: (slug: string) => void;
}

export const SetNavigationButtons: React.FC<SetNavigationButtonsProps> = ({
  previousSet,
  nextSet,
  onNavigate,
}) => {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: '50%',
        left: 0,
        right: 0,
        transform: 'translateY(-50%)',
        display: 'flex',
        justifyContent: 'space-between',
        pointerEvents: 'none',
        px: { xs: 1, sm: 2 },
        zIndex: 1,
      }}
    >
      <Tooltip title={previousSet ? previousSet.name : 'No previous set'}>
        <span>
          <IconButton
            onClick={() => previousSet && onNavigate(previousSet.slug)}
            disabled={!previousSet}
            size="large"
            sx={{ pointerEvents: 'auto' }}
          >
            <ChevronLeft fontSize="large" />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title={nextSet ? nextSet.name : 'No next set'}>
        <span>
          <IconButton
            onClick={() => nextSet && onNavigate(nextSet.slug)}
            disabled={!nextSet}
            size="large"
            sx={{ pointerEvents: 'auto' }}
          >
            <ChevronRight fontSize="large" />
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  );
};