import React from 'react';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { useLabeledNavigationArrows } from '@/contexts/DisplaySettingsContext';

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
  const [labeledNavigationArrows] = useLabeledNavigationArrows();

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
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0.5,
          pointerEvents: 'auto',
        }}
      >
        {labeledNavigationArrows ? (
          <>
            <IconButton
              onClick={() => previousSet && onNavigate(previousSet.slug)}
              disabled={!previousSet}
              size="large"
            >
              <ChevronLeft fontSize="large" />
            </IconButton>
            {previousSet && (
              <Box
                sx={{
                  display: { xs: 'none', sm: 'block' },
                  backgroundColor: 'rgba(97, 97, 97, 0.9)',
                  color: '#fff',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '0.6875rem',
                  maxWidth: 200,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'block',
                  }}
                >
                  {previousSet.name}
                </Typography>
              </Box>
            )}
          </>
        ) : (
          <Tooltip title={previousSet ? previousSet.name : 'No previous set'}>
            <span>
              <IconButton
                onClick={() => previousSet && onNavigate(previousSet.slug)}
                disabled={!previousSet}
                size="large"
              >
                <ChevronLeft fontSize="large" />
              </IconButton>
            </span>
          </Tooltip>
        )}
      </Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0.5,
          pointerEvents: 'auto',
        }}
      >
        {labeledNavigationArrows ? (
          <>
            <IconButton
              onClick={() => nextSet && onNavigate(nextSet.slug)}
              disabled={!nextSet}
              size="large"
            >
              <ChevronRight fontSize="large" />
            </IconButton>
            {nextSet && (
              <Box
                sx={{
                  display: { xs: 'none', sm: 'block' },
                  backgroundColor: 'rgba(97, 97, 97, 0.9)',
                  color: '#fff',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '0.6875rem',
                  maxWidth: 200,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'block',
                  }}
                >
                  {nextSet.name}
                </Typography>
              </Box>
            )}
          </>
        ) : (
          <Tooltip title={nextSet ? nextSet.name : 'No next set'}>
            <span>
              <IconButton
                onClick={() => nextSet && onNavigate(nextSet.slug)}
                disabled={!nextSet}
                size="large"
              >
                <ChevronRight fontSize="large" />
              </IconButton>
            </span>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
};