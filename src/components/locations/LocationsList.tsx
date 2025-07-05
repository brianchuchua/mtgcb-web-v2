import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Location } from '@/api/locations/types';
import { useDeleteLocationMutation } from '@/api/locations/locationsApi';
import { useSnackbar } from 'notistack';
import { formatDate } from '@/utils/dateUtils';

interface LocationsListProps {
  locations: Location[];
}

export default function LocationsList({ locations }: LocationsListProps) {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [deleteLocation] = useDeleteLocationMutation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);

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
              <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" component="h2" gutterBottom>
                  {location.name}
                </Typography>
                {location.description && (
                  <Typography variant="body2" color="text.secondary">
                    {location.description}
                  </Typography>
                )}
                <Box sx={{ mt: 'auto', pt: 2 }}>
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
              </CardContent>
              <CardActions>
                <IconButton
                  size="small"
                  onClick={() => handleEditClick(location.id)}
                  aria-label="edit location"
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleDeleteClick(location)}
                  aria-label="delete location"
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Location</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{locationToDelete?.name}"? This will remove any associations between
            this location and your collection items.
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