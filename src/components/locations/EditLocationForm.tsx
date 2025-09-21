import { useRouter } from 'next/navigation';
import React from 'react';
import { useForm } from 'react-hook-form';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import FormHelperText from '@mui/material/FormHelperText';
import { useSnackbar } from 'notistack';
import { DeleteLocationDialog } from './DeleteLocationDialog';
import { Location, UpdateLocationRequest, LocationHierarchy } from '@/api/locations/types';
import { useUpdateLocationMutation, useGetLocationHierarchyQuery } from '@/api/locations/locationsApi';
import { useDeleteLocation } from '@/hooks/locations/useDeleteLocation';

interface EditLocationFormProps {
  location: Location;
  onDeleteStart?: () => void;
}

export default function EditLocationForm({ location, onDeleteStart }: EditLocationFormProps) {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [updateLocation, { isLoading }] = useUpdateLocationMutation();
  const { data: locationsResponse, isLoading: isLoadingHierarchy } = useGetLocationHierarchyQuery();
  const locations = locationsResponse?.data || [];
  const {
    isDeleting,
    deleteDialogOpen,
    locationToDelete,
    handleDeleteClick,
    handleConfirmDelete,
    handleCancelDelete,
  } = useDeleteLocation({
    onSuccess: () => {
      onDeleteStart?.();
      router.push('/locations');
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    setValue,
  } = useForm<UpdateLocationRequest>({
    defaultValues: {
      name: location.name,
      description: location.description || '',
      parentId: location.parentId || undefined,
    },
  });

  const parentId = watch('parentId');

  // Helper function to render location options with indentation, excluding self and descendants
  const renderLocationOptions = (locs: LocationHierarchy[], depth = 0, excludeId?: number): React.ReactNode[] => {
    const options: React.ReactNode[] = [];
    
    for (const loc of locs) {
      // Skip only the current location itself
      if (loc.id === excludeId) {
        // Still process its children (they can't be selected as parents anyway due to circular reference check)
        if (loc.children.length > 0) {
          options.push(...renderLocationOptions(loc.children, depth, excludeId));
        }
        continue;
      }
      
      const indent = '\u00A0\u00A0'.repeat(depth * 2); // Non-breaking spaces
      const prefix = depth > 0 ? '└ ' : '';
      
      options.push(
        <MenuItem key={loc.id} value={loc.id}>
          {indent}{prefix}{loc.name}
        </MenuItem>
      );
      
      // Process children normally
      if (loc.children.length > 0) {
        options.push(...renderLocationOptions(loc.children, depth + 1, excludeId));
      }
    }
    
    return options;
  };

  // Helper to check if a location or any of its descendants has the given ID
  const isLocationOrDescendant = (loc: LocationHierarchy, targetId?: number): boolean => {
    if (!targetId) return false;
    if (loc.id === targetId) return true;
    
    for (const child of loc.children) {
      if (isLocationOrDescendant(child, targetId)) {
        return true;
      }
    }
    
    return false;
  };

  const onSubmit = async (data: UpdateLocationRequest) => {
    if (!isDirty) {
      router.push('/locations');
      return;
    }

    try {
      const updates: UpdateLocationRequest = {};
      
      if (data.name !== location.name) {
        updates.name = data.name?.trim();
      }
      
      if (data.description !== (location.description || '')) {
        updates.description = data.description?.trim() || undefined;
      }

      if (data.parentId !== location.parentId) {
        updates.parentId = data.parentId || null;
      }

      await updateLocation({ id: location.id, data: updates }).unwrap();
      enqueueSnackbar('Location updated successfully', { variant: 'success' });
      router.push('/locations');
    } catch (error: any) {
      const message = error?.data?.error?.message || 'Failed to update location';
      enqueueSnackbar(message, { variant: 'error' });
    }
  };

  const handleCancel = () => {
    router.push('/locations');
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" component="h2" gutterBottom>
        Edit Location
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Update your storage location details
      </Typography>

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={3}>
          <TextField
            fullWidth
            label="Location Name"
            {...register('name', {
              required: 'Location name is required',
              minLength: {
                value: 1,
                message: 'Location name must be at least 1 character',
              },
              maxLength: {
                value: 255,
                message: 'Location name must be less than 255 characters',
              },
            })}
            error={!!errors.name}
            helperText={errors.name?.message}
          />

          <TextField
            fullWidth
            multiline
            rows={4}
            label="Description (Optional)"
            {...register('description', {
              maxLength: {
                value: 1000,
                message: 'Description must be less than 1000 characters',
              },
            })}
            error={!!errors.description}
            helperText={errors.description?.message}
            slotProps={{
              htmlInput: {
                spellCheck: 'true',
                autoCapitalize: 'sentences',
              },
            }}
          />

          {locations.length > 0 && (
            <FormControl fullWidth>
              <InputLabel id="parent-location-label">Parent Location (Optional)</InputLabel>
              <Select
                labelId="parent-location-label"
                label="Parent Location (Optional)"
                value={parentId || ''}
                onChange={(e) => setValue('parentId', e.target.value === '' ? undefined : Number(e.target.value), { shouldDirty: true })}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {renderLocationOptions(locations, 0, location.id)}
              </Select>
              <FormHelperText>
                Select a parent location if this location is inside another location
              </FormHelperText>
            </FormControl>
          )}

          <Stack direction="row" spacing={2} justifyContent="space-between">
            <Button 
              variant="contained" 
              color="error" 
              onClick={() => handleDeleteClick(location)}
              disabled={isLoading || isDeleting}
            >
              Delete
            </Button>
            <Stack direction="row" spacing={2}>
              <Button onClick={handleCancel} disabled={isLoading || isDeleting}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={isLoading || isDeleting || !isDirty}>
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </Box>

      <DeleteLocationDialog
        open={deleteDialogOpen}
        locationName={location?.name || ''}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </Paper>
  );
}