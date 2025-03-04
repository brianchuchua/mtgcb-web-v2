'use client';

import { Box, Typography, Divider } from '@mui/material';
import BrowseSearchForm from '@/features/browse/BrowseSearchForm';
import CardGallery from '@/components/cards/CardGallery';
import { mapApiCardsToCardItems } from '@/features/browse/mappers';
import { useInitializeBrowseFromUrl } from '@/hooks/useInitializeBrowseFromUrl';
import { useSearchFromUrl } from '@/hooks/useSearchFromUrl';
import { useSyncBrowseUrl } from '@/hooks/useSyncBrowseUrl';
import { useRouter } from 'next/navigation';

export default function BrowsePage() {
  const { searchResult, isLoading, error } = useSearchFromUrl();
  const router = useRouter();

  useInitializeBrowseFromUrl();
  useSyncBrowseUrl();

  // Handle card click to navigate to card details page
  const handleCardClick = (cardId: string) => {
    router.push(`/browse/cards/${cardId}`);
  };

  return (
    <Box sx={{ p: 3 }}>
      {error && (
        <Box mb={2}>
          <Typography color="error">Error loading cards: {JSON.stringify(error)}</Typography>
        </Box>
      )}

      {/* Render the card gallery with our search results */}
      {searchResult && (
        <CardGallery 
          cards={mapApiCardsToCardItems(searchResult.data?.cards || [])} 
          isLoading={isLoading}
          cardsPerRow={4}
          galleryWidth={95}
          onCardClick={handleCardClick}
        />
      )}

      {/* Debug view - will show the raw JSON data below the card gallery */}
      {searchResult && (
        <>
          <Divider sx={{ my: 4 }} />
          <Typography variant="h6" sx={{ mb: 2 }}>Debug: Raw API Response</Typography>
          <Box
            component="pre"
            sx={{
              p: 2,
              bgcolor: 'background.paper',
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              color: 'text.primary',
              overflow: 'auto',
              fontSize: '0.75rem',
            }}
          >
            {JSON.stringify(searchResult, null, 2)}
          </Box>
        </>
      )}
    </Box>
  );
}
