'use client';

import { Box, Typography } from '@mui/material';
import BrowseSearchForm from '@/features/browse/BrowseSearchForm';
import { useInitializeBrowseFromUrl } from '@/hooks/useInitializeBrowseFromUrl';
import { useSearchFromUrl } from '@/hooks/useSearchFromUrl';
import { useSyncBrowseUrl } from '@/hooks/useSyncBrowseUrl';

export default function BrowsePage() {
  const { searchResult, isLoading, error } = useSearchFromUrl();

  useInitializeBrowseFromUrl();
  useSyncBrowseUrl();

  return (
    <Box sx={{ p: 3 }}>
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
