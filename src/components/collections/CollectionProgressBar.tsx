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

interface CollectionProgressBarProps {
  percentage: number;
  height?: number;
  showLabel?: boolean;
  labelFormat?: 'short' | 'long'; // 'short' = "75%", 'long' = "75% collected"
  maxWidth?: string | number;
  minWidth?: string | number;
}

interface StyledProgressProps {
  percentage: number;
  height: number;
}

const ProgressBarContainer = styled(Box, {
  shouldForwardProp: (prop) => !['minWidth', 'maxWidth'].includes(prop as string),
})<{ minWidth?: string | number; maxWidth?: string | number }>(({ theme, minWidth, maxWidth }) => ({
  position: 'relative',
  width: '100%',
  minWidth: minWidth || 'auto',
  maxWidth: maxWidth || '100%',
}));

const StyledLinearProgress = styled(LinearProgress, {
  shouldForwardProp: (prop) => !['percentage', 'height'].includes(prop as string),
})<StyledProgressProps>(({ theme, percentage, height }) => ({
  height: height,
  borderRadius: height / 2,
  backgroundColor: theme.palette.action.hover,
  '& .MuiLinearProgress-bar': {
    background:
      percentage === 100
        ? 'linear-gradient(270deg, #BF4427 0%, #E85D39 25%, #FFB347 50%, #E85D39 75%, #BF4427 100%)'
        : 'linear-gradient(45deg, #90CAF9 0%, #1976D2 100%)',
    backgroundSize: percentage === 100 ? '200% 200%' : 'auto',
    animation: percentage === 100 ? `${slideGradientAnimation} 6s ease-in-out infinite` : 'none',
    borderRadius: height / 2,
  },
}));

const ProgressLabel = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'height',
})<{ height: number }>(({ theme, height }) => ({
  position: 'absolute',
  left: '50%',
  top: '50%',
  transform: 'translate(-50%, -50%)',
  fontWeight: 'bold',
  color: theme.palette.common.white,
  textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
  fontSize: height <= 20 ? '0.75rem' : '0.875rem',
  lineHeight: 1,
  whiteSpace: 'nowrap',
}));

export const CollectionProgressBar: React.FC<CollectionProgressBarProps> = ({
  percentage,
  height = 24,
  showLabel = true,
  labelFormat = 'short',
  maxWidth,
  minWidth,
}) => {
  const roundedPercentage = Math.round(percentage);
  const labelText = labelFormat === 'long' ? `${roundedPercentage}% collected` : `${roundedPercentage}%`;

  return (
    <ProgressBarContainer minWidth={minWidth} maxWidth={maxWidth}>
      <StyledLinearProgress
        variant="determinate"
        value={percentage}
        percentage={percentage}
        height={height}
      />
      {showLabel && (
        <ProgressLabel height={height}>
          {labelText}
        </ProgressLabel>
      )}
    </ProgressBarContainer>
  );
};