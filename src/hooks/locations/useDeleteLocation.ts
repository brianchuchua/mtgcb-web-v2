import { useSnackbar } from 'notistack';
import { useState } from 'react';
import { useDeleteLocationMutation } from '@/api/locations/locationsApi';
import { Location } from '@/api/locations/types';

interface UseDeleteLocationOptions {
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export function useDeleteLocation(options?: UseDeleteLocationOptions) {
  const { enqueueSnackbar } = useSnackbar();
  const [deleteLocation, { isLoading: isDeleting }] = useDeleteLocationMutation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);

  const handleDeleteClick = (location: Location) => {
    setLocationToDelete(location);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!locationToDelete) return;

    try {
      await deleteLocation(locationToDelete.id).unwrap();
      enqueueSnackbar('Location deleted successfully', { variant: 'success' });
      options?.onSuccess?.();
    } catch (error) {
      enqueueSnackbar('Failed to delete location', { variant: 'error' });
      options?.onError?.(error);
    } finally {
      setDeleteDialogOpen(false);
      setLocationToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setLocationToDelete(null);
  };

  return {
    isDeleting,
    deleteDialogOpen,
    locationToDelete,
    handleDeleteClick,
    handleConfirmDelete,
    handleCancelDelete,
  };
}