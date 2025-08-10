import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import { useDeleteLocationMutation } from '@/api/locations/locationsApi';
import { Location, LocationWithCount } from '@/api/locations/types';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/utils/dateUtils';
import { getCollectionUrl } from '@/utils/collectionUrls';

interface LocationsListProps {
  locations: (Location | LocationWithCount)[];
}

export default function LocationsList({ locations }: LocationsListProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [deleteLocation] = useDeleteLocationMutation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);

  const userId = user?.userId;

  const handleEditClick = (locationId: number) => {
    router.push(`/locations/edit/${locationId}`);
  };

  const handleDeleteClick = (location: Location) => {
    setLocationToDelete(location);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!locationToDelete) return;

    try {
      await deleteLocation(locationToDelete.id).unwrap();
      enqueueSnackbar('Location deleted successfully', { variant: 'success' });
      setDeleteDialogOpen(false);
      setLocationToDelete(null);
    } catch (error) {
      enqueueSnackbar('Failed to delete location', { variant: 'error' });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setLocationToDelete(null);
  };

  return (
    <>
      <Grid container spacing={2}>
        {locations.map((location) => (
          <Grid item xs={12} md={6} lg={4} key={location.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ '&:last-child': { pb: 2 }, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                  <Box sx={{ flex: 1 }}>
                    {userId ? (
                      <Link
                        href={`${getCollectionUrl({ userId, contentType: 'cards' })}&locationId=${location.id}`}
                        style={{ textDecoration: 'none' }}
                      >
                        <Typography
                          variant="h6"
                          sx={{
                            color: 'inherit',
                            '&:hover': {
                              textDecoration: 'underline',
                            },
                          }}
                        >
                          {location.name}
                        </Typography>
                      </Link>
                    ) : (
                      <Typography variant="h6" component="h2">
                        {location.name}
                      </Typography>
                    )}
                  </Box>
                  <Stack direction="row" spacing={0.5}>
                    {userId && (
                      <Tooltip title="View location">
                        <Link
                          href={`${getCollectionUrl({ userId, contentType: 'cards' })}&locationId=${location.id}`}
                        >
                          <IconButton size="small">
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Link>
                      </Tooltip>
                    )}
                    <Tooltip title="Edit location">
                      <IconButton size="small" onClick={() => handleEditClick(location.id)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete location">
                      <IconButton size="small" color="error" onClick={() => handleDeleteClick(location)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Box>

                {location.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {location.description}
                  </Typography>
                )}

                <Box
                  sx={{ mt: 'auto', pt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}
                >
                  <Box>
                    {'totalCards' in location && (
                      <Typography variant="body2" color="text.secondary">
                        {location.totalCards} {location.totalCards === 1 ? 'card' : 'cards'}
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ textAlign: 'right' }}>
                    {location.updatedAt && location.updatedAt !== location.createdAt ? (
                      <Tooltip title={`Created ${formatDate(location.createdAt)}`} placement="top">
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Edited
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ cursor: 'help' }}>
                            {formatDate(location.updatedAt)}
                          </Typography>
                        </Box>
                      </Tooltip>
                    ) : (
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Created
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(location.createdAt)}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Location</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{locationToDelete?.name}"? This will remove any associations between this
            location and your collection items.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
