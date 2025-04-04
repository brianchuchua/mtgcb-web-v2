'use client';

import LibraryAddCheckIcon from '@mui/icons-material/LibraryAddCheck';
import StyleIcon from '@mui/icons-material/Style';
import { Box, Button, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { useCallback, useEffect, useState } from 'react';

interface ContentTypeToggleProps {
  contentType: 'cards' | 'sets';
  onContentTypeChange: (contentType: 'cards' | 'sets') => void;
  isLoading?: boolean;
  isInitialLoading?: boolean;
}

const ContentTypeToggle: React.FC<ContentTypeToggleProps> = ({
  contentType,
  onContentTypeChange,
  isLoading = false,
  isInitialLoading = false,
}) => {
  const [isFullyLoaded, setIsFullyLoaded] = useState(!isInitialLoading);

  useEffect(() => {
    if (isInitialLoading) {
      setIsFullyLoaded(false);
    } else if (!isFullyLoaded) {
      const timer = setTimeout(() => setIsFullyLoaded(true), 16);
      return () => clearTimeout(timer);
    }
  }, [isInitialLoading, isFullyLoaded]);

  const handleCardsClick = useCallback(() => {
    onContentTypeChange('cards');
  }, [onContentTypeChange]);

  const handleSetsClick = useCallback(() => {
    onContentTypeChange('sets');
  }, [onContentTypeChange]);

  return (
    <ToggleContainer>
      <Tooltip title="Browse cards">
        <span>
          <Button
            variant={!isFullyLoaded ? 'outlined' : contentType === 'cards' ? 'contained' : 'outlined'}
            size="small"
            onClick={handleCardsClick}
            startIcon={<StyleIcon />}
            disabled={!isFullyLoaded || isLoading}
            sx={{ opacity: isFullyLoaded ? 1 : 0.7 }}
          >
            Cards
          </Button>
        </span>
      </Tooltip>
      <Tooltip title="Browse sets">
        <span>
          <Button
            variant={!isFullyLoaded ? 'outlined' : contentType === 'sets' ? 'contained' : 'outlined'}
            size="small"
            onClick={handleSetsClick}
            startIcon={<LibraryAddCheckIcon />}
            disabled={!isFullyLoaded || isLoading}
            sx={{ opacity: isFullyLoaded ? 1 : 0.7 }}
          >
            Sets
          </Button>
        </span>
      </Tooltip>
    </ToggleContainer>
  );
};

const ToggleContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(2),
}));

export default ContentTypeToggle;
