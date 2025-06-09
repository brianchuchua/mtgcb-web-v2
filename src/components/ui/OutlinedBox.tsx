'use client';

import { Box, FormControl, InputLabel, styled } from '@mui/material';
import React from 'react';

interface OutlinedBoxProps {
  label: string;
  children: React.ReactNode;
  fullWidth?: boolean;
  margin?: 'none' | 'dense' | 'normal';
}

const StyledFormControl = styled(FormControl)(({ theme }) => ({
  marginTop: theme.spacing(1),
}));

const OutlinedBox: React.FC<OutlinedBoxProps> = ({ 
  label, 
  children, 
  fullWidth = true, 
  margin = 'dense' 
}) => {
  return (
    <StyledFormControl fullWidth={fullWidth} variant="outlined" margin={margin}>
      <InputLabel 
        shrink 
        sx={{ 
          backgroundColor: 'background.paper', 
          paddingLeft: '5px',
          paddingRight: '5px',
          marginLeft: '-5px',
          transform: 'translate(16px, -9px) scale(0.75)',
          transformOrigin: 'top left',
        }}
      >
        {label}
      </InputLabel>
      <Box
        sx={{
          border: 1,
          borderColor: 'rgba(255, 255, 255, 0.23)',
          borderRadius: 1,
          p: 1,
          position: 'relative',
        }}
      >
        {children}
      </Box>
    </StyledFormControl>
  );
};

export default OutlinedBox;