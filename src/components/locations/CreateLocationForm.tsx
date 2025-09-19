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
import { CreateLocationRequest, LocationHierarchy } from '@/api/locations/types';
import { useCreateLocationMutation, useGetLocationHierarchyQuery } from '@/api/locations/locationsApi';

export default function CreateLocationForm() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [createLocation, { isLoading }] = useCreateLocationMutation();
  const { data: locationsResponse } = useGetLocationHierarchyQuery();
  const locations = locationsResponse?.data || [];

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CreateLocationRequest>({
    defaultValues: {
      name: '',
      description: '',
      parentId: undefined,
    },
  });

  const parentId = watch('parentId');

  // Helper function to render location options with indentation
  const renderLocationOptions = (locations: LocationHierarchy[], depth = 0): React.ReactNode[] => {
    const options: React.ReactNode[] = [];
    
    for (const location of locations) {
      const indent = '\u00A0\u00A0'.repeat(depth * 2); // Non-breaking spaces
      const prefix = depth > 0 ? '└ ' : '';
      
      options.push(
        <MenuItem key={location.id} value={location.id}>
          {indent}{prefix}{location.name}
        </MenuItem>
      );
      
      if (location.children.length > 0) {
        options.push(...renderLocationOptions(location.children, depth + 1));
      }
    }
    
    return options;
  };

  const onSubmit = async (data: CreateLocationRequest) => {
    try {
      const cleanedData = {
        name: data.name.trim(),
        description: data.description?.trim() || undefined,
        parentId: data.parentId || undefined,
      };

      await createLocation(cleanedData).unwrap();
      enqueueSnackbar('Location created successfully', { variant: 'success' });
      router.push('/locations');
    } catch (error: any) {
      const message = error?.data?.error?.message || 'Failed to create location';
      enqueueSnackbar(message, { variant: 'error' });
    }
  };

  const handleCancel = () => {
    router.push('/locations');
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" component="h2" gutterBottom>
        Add New Location
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Create a storage location for your Magic: The Gathering cards
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
            placeholder="e.g., Blue Binder, Trade Box, Deck Storage"
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
            placeholder="Add any notes about this location..."
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
                onChange={(e) => setValue('parentId', e.target.value === '' ? undefined : Number(e.target.value))}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {renderLocationOptions(locations)}
              </Select>
              <FormHelperText>
                Select a parent location if this location is inside another location
              </FormHelperText>
            </FormControl>
          )}

          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button onClick={handleCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Location'}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Paper>
  );
}