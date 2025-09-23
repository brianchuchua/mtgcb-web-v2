'use client';

import AddIcon from '@mui/icons-material/Add';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useGetLocationsQuery } from '@/api/locations/locationsApi';
import LocationsList from '@/components/locations/LocationsList';
import Pagination from '@/components/pagination/Pagination';
import { useLocationsPagination } from '@/hooks/locations/useLocationsPagination';
import { useAuth } from '@/hooks/useAuth';

export default function LocationsClient() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { currentPage, pageSize, onPageChange, onPageSizeChange } = useLocationsPagination();
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);

  const {
    data: locationsResponse,
    isLoading,
    error,
  } = useGetLocationsQuery(
    {
      includeCardCount: true,
      limit: pageSize,
      offset: (currentPage - 1) * pageSize,
    },
    {
      skip: !isAuthenticated || isAuthLoading,
    },
  );

  if (isAuthLoading || isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return (
      <Box p={3}>
        <Alert severity="info">Please log in to view and manage your locations.</Alert>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={0}>
        <Typography variant="h4" component="h1" color="primary" gutterBottom>
          Locations
        </Typography>
        <Alert severity="error">Failed to load locations. Please try again later.</Alert>
      </Box>
    );
  }

  const locations = locationsResponse?.data?.locations || [];
  const totalLocations = locationsResponse?.data?.totalCount || 0;
  const totalPages = Math.ceil(totalLocations / pageSize);

  return (
    <Box p={0}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" color="primary">
          Locations
        </Typography>
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton onClick={() => setInfoDialogOpen(true)} size="small" sx={{ color: 'text.secondary' }}>
            <InfoOutlinedIcon />
          </IconButton>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => router.push('/locations/create')}
          >
            Add Location
          </Button>
        </Box>
      </Box>

      {locations.length === 0 && !isLoading ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No locations yet
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Create your first location to start organizing your collection.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => router.push('/locations/create')}
          >
            Create Your First Location
          </Button>
        </Paper>
      ) : (
        totalLocations > 0 && (
          <>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              pageSizeOptions={[1, 2, 3, 4, 5, 6, 7, 8, 9]}
              totalItems={totalLocations}
              viewMode="grid"
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
              onViewModeChange={() => {}}
              contentType="cards"
              customItemName="locations"
              hideViewModeToggle
              hideSearchButton
              hideSettingsPanel
            />
            <Box sx={{ mt: { xs: 2, sm: 0 } }}>
              <LocationsList locations={locations} />
            </Box>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              pageSizeOptions={[1, 2, 3, 4, 5, 6, 7, 8, 9]}
              totalItems={totalLocations}
              viewMode="grid"
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
              onViewModeChange={() => {}}
              position="bottom"
              contentType="cards"
              customItemName="locations"
              hideViewModeToggle
              hideSearchButton
              hideSettingsPanel
            />
          </>
        )
      )}

      <Dialog
        open={infoDialogOpen}
        onClose={() => setInfoDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          elevation: 1,
        }}
      >
        <DialogTitle>About Locations</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            <strong>What are locations?</strong>
          </Typography>
          <Typography variant="body2" paragraph>
            Locations help you organize your physical card collection by tracking where cards are stored. Whether you
            use binders, boxes, or other storage methods, you can create locations to match your organization system.
          </Typography>
          <Typography variant="body2" paragraph sx={{ backgroundColor: 'action.hover', p: 2, borderRadius: 1 }}>
            <strong>Recommendation:</strong> Use locations sparingly! If you store cards in a binder for that set, it's
            not worth recording that location explicitly – it's self-evident. Locations work best when they actually
            help you find cards, like when they're in a specific deckbox or filing cabinet. Don't give yourself a ton of
            busywork.
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>Key points:</strong>
          </Typography>
          <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
            <li>Using locations is completely optional</li>
            <li>You can track your collection without assigning cards to locations</li>
            <li>You don't need to assign every card – track only what's useful</li>
            <li>
              Tracking quantities in locations is also optional – you can assign cards without specifying exact numbers
            </li>
            <li>Cards can be assigned to multiple locations with different quantities</li>
            <li>Click on a location name to view all cards stored there</li>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInfoDialogOpen(false)} variant="contained">
            Got it
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
