'use client';

import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import { Box, Collapse, Divider, IconButton, Typography } from '@mui/material';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import BrowseSearchForm from '@/features/browse/BrowseSearchForm';
import GoalSelector from '@/features/browse/GoalSelector';

export const SearchForms = () => {
  const pathname = usePathname();
  
  // Auto-expand for Browse, Collection, and Shared Collection pages
  const shouldAutoExpand = pathname?.startsWith('/browse') || pathname?.startsWith('/collections') || pathname?.startsWith('/shared/');
  
  // Start expanded for browse and collection pages - MUST be called before any returns
  const [isExpanded, setIsExpanded] = useState(shouldAutoExpand);
  
  // Update expansion state when navigating to browse or collection pages
  // MUST be called before any conditional returns to follow React's rules of hooks
  useEffect(() => {
    if (shouldAutoExpand) {
      setIsExpanded(true);
    }
  }, [pathname, shouldAutoExpand]);
  
  // Check if this is a collection or shared card detail page
  const isCollectionCardPage = (pathname?.startsWith('/collections/') && 
                                pathname?.includes('/cards/') && 
                                pathname?.split('/').length > 4) ||
                               (pathname?.startsWith('/shared/') && 
                                pathname?.includes('/cards/') && 
                                pathname?.split('/').length > 4);
  
  // Don't show on card detail pages (no search options there)
  if (isCollectionCardPage) {
    return null;
  }

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Only render the component if we're on a page that needs a search form
  if (!pathname?.startsWith('/browse') && !pathname?.startsWith('/collections') && !pathname?.startsWith('/shared/')) {
    return null;
  }
  
  // Don't render on the edit-cards page
  if (pathname === '/collections/edit-cards') {
    return null;
  }
  
  // Don't render on browse card detail pages
  if (pathname?.startsWith('/browse/cards/') && pathname?.split('/').length > 3) {
    return null;
  }

  // Get the appropriate title based on the current route
  const getFormTitle = () => {
    if (pathname === '/browse') return 'Search Options';
    if (pathname?.startsWith('/collections')) return 'Search Options';
    if (pathname?.startsWith('/shared/')) return 'Search Options';
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
          <ManageSearchIcon color="primary" sx={{ mr: 1.5 }} />
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
        <Box sx={{ p: 0 }}>
          {/* Show BrowseSearchForm on browse, collection, and shared collection pages */}
          {(pathname?.startsWith('/browse') || pathname?.startsWith('/collections') || pathname?.startsWith('/shared/')) && <BrowseSearchForm />}
          {/* Add other forms here later, like:
            pathname.startsWith('/inventory') && <InventorySearchForm />
            etc...
          */}
        </Box>
      </Collapse>
    </Box>
  );
};
