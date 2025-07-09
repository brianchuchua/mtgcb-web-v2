'use client';

import AddIcon from '@mui/icons-material/Add';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/navigation';
import { useGetLocationsQuery } from '@/api/locations/locationsApi';
import LocationsList from '@/components/locations/LocationsList';
import Pagination from '@/components/pagination/Pagination';
import { useLocationsPagination } from '@/hooks/locations/useLocationsPagination';
import { useAuth } from '@/hooks/useAuth';

export default function LocationsClient() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { currentPage, pageSize, onPageChange, onPageSizeChange } = useLocationsPagination();

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
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => router.push('/locations/create')}
        >
          Add Location
        </Button>
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
    </Box>
  );
}
