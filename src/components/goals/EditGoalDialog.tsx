import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  Divider,
  Chip,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import { useUpdateGoalMutation } from '@/api/goals/goalsApi';
import { Goal, UpdateGoalRequest } from '@/api/goals/types';
import { CardApiParams } from '@/api/browse/types';
import { GoalSearchForm } from './GoalSearchForm';

interface EditGoalDialogProps {
  open: boolean;
  onClose: () => void;
  goal: Goal | null;
  userId: number;
}

interface FormValues {
  name: string;
  description: string;
  targetQuantityReg?: number;
  targetQuantityFoil?: number;
  targetQuantityAll?: number;
  isActive: boolean;
}

export function EditGoalDialog({ open, onClose, goal, userId }: EditGoalDialogProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [updateGoal, { isLoading }] = useUpdateGoalMutation();
  const [quantityMode, setQuantityMode] = useState<'separate' | 'all'>('separate');
  const [searchConditions, setSearchConditions] = useState<Omit<CardApiParams, 'limit' | 'offset' | 'sortBy' | 'sortDirection'>>({});

  // Memoize the onChange handler to prevent infinite loops
  const handleSearchConditionsChange = useCallback((conditions: Omit<CardApiParams, 'limit' | 'offset' | 'sortBy' | 'sortDirection'>) => {
    setSearchConditions(conditions);
  }, []);

  const { control, handleSubmit, reset, formState: { errors }, setValue } = useForm<FormValues>({
    defaultValues: {
      name: '',
      description: '',
      targetQuantityReg: undefined,
      targetQuantityFoil: undefined,
      targetQuantityAll: undefined,
      isActive: true,
    },
  });

  // Parse search conditions from goal
  useEffect(() => {
    if (goal) {
      // Set form values
      setValue('name', goal.name);
      setValue('description', goal.description || '');
      setValue('targetQuantityReg', goal.targetQuantityReg ?? undefined);
      setValue('targetQuantityFoil', goal.targetQuantityFoil ?? undefined);
      setValue('targetQuantityAll', goal.targetQuantityAll ?? undefined);
      setValue('isActive', goal.isActive);

      // Determine quantity mode
      if (goal.targetQuantityAll) {
        setQuantityMode('all');
      } else {
        setQuantityMode('separate');
      }

      // Set search conditions
      setSearchConditions(goal.searchCriteria.conditions);
    }
  }, [goal, setValue]);

  const handleClose = () => {
    reset();
    setSearchConditions({});
    setQuantityMode('separate');
    onClose();
  };

  const onSubmit = async (data: FormValues) => {
    if (!goal) return;

    try {
      const searchCriteria = {
        conditions: searchConditions,
        sort: goal.searchCriteria.sort,
        order: goal.searchCriteria.order,
      };

      const request: UpdateGoalRequest = {
        name: data.name,
        description: data.description || undefined,
        searchCriteria,
        isActive: data.isActive,
      };

      if (quantityMode === 'all') {
        request.targetQuantityAll = data.targetQuantityAll;
      } else {
        if (data.targetQuantityReg) request.targetQuantityReg = data.targetQuantityReg;
        if (data.targetQuantityFoil) request.targetQuantityFoil = data.targetQuantityFoil;
      }

      const result = await updateGoal({ 
        userId, 
        goalId: goal.id, 
        body: request 
      }).unwrap();
      
      enqueueSnackbar('Goal updated successfully!', { variant: 'success' });
      handleClose();
    } catch (error: any) {
      enqueueSnackbar(error?.data?.error?.message || 'Failed to update goal', { variant: 'error' });
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        elevation: 0,
        sx: {
          backgroundColor: 'rgb(34, 38, 44)',
        }
      }}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>Edit Collection Goal</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
            <Controller
              name="name"
              control={control}
              rules={{ required: 'Goal name is required', maxLength: { value: 255, message: 'Name too long' } }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Goal Name"
                  fullWidth
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              )}
            />

            <Controller
              name="description"
              control={control}
              rules={{ maxLength: { value: 1000, message: 'Description too long' } }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Description (optional)"
                  fullWidth
                  multiline
                  rows={2}
                  error={!!errors.description}
                  helperText={errors.description?.message}
                />
              )}
            />

            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch {...field} checked={field.value} />}
                  label="Active"
                />
              )}
            />

            <Divider />

            <Box>
              <Typography variant="h6" gutterBottom>
                Search Criteria
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Define which cards this goal applies to. Leave fields empty to include all cards.
              </Typography>
              
              <GoalSearchForm
                searchConditions={searchConditions}
                onChange={handleSearchConditionsChange}
              />
            </Box>

            <Divider />

            <Box>
              <Typography variant="h6" gutterBottom>
                Target Quantities
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Chip
                  label="Separate Regular/Foil"
                  onClick={() => setQuantityMode('separate')}
                  color={quantityMode === 'separate' ? 'primary' : 'default'}
                  sx={{ mr: 1 }}
                />
                <Chip
                  label="Any Type"
                  onClick={() => setQuantityMode('all')}
                  color={quantityMode === 'all' ? 'primary' : 'default'}
                />
              </Box>

              {quantityMode === 'separate' ? (
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Controller
                    name="targetQuantityReg"
                    control={control}
                    rules={{ 
                      min: { value: 1, message: 'Must be at least 1' },
                      validate: (value, formValues) => 
                        value || formValues.targetQuantityFoil ? true : 'At least one quantity is required'
                    }}
                    render={({ field: { onChange, value, ...field } }) => (
                      <TextField
                        {...field}
                        value={value ?? ''}
                        label="Regular Cards"
                        type="number"
                        fullWidth
                        error={!!errors.targetQuantityReg}
                        helperText={errors.targetQuantityReg?.message}
                        onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    )}
                  />
                  <Controller
                    name="targetQuantityFoil"
                    control={control}
                    rules={{ min: { value: 1, message: 'Must be at least 1' } }}
                    render={({ field: { onChange, value, ...field } }) => (
                      <TextField
                        {...field}
                        value={value ?? ''}
                        label="Foil Cards"
                        type="number"
                        fullWidth
                        error={!!errors.targetQuantityFoil}
                        helperText={errors.targetQuantityFoil?.message}
                        onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    )}
                  />
                </Box>
              ) : (
                <Controller
                  name="targetQuantityAll"
                  control={control}
                  rules={{ 
                    required: 'Quantity is required',
                    min: { value: 1, message: 'Must be at least 1' }
                  }}
                  render={({ field: { onChange, value, ...field } }) => (
                    <TextField
                      {...field}
                      value={value ?? ''}
                      label="Any Type (Regular or Foil)"
                      type="number"
                      fullWidth
                      error={!!errors.targetQuantityAll}
                      helperText={errors.targetQuantityAll?.message}
                      onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  )}
                />
              )}
            </Box>

            <Alert severity="info">
              Goals are public and can be viewed by anyone visiting your collection.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isLoading}>
            Update Goal
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}