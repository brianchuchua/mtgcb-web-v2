import { Box, LinearProgress, Typography, keyframes } from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';

// Animation for completed collection - sliding gradient
const slideGradientAnimation = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

interface CollectionHeaderProps {
  username: string;
  uniquePrintingsCollected: number;
  numberOfCardsInMagic: number;
  totalCardsCollected: number;
  percentageCollected: number;
  totalValue: number;
}

const HeaderContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  marginBottom: theme.spacing(2),
}));

const ProgressBarContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  maxWidth: '400px',
  marginTop: theme.spacing(1),
}));

const StyledLinearProgress = styled(LinearProgress, {
  shouldForwardProp: (prop) => prop !== 'percentageCollected',
})<{ percentageCollected: number }>(({ theme, percentageCollected }) => ({
    height: 24,
    borderRadius: 12,
    width: '100%',
    '& .MuiLinearProgress-bar': {
      background:
        percentageCollected === 100
          ? 'linear-gradient(270deg, #BF4427 0%, #E85D39 25%, #FFB347 50%, #E85D39 75%, #BF4427 100%)'
          : 'linear-gradient(45deg, #90CAF9 0%, #1976D2 100%)',
      backgroundSize: percentageCollected === 100 ? '200% 200%' : 'auto',
      animation: percentageCollected === 100 ? `${slideGradientAnimation} 6s ease-in-out infinite` : 'none',
      borderRadius: 12,
    },
  }),
);

const ProgressLabel = styled(Typography)(({ theme }) => ({
  position: 'absolute',
  left: '50%',
  top: '50%',
  transform: 'translate(-50%, -50%)',
  fontWeight: 'bold',
  color: theme.palette.common.white,
  textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
  fontSize: '0.875rem',
  lineHeight: 1,
  paddingTop: '1px',
}));

export const CollectionHeader: React.FC<CollectionHeaderProps> = ({
  username,
  uniquePrintingsCollected,
  numberOfCardsInMagic,
  totalCardsCollected,
  percentageCollected,
  totalValue,
}) => {
  return (
    <HeaderContainer>
      <Typography variant="h4" sx={{ mb: 0.5, color: 'primary.main' }}>
        {username}'s Collection
      </Typography>

      <Typography variant="h6" color="text.secondary" sx={{ mb: 0 }}>
        {uniquePrintingsCollected}/{numberOfCardsInMagic}
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
        ({totalCardsCollected} total cards collected)
      </Typography>

      <Typography variant="h6" color="text.secondary" sx={{ mb: 0 }}>
        Collection value: $
        {totalValue.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </Typography>

      <Box sx={{ mt: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <ProgressBarContainer>
          <StyledLinearProgress
            variant="determinate"
            value={percentageCollected}
            percentageCollected={percentageCollected}
          />
          <ProgressLabel>{percentageCollected}% collected</ProgressLabel>
        </ProgressBarContainer>
      </Box>
    </HeaderContainer>
  );
};
