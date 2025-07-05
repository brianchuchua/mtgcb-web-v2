import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useSnackbar } from 'notistack';
import { Location, UpdateLocationRequest } from '@/api/locations/types';
import { useUpdateLocationMutation } from '@/api/locations/locationsApi';

interface EditLocationFormProps {
  location: Location;
}

export default function EditLocationForm({ location }: EditLocationFormProps) {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [updateLocation, { isLoading }] = useUpdateLocationMutation();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<UpdateLocationRequest>({
    defaultValues: {
      name: location.name,
      description: location.description || '',
    },
  });

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
          />

          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button onClick={handleCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={isLoading || !isDirty}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Paper>
  );
}