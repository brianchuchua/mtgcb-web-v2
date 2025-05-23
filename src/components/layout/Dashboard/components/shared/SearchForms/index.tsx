'use client';

import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TuneIcon from '@mui/icons-material/Tune';
import { Box, Collapse, Divider, IconButton, Typography } from '@mui/material';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import BrowseSearchForm from '@/features/browse/BrowseSearchForm';

export const SearchForms = () => {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Only render the component if we're on a page that needs a search form
  if (!pathname?.startsWith('/browse') && !pathname?.startsWith('/collections')) {
    return null;
  }

  // Get the appropriate title based on the current route
  const getFormTitle = () => {
    if (pathname === '/browse') return 'Search Options';
    if (pathname?.startsWith('/collections')) return 'Search Options';
    // Add other form titles here as needed
    return 'Search Options';
  };

  return (
    <Box>
      {/* Non-sticky header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1,
          cursor: 'pointer',
          backgroundColor: (theme) => theme.palette.background.paper,
        }}
        onClick={toggleExpanded}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TuneIcon color="primary" sx={{ mr: 1.5 }} />
          <Typography variant="subtitle1" fontWeight="medium">
            {getFormTitle()}
          </Typography>
        </Box>
        <IconButton
          onClick={(e) => {
            e.stopPropagation(); // Prevent the Box onClick from firing
            toggleExpanded();
          }}
          size="small"
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>
      <Divider />
      <Collapse in={isExpanded} timeout="auto">
        <Box>
          {(pathname?.startsWith('/browse') || pathname?.startsWith('/collections')) && <BrowseSearchForm />}
          {/* Add other forms here later, like:
            pathname.startsWith('/inventory') && <InventorySearchForm />
            etc...
          */}
        </Box>
      </Collapse>
    </Box>
  );
};
