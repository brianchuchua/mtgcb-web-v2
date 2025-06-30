import React from 'react';
import { Box, Button, Stack } from '@mui/material';
import StyleIcon from '@mui/icons-material/Style';
import ViewModuleIcon from '@mui/icons-material/ViewModule';

interface ContentTypeToggleProps {
  contentType: 'cards' | 'sets';
  onCardsClick: () => void;
  onSetsClick: () => void;
}

const ContentTypeToggle: React.FC<ContentTypeToggleProps> = ({ contentType, onCardsClick, onSetsClick }) => {
  return (
    <Box sx={{ mb: 1 }}>
      <Stack direction="row" spacing={1}>
        <Button
          variant={contentType === 'cards' ? 'contained' : 'outlined'}
          size="small"
          onClick={onCardsClick}
          startIcon={<StyleIcon sx={{ transform: 'scaleY(-1)' }} />}
          fullWidth
          data-testid="content-type-toggle-cards"
        >
          View Cards
        </Button>
        <Button
          variant={contentType === 'sets' ? 'contained' : 'outlined'}
          size="small"
          onClick={onSetsClick}
          startIcon={<ViewModuleIcon />}
          fullWidth
          data-testid="content-type-toggle-sets"
        >
          View Sets
        </Button>
      </Stack>
    </Box>
  );
};

export default ContentTypeToggle;