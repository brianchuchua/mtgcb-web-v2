import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  Switch,
  TextField,
  Typography,
  styled,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { GoalSearchForm } from './GoalSearchForm';
import { CardApiParams } from '@/api/browse/types';
import { useUpdateGoalMutation } from '@/api/goals/goalsApi';
import { Goal, UpdateGoalRequest } from '@/api/goals/types';
import { formatSearchCriteria } from '@/utils/goals/formatSearchCriteria';
import { useSetNames } from '@/utils/goals/useSetNames';

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
  const [isChangingMode, setIsChangingMode] = useState(false);
  const [searchConditions, setSearchConditions] = useState<
    Omit<CardApiParams, 'limit' | 'offset' | 'sortBy' | 'sortDirection'>
  >({});

  // Memoize the onChange handler to prevent infinite loops
  const handleSearchConditionsChange = useCallback(
    (conditions: Omit<CardApiParams, 'limit' | 'offset' | 'sortBy' | 'sortDirection'>) => {
      setSearchConditions(conditions);
    },
    [],
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    getValues,
    watch,
  } = useForm<FormValues>({
    defaultValues: {
      name: '',
      description: '',
      targetQuantityReg: undefined,
      targetQuantityFoil: undefined,
      targetQuantityAll: undefined,
      isActive: true,
    },
    mode: 'onChange',
    reValidateMode: 'onChange',
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

      const request: any = {
        name: data.name,
        description: data.description || undefined,
        searchCriteria,
        isActive: data.isActive,
      };

      if (quantityMode === 'all') {
        request.targetQuantityAll = data.targetQuantityAll;
        // Don't send the separate fields at all
      } else {
        // For separate mode, only send non-zero values
        if (data.targetQuantityReg && data.targetQuantityReg > 0) {
          request.targetQuantityReg = data.targetQuantityReg;
        }
        if (data.targetQuantityFoil && data.targetQuantityFoil > 0) {
          request.targetQuantityFoil = data.targetQuantityFoil;
        }
        // Don't send targetQuantityAll at all
      }

      await updateGoal({
        userId,
        goalId: goal.id,
        body: request,
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
        },
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
                <FormControlLabel control={<Switch {...field} checked={field.value} />} label="Active" />
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

              <GoalSearchForm searchConditions={searchConditions} onChange={handleSearchConditionsChange} />
            </Box>

            <Divider />

            <Box>
              <Typography variant="h6" gutterBottom>
                Goal Quantities
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Chip
                  label="Separate Regular/Foil"
                  onClick={() => {
                    setIsChangingMode(true);
                    setQuantityMode('separate');
                    // Clear the 'all' field when switching to separate mode
                    setValue('targetQuantityAll', undefined);
                    setTimeout(() => setIsChangingMode(false), 100);
                  }}
                  color={quantityMode === 'separate' ? 'primary' : 'default'}
                  sx={{ mr: 1 }}
                />
                <Chip
                  label="Any Type"
                  onClick={() => {
                    setIsChangingMode(true);
                    setQuantityMode('all');
                    // Clear the separate fields when switching to 'all' mode
                    setValue('targetQuantityReg', undefined);
                    setValue('targetQuantityFoil', undefined);
                    setTimeout(() => setIsChangingMode(false), 100);
                  }}
                  color={quantityMode === 'all' ? 'primary' : 'default'}
                />
              </Box>

              {quantityMode === 'separate' ? (
                <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center' }}>
                  <Controller
                    name="targetQuantityReg"
                    control={control}
                    rules={{
                      validate: (value) => {
                        // Skip validation when changing modes
                        if (isChangingMode) return true;
                        // Only validate if in separate mode
                        if (quantityMode !== 'separate') return true;
                        // Allow 0 or undefined, but at least one field must have a value
                        if (value !== undefined && value !== null && value < 0) return 'Cannot be negative';
                        const foilValue = getValues('targetQuantityFoil');
                        // If both are 0 or undefined/null, that's invalid
                        const regValue = value || 0;
                        const foilVal = foilValue || 0;
                        if (regValue === 0 && foilVal === 0) {
                          return 'At least one quantity is required';
                        }
                        return true;
                      },
                    }}
                    render={({ field: { onChange, value } }) => (
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1, textAlign: 'center' }}>
                          Regular Cards
                        </Typography>
                        <QuantityContainer>
                          <QuantityLeftButton
                            size="small"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.currentTarget.blur();
                              const currentVal = value || 0;
                              const newValue = Math.max(0, currentVal - 1);
                              // Set to 0 instead of undefined
                              onChange(newValue);
                            }}
                            disabled={!value || value === 0}
                            tabIndex={-1}
                            disableFocusRipple
                          >
                            <RemoveIcon />
                          </QuantityLeftButton>
                          <QuantityInput
                            type="number"
                            value={value === 0 ? '' : (value ?? '')}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '') {
                                onChange(0);
                              } else {
                                const num = parseInt(val);
                                onChange(isNaN(num) ? 0 : num);
                              }
                            }}
                            onFocus={(e) => e.target.select()}
                            inputProps={{ min: 0 }}
                            variant="outlined"
                            size="small"
                            error={!!errors.targetQuantityReg}
                          />
                          <QuantityRightButton
                            size="small"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.currentTarget.blur();
                              onChange((value || 0) + 1);
                            }}
                            tabIndex={-1}
                            disableFocusRipple
                          >
                            <AddIcon />
                          </QuantityRightButton>
                        </QuantityContainer>
                        {errors.targetQuantityReg && (
                          <Typography
                            variant="caption"
                            color="error"
                            sx={{ display: 'block', mt: 0.5, textAlign: 'center' }}
                          >
                            {errors.targetQuantityReg.message}
                          </Typography>
                        )}
                      </Box>
                    )}
                  />
                  <Controller
                    name="targetQuantityFoil"
                    control={control}
                    rules={{
                      validate: (value) => {
                        // Allow undefined/empty
                        if (value === undefined || value === '') return true;
                        if (value < 0) return 'Cannot be negative';
                        return true;
                      },
                    }}
                    render={({ field: { onChange, value } }) => (
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1, textAlign: 'center' }}>
                          Foil Cards
                        </Typography>
                        <QuantityContainer>
                          <QuantityLeftButton
                            size="small"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.currentTarget.blur();
                              const currentVal = value || 0;
                              const newValue = Math.max(0, currentVal - 1);
                              // Set to 0 instead of undefined
                              onChange(newValue);
                            }}
                            disabled={!value || value === 0}
                            tabIndex={-1}
                            disableFocusRipple
                          >
                            <RemoveIcon />
                          </QuantityLeftButton>
                          <QuantityInput
                            type="number"
                            value={value === 0 ? '' : (value ?? '')}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '') {
                                onChange(0);
                              } else {
                                const num = parseInt(val);
                                onChange(isNaN(num) ? 0 : num);
                              }
                            }}
                            onFocus={(e) => e.target.select()}
                            inputProps={{ min: 0 }}
                            variant="outlined"
                            size="small"
                            error={!!errors.targetQuantityFoil}
                          />
                          <QuantityRightButton
                            size="small"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.currentTarget.blur();
                              onChange((value || 0) + 1);
                            }}
                            tabIndex={-1}
                            disableFocusRipple
                          >
                            <AddIcon />
                          </QuantityRightButton>
                        </QuantityContainer>
                        {errors.targetQuantityFoil && (
                          <Typography
                            variant="caption"
                            color="error"
                            sx={{ display: 'block', mt: 0.5, textAlign: 'center' }}
                          >
                            {errors.targetQuantityFoil.message}
                          </Typography>
                        )}
                      </Box>
                    )}
                  />
                </Box>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Controller
                    name="targetQuantityAll"
                    control={control}
                    rules={{
                      validate: (value) => {
                        // Only validate if in 'all' mode
                        if (quantityMode !== 'all') return true;
                        if (value === undefined || value === null || value === '') {
                          return 'Quantity is required';
                        }
                        if (value < 1) return 'Must be at least 1';
                        return true;
                      },
                    }}
                    render={({ field: { onChange, value } }) => (
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1, textAlign: 'center' }}>
                          Any Type (Regular or Foil)
                        </Typography>
                        <QuantityContainer>
                          <QuantityLeftButton
                            size="small"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.currentTarget.blur();
                              const currentVal = value || 0;
                              const newValue = Math.max(0, currentVal - 1);
                              // Explicitly set to undefined when reaching 0
                              if (newValue === 0) {
                                onChange(undefined);
                              } else {
                                onChange(newValue);
                              }
                            }}
                            disabled={!value || value === 0}
                            tabIndex={-1}
                            disableFocusRipple
                          >
                            <RemoveIcon />
                          </QuantityLeftButton>
                          <QuantityInput
                            type="number"
                            value={value === 0 ? '' : (value ?? '')}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '') {
                                onChange(0);
                              } else {
                                const num = parseInt(val);
                                onChange(isNaN(num) ? 0 : num);
                              }
                            }}
                            onFocus={(e) => e.target.select()}
                            inputProps={{ min: 0 }}
                            variant="outlined"
                            size="small"
                            error={!!errors.targetQuantityAll}
                          />
                          <QuantityRightButton
                            size="small"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.currentTarget.blur();
                              onChange((value || 0) + 1);
                            }}
                            tabIndex={-1}
                            disableFocusRipple
                          >
                            <AddIcon />
                          </QuantityRightButton>
                        </QuantityContainer>
                        {errors.targetQuantityAll && (
                          <Typography
                            variant="caption"
                            color="error"
                            sx={{ display: 'block', mt: 0.5, textAlign: 'center' }}
                          >
                            {errors.targetQuantityAll.message}
                          </Typography>
                        )}
                      </Box>
                    )}
                  />
                </Box>
              )}
            </Box>

            <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Goal Summary
              </Typography>
              <GoalPreview
                searchConditions={searchConditions}
                quantityMode={quantityMode}
                targetQuantityReg={watch('targetQuantityReg')}
                targetQuantityFoil={watch('targetQuantityFoil')}
                targetQuantityAll={watch('targetQuantityAll')}
              />
            </Box>
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

// Styled components for quantity picker
const QuantityContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  '&:focus-within': {
    '& button': {
      borderColor: theme.palette.primary.main,
    },
  },
}));

const QuantityInput = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-input': {
    padding: '6px 12px',
    textAlign: 'center',
    fontSize: '0.875rem',
    height: '28px',
    boxSizing: 'border-box',
  },
  '& .MuiOutlinedInput-root': {
    height: '40px',
    borderRadius: 0,
    '& fieldset': {
      borderLeft: 'none',
      borderRight: 'none',
      borderColor: theme.palette.divider,
      transition: 'border-color 0.2s',
    },
    '&:hover fieldset': {
      borderColor: theme.palette.divider,
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main,
      borderWidth: 1,
    },
  },
  '& input[type="number"]::-webkit-inner-spin-button, & input[type="number"]::-webkit-outer-spin-button': {
    WebkitAppearance: 'none',
    margin: 0,
  },
  '& input[type="number"]': {
    MozAppearance: 'textfield',
  },
  width: '80px',
}));

const QuantityButton = styled(IconButton)(({ theme }) => ({
  padding: '8px',
  height: '40px',
  width: '40px',
  borderRadius: 0,
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  transition: 'all 0.2s',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    borderColor: theme.palette.divider,
  },
  '&.Mui-disabled': {
    borderColor: theme.palette.divider,
  },
  '& .MuiSvgIcon-root': {
    fontSize: '1.2rem',
  },
}));

const QuantityLeftButton = styled(QuantityButton)(({ theme }) => ({
  borderTopLeftRadius: theme.shape.borderRadius,
  borderBottomLeftRadius: theme.shape.borderRadius,
  borderRight: 'none',
}));

const QuantityRightButton = styled(QuantityButton)(({ theme }) => ({
  borderTopRightRadius: theme.shape.borderRadius,
  borderBottomRightRadius: theme.shape.borderRadius,
  borderLeft: 'none',
}));

function GoalPreview({
  searchConditions,
  quantityMode,
  targetQuantityReg,
  targetQuantityFoil,
  targetQuantityAll,
}: {
  searchConditions: Omit<CardApiParams, 'limit' | 'offset' | 'sortBy' | 'sortDirection'>;
  quantityMode: 'separate' | 'all';
  targetQuantityReg?: number;
  targetQuantityFoil?: number;
  targetQuantityAll?: number;
}) {
  // Extract set IDs from the search conditions
  const { includedSetIds, excludedSetIds } = useMemo(() => {
    const included = searchConditions.setId?.OR || [];
    const excluded: string[] = [];

    if (searchConditions.setId?.AND) {
      searchConditions.setId.AND.forEach((condition: string) => {
        if (condition.startsWith('!=')) {
          excluded.push(condition.substring(2));
        }
      });
    }

    return {
      includedSetIds: included.length > 0 ? included : undefined,
      excludedSetIds: excluded.length > 0 ? excluded : undefined,
    };
  }, [searchConditions]);

  // Get names for both included and excluded sets
  const allSetIds = useMemo(() => {
    const ids = [...(includedSetIds || []), ...(excludedSetIds || [])];
    return ids.length > 0 ? ids : undefined;
  }, [includedSetIds, excludedSetIds]);

  const { setNames } = useSetNames(allSetIds);

  const description = useMemo(() => {
    const criteriaText = formatSearchCriteria({
      conditions: searchConditions,
      sort: undefined,
      order: undefined,
    });

    // Determine quantity text
    let quantityText = '';
    if (quantityMode === 'all' && targetQuantityAll) {
      quantityText = `${targetQuantityAll}x of`;
    } else if (quantityMode === 'separate') {
      if (targetQuantityReg && targetQuantityFoil) {
        quantityText = `${targetQuantityReg}x regular and ${targetQuantityFoil}x foil of`;
      } else if (targetQuantityReg) {
        quantityText = `${targetQuantityReg}x regular of`;
      } else if (targetQuantityFoil) {
        quantityText = `${targetQuantityFoil}x foil of`;
      } else {
        quantityText = '? of';
      }
    } else {
      quantityText = '? of';
    }

    // Replace "from specific sets" with actual set names
    let finalText = `${quantityText} ${criteriaText}`;

    if (includedSetIds && includedSetIds.length > 0 && Object.keys(setNames).length > 0) {
      const setNamesList = includedSetIds
        .map((id: string) => setNames[id])
        .filter(Boolean)
        .join(', ');

      if (setNamesList) {
        finalText = finalText.replace('from specific sets', `from ${setNamesList}`);
      }
    }

    // Replace "excluding X sets" with actual excluded set names
    if (excludedSetIds && excludedSetIds.length > 0 && Object.keys(setNames).length > 0) {
      const excludedSetNamesList = excludedSetIds
        .map((id: string) => setNames[id])
        .filter(Boolean)
        .join(', ');

      if (excludedSetNamesList) {
        const excludedCount = excludedSetIds.length;
        const pattern = `excluding ${excludedCount} set${excludedCount > 1 ? 's' : ''}`;
        finalText = finalText.replace(pattern, `excluding ${excludedSetNamesList}`);
      }
    }

    return finalText;
  }, [
    searchConditions,
    quantityMode,
    targetQuantityReg,
    targetQuantityFoil,
    targetQuantityAll,
    setNames,
    includedSetIds,
    excludedSetIds,
  ]);

  return (
    <Typography variant="body2" color="text.secondary">
      {description}
    </Typography>
  );
}
