import LocationOn from '@mui/icons-material/LocationOn';
import { Button, ButtonProps, Tooltip, useMediaQuery, useTheme } from '@mui/material';
import React from 'react';

interface MassUpdateLocationButtonProps extends Omit<ButtonProps, 'onClick'> {
  onClick: () => void;
  isOpen?: boolean;
}

const MassUpdateLocationButton: React.FC<MassUpdateLocationButtonProps> = ({ onClick, isOpen = false, ...rest }) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const button = (
    <Button
      variant={isOpen ? 'contained' : 'outlined'}
      size="small"
      onClick={onClick}
      startIcon={!isSmallScreen ? <LocationOn /> : undefined}
      sx={{
        minWidth: isSmallScreen ? 'auto' : undefined,
        px: isSmallScreen ? 1 : undefined,
      }}
      {...rest}
    >
      {isSmallScreen ? <LocationOn /> : 'Locations'}
    </Button>
  );

  return isSmallScreen ? (
    <Tooltip title="Manage Locations">
      <span>{button}</span>
    </Tooltip>
  ) : (
    button
  );
};

export default MassUpdateLocationButton;
