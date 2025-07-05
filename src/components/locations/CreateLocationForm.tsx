import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useSnackbar } from 'notistack';
import { CreateLocationRequest } from '@/api/locations/types';
import { useCreateLocationMutation } from '@/api/locations/locationsApi';

export default function CreateLocationForm() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [createLocation, { isLoading }] = useCreateLocationMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateLocationRequest>({
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const onSubmit = async (data: CreateLocationRequest) => {
    try {
      const cleanedData = {
        name: data.name.trim(),
        description: data.description?.trim() || undefined,
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
          />

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