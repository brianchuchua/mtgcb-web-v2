import AutoFixHigh from '@mui/icons-material/AutoFixHigh';
import { Button, ButtonProps, Tooltip, useMediaQuery, useTheme } from '@mui/material';
import React from 'react';

interface MassUpdateButtonProps extends Omit<ButtonProps, 'onClick'> {
  onClick: () => void;
  isOpen?: boolean;
}

const MassUpdateButton: React.FC<MassUpdateButtonProps> = ({ onClick, isOpen = false, ...rest }) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

  const button = (
    <Button
      variant={isOpen ? 'contained' : 'outlined'}
      size="small"
      onClick={onClick}
      startIcon={!isSmallScreen ? <AutoFixHigh /> : undefined}
      sx={{
        minWidth: isSmallScreen ? 'auto' : undefined,
        px: isSmallScreen ? 1 : undefined,
      }}
      {...rest}
    >
      {isSmallScreen ? <AutoFixHigh /> : 'Mass Update'}
    </Button>
  );

  return isSmallScreen ? (
    <Tooltip title="Mass Update">
      <span>{button}</span>
    </Tooltip>
  ) : (
    button
  );
};

export default MassUpdateButton;
