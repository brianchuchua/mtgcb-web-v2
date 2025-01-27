'use client';

import { Box, Typography } from '@mui/material';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useSearchCardsMutation } from '@/api/browse/browseApi';
import BrowseSearchForm from '@/features/browse/BrowseSearchForm';
import { useInitializeBrowseFromUrl } from '@/hooks/useInitializeBrowseFromUrl';
import { useSyncBrowseUrl } from '@/hooks/useSyncBrowseUrl';
import { selectSearchParams } from '@/redux/slices/browseSlice';

export default function BrowsePage() {
  const [searchCards, { data: searchResult, isLoading, error }] = useSearchCardsMutation();
  const searchParams = useSelector(selectSearchParams);

  // Initialize from URL and sync to URL
  useInitializeBrowseFromUrl();
  useSyncBrowseUrl();

  useEffect(() => {
    searchCards({
      name: searchParams.name,
      limit: 24, // hard-coded until I add preferences
      offset: 0,
      sortBy: 'name', // hard-coded until I add preferences
      sortDirection: 'asc', // hard-coded until I add preferences
    });
  }, [searchCards, searchParams]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Browse
      </Typography>
      {isLoading && <Typography>Loading...</Typography>}

      {error && <Typography color="error">Error loading cards: {JSON.stringify(error)}</Typography>}

      {searchResult && (
        <Box
          component="pre"
          sx={{
            mt: 2,
            p: 2,
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            color: 'text.primary',
            overflow: 'auto',
          }}
        >
          {JSON.stringify(searchResult, null, 2)}
        </Box>
      )}
    </Box>
  );
}
