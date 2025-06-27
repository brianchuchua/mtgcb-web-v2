import React from 'react';
import { Box, Button } from '@mui/material';

interface MobileResultsButtonProps {
  onClick: () => void;
}

const MobileResultsButton: React.FC<MobileResultsButtonProps> = ({ onClick }) => {
  return (
    <Box sx={{ mt: 3, mb: 2 }}>
      <Button variant="contained" fullWidth color="primary" onClick={onClick} size="large">
        View Search Results
      </Button>
    </Box>
  );
};

export default MobileResultsButton;