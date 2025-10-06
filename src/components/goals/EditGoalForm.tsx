import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  Divider,
  FormControlLabel,
  IconButton,
  LinearProgress,
  Switch,
  TextField,
  Typography,
  styled,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { DeleteGoalDialog } from './DeleteGoalDialog';
import { GoalSearchForm } from './GoalSearchForm';
import { CardApiParams } from '@/api/browse/types';
import { useUpdateGoalMutation } from '@/api/goals/goalsApi';
import { Goal, UpdateGoalRequest } from '@/api/goals/types';
import { Button } from '@/components/ui/button';
import { useDeleteGoal } from '@/hooks/goals/useDeleteGoal';
import { trimFormData } from '@/utils/form/trimFormData';
import { formatSearchCriteria } from '@/utils/goals/formatSearchCriteria';
import { useSetNames } from '@/utils/goals/useSetNames';

interface EditGoalFormProps {
  goal: Goal;
  userId: number;
  onClose: () => void;
  onSuccess: (goal: Goal) => void;
  onDeleteStart?: () => void;
}

interface FormValues {
  name: string;
  description: string;
  targetQuantityReg?: number;
  targetQuantityFoil?: number;
  targetQuantityAll?: number;
  isActive: boolean;
}

export function EditGoalForm({ goal, userId, onClose, onSuccess, onDeleteStart }: EditGoalFormProps) {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [updateGoal, { isLoading }] = useUpdateGoalMutation();
  const { isDeleting, deleteDialogOpen, goalToDelete, handleDeleteClick, handleConfirmDelete, handleCancelDelete } =
    useDeleteGoal(userId, {
      onSuccess: () => {
        onDeleteStart?.();
        router.push('/goals');
      },
    });
  const [quantityMode, setQuantityMode] = useState<'separate' | 'all'>(goal?.targetQuantityAll ? 'all' : 'separate');
  const [isChangingMode, setIsChangingMode] = useState(false);
  const [searchConditions, setSearchConditions] = useState<
    Omit<CardApiParams, 'limit' | 'offset' | 'sortBy' | 'sortDirection'>
  >({});
  const [onePrintingPerPureName, setOnePrintingPerPureName] = useState(true);
  const [flexibleFinishes, setFlexibleFinishes] = useState(false);
  const [includeSetsOutsideGoal, setIncludeSetsOutsideGoal] = useState(false);

  const handleSearchConditionsChange = useCallback(
    (conditions: Omit<CardApiParams, 'limit' | 'offset' | 'sortBy' | 'sortDirection'>) => {
      setSearchConditions(conditions);
    },
    [],
  );

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitted },
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

  useEffect(() => {
    if (goal) {
      setValue('name', goal.name);
      setValue('description', goal.description || '');
      setValue('targetQuantityReg', goal.targetQuantityReg ?? undefined);
      setValue('targetQuantityFoil', goal.targetQuantityFoil ?? undefined);
      setValue('targetQuantityAll', goal.targetQuantityAll ?? undefined);
      setValue('isActive', goal.isActive);

      if (goal.targetQuantityAll) {
        setQuantityMode('all');
      } else {
        setQuantityMode('separate');
      }

      setSearchConditions(goal.searchCriteria.conditions);
      setOnePrintingPerPureName(goal.onePrintingPerPureName ?? true);
      setFlexibleFinishes(goal.flexibleFinishes ?? false);
      setIncludeSetsOutsideGoal(goal.includeSetsOutsideGoal ?? false);
    }
  }, [goal, setValue]);

  const onSubmit = async (data: FormValues) => {
    if (!goal) return;

    try {
      const trimmedData = trimFormData(data);
      const searchCriteria = {
        conditions: searchConditions,
        sort: goal.searchCriteria.sort,
        order: goal.searchCriteria.order,
      };

      const hasSetIdFilter = searchConditions.setId && (
        (searchConditions.setId.OR && searchConditions.setId.OR.length > 0) ||
        (searchConditions.setId.AND && searchConditions.setId.AND.length > 0)
      );

      const request: any = {
        name: trimmedData.name,
        description: trimmedData.description || undefined,
        searchCriteria,
        isActive: trimmedData.isActive,
        onePrintingPerPureName,
        includeSetsOutsideGoal: onePrintingPerPureName && includeSetsOutsideGoal && hasSetIdFilter ? true : false,
      };

      if (quantityMode === 'all') {
        request.targetQuantityAll = data.targetQuantityAll;
      } else {
        if (data.targetQuantityReg && data.targetQuantityReg > 0) {
          request.targetQuantityReg = data.targetQuantityReg;
        }
        if (data.targetQuantityFoil && data.targetQuantityFoil > 0) {
          request.targetQuantityFoil = data.targetQuantityFoil;
        }
        if (data.targetQuantityReg && data.targetQuantityFoil) {
          request.flexibleFinishes = flexibleFinishes;
        }
      }

      await updateGoal({
        userId,
        goalId: goal.id,
        body: request,
      }).unwrap();

      enqueueSnackbar('Goal updated successfully!', { variant: 'success' });
      onSuccess(goal);
    } catch (error: any) {
      enqueueSnackbar(error?.data?.error?.message || 'Failed to update goal', { variant: 'error' });
    }
  };

  return (
    <>
      <Dialog
        open={isLoading}
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: { xs: '90%', sm: 400 },
          },
        }}
      >
        <DialogContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            py: 4,
            px: 3,
          }}
        >
          <CircularProgress size={56} sx={{ mb: 3 }} />
          <Typography variant="h6" gutterBottom>
            Recompiling Goal
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
            Your updated goal is being recompiled to optimize performance. This one-time process may take 5-10 seconds
            for complex search criteria.
          </Typography>
          <LinearProgress sx={{ width: '100%', maxWidth: 300 }} />
        </DialogContent>
      </Dialog>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
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
                disabled={isLoading}
                slotProps={{
                  htmlInput: {
                    maxLength: 255,
                  },
                }}
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
                disabled={isLoading}
                slotProps={{
                  htmlInput: {
                    maxLength: 1000,
                    spellCheck: 'true',
                    autoCapitalize: 'sentences',
                  },
                }}
              />
            )}
          />

          <Controller
            name="isActive"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={<Switch {...field} checked={field.value} disabled={isLoading} />}
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
              onePrintingPerPureName={onePrintingPerPureName}
              onOnePrintingPerPureNameChange={setOnePrintingPerPureName}
              includeSetsOutsideGoal={includeSetsOutsideGoal}
              onIncludeSetsOutsideGoalChange={setIncludeSetsOutsideGoal}
            />
          </Box>

          <Divider />

          <Box>
            <Typography variant="h6" gutterBottom>
              Goal Quantities
            </Typography>
            <Box
              sx={{
                mb: 2,
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1,
              }}
            >
              <Chip
                label="Any Type"
                onClick={() => {
                  setIsChangingMode(true);
                  setQuantityMode('all');
                  setValue('targetQuantityReg', undefined);
                  setValue('targetQuantityFoil', undefined);
                  setTimeout(() => setIsChangingMode(false), 100);
                }}
                color={quantityMode === 'all' ? 'primary' : 'default'}
                disabled={isLoading}
              />
              <Chip
                label="Separate Regular/Foil"
                onClick={() => {
                  setIsChangingMode(true);
                  setQuantityMode('separate');
                  setValue('targetQuantityAll', undefined);
                  setTimeout(() => setIsChangingMode(false), 100);
                }}
                color={quantityMode === 'separate' ? 'primary' : 'default'}
                disabled={isLoading}
              />
            </Box>

            {quantityMode === 'separate' ? (
              <>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: 3,
                    justifyContent: 'center',
                    alignItems: { xs: 'center', sm: 'flex-start' },
                  }}
                >
                  <Controller
                    name="targetQuantityReg"
                    control={control}
                    rules={{
                      validate: (value) => {
                        if (isChangingMode) return true;
                        if (quantityMode !== 'separate') return true;
                        if (value !== undefined && value !== null && value < 0) return 'Cannot be negative';
                        const foilValue = getValues('targetQuantityFoil');
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
                              onChange(newValue);
                            }}
                            disabled={!value || Number(value) === 0 || isLoading}
                            tabIndex={-1}
                            disableFocusRipple
                            error={!!errors.targetQuantityReg}
                          >
                            <RemoveIcon />
                          </QuantityLeftButton>
                          <QuantityInput
                            type="number"
                            value={Number(value) === 0 ? '' : (value ?? '')}
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
                            disabled={isLoading}
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
                            error={!!errors.targetQuantityReg}
                            disabled={isLoading}
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
                      validate: (value: any) => {
                        if (!value && value !== 0) return true;
                        const numValue = Number(value);
                        if (isNaN(numValue) || numValue < 0) return 'Cannot be negative';
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
                              onChange(newValue);
                            }}
                            disabled={!value || Number(value) === 0 || isLoading}
                            tabIndex={-1}
                            disableFocusRipple
                            error={!!errors.targetQuantityFoil}
                          >
                            <RemoveIcon />
                          </QuantityLeftButton>
                          <QuantityInput
                            type="number"
                            value={Number(value) === 0 ? '' : (value ?? '')}
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
                            disabled={isLoading}
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
                            error={!!errors.targetQuantityFoil}
                            disabled={isLoading}
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
                {!!(watch('targetQuantityReg') && watch('targetQuantityFoil')) && (
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={flexibleFinishes}
                          onChange={(e) => setFlexibleFinishes(e.target.checked)}
                          disabled={isLoading}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2">Flexible Finishes</Typography>
                          <Typography variant="caption" color="text.secondary">
                            If toggled, includes cards even if they were ONLY printed in EITHER regular OR foil.
                          </Typography>
                        </Box>
                      }
                    />
                  </Box>
                )}
              </>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Controller
                  name="targetQuantityAll"
                  control={control}
                  rules={{
                    validate: (value: any) => {
                      if (quantityMode !== 'all') return true;
                      if (!value && value !== 0) {
                        return 'Quantity is required';
                      }
                      const numValue = Number(value);
                      if (isNaN(numValue) || numValue < 1) return 'Must be at least 1';
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
                            if (newValue === 0) {
                              onChange(undefined);
                            } else {
                              onChange(newValue);
                            }
                          }}
                          disabled={!value || Number(value) === 0 || isLoading}
                          tabIndex={-1}
                          disableFocusRipple
                          error={!!errors.targetQuantityAll}
                        >
                          <RemoveIcon />
                        </QuantityLeftButton>
                        <QuantityInput
                          type="number"
                          value={Number(value) === 0 ? '' : (value ?? '')}
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
                          disabled={isLoading}
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
                          error={!!errors.targetQuantityAll}
                          disabled={isLoading}
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
              onePrintingPerPureName={onePrintingPerPureName}
              flexibleFinishes={flexibleFinishes}
              includeSetsOutsideGoal={includeSetsOutsideGoal}
            />
          </Box>

          {isSubmitted && Object.keys(errors).length > 0 && (
            <Alert severity="error">
              <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 1 }}>
                Please fix the following errors:
              </Typography>
              {errors.name && <Typography variant="body2">• Goal name: {errors.name.message}</Typography>}
              {errors.description && (
                <Typography variant="body2">• Description: {errors.description.message}</Typography>
              )}
              {errors.targetQuantityReg && (
                <Typography variant="body2">• Regular quantity: {errors.targetQuantityReg.message}</Typography>
              )}
              {errors.targetQuantityFoil && (
                <Typography variant="body2">• Foil quantity: {errors.targetQuantityFoil.message}</Typography>
              )}
              {errors.targetQuantityAll && (
                <Typography variant="body2">• Quantity: {errors.targetQuantityAll.message}</Typography>
              )}
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
            <Button
              variant="contained"
              color="error"
              onClick={() => handleDeleteClick(goal)}
              disabled={isLoading || isDeleting}
            >
              Delete
            </Button>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" isSubmitting={isLoading} disabled={isDeleting}>
                {isLoading ? 'Updating Goal...' : 'Update Goal'}
              </Button>
            </Box>
          </Box>
        </Box>

        <DeleteGoalDialog
          open={deleteDialogOpen}
          goalName={goal?.name || ''}
          isDeleting={isDeleting}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      </form>
    </>
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
    '&:hover:not(.Mui-error) fieldset': {
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

const QuantityButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== 'error',
})<{ error?: boolean }>(({ theme, error }) => ({
  padding: '8px',
  height: '40px',
  width: '40px',
  borderRadius: 0,
  border: `1px solid ${error ? theme.palette.error.main : theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  transition: 'all 0.2s',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    borderColor: error ? theme.palette.error.main : theme.palette.divider,
  },
  '&.Mui-disabled': {
    borderColor: error ? theme.palette.error.main : theme.palette.divider,
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
  onePrintingPerPureName,
  flexibleFinishes,
  includeSetsOutsideGoal,
}: {
  searchConditions: Omit<CardApiParams, 'limit' | 'offset' | 'sortBy' | 'sortDirection'>;
  quantityMode: 'separate' | 'all';
  targetQuantityReg?: number;
  targetQuantityFoil?: number;
  targetQuantityAll?: number;
  onePrintingPerPureName: boolean;
  flexibleFinishes: boolean;
  includeSetsOutsideGoal: boolean;
}) {
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

  const allSetIds = useMemo(() => {
    const ids = [...(includedSetIds || []), ...(excludedSetIds || [])];
    return ids.length > 0 ? ids : undefined;
  }, [includedSetIds, excludedSetIds]);

  const { setNames } = useSetNames(allSetIds);

  const description = useMemo(() => {
    const criteriaText = formatSearchCriteria(
      {
        conditions: searchConditions,
        sort: undefined,
        order: undefined,
      },
      onePrintingPerPureName,
    );

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

    let finalText = `${quantityText} ${criteriaText}`;

    if (quantityMode === 'separate' && targetQuantityReg && targetQuantityFoil) {
      if (flexibleFinishes) {
        finalText += ' (flexible finishes)';
      } else {
        finalText += ' (only cards printed as both normal and foil)';
      }
    }

    if (onePrintingPerPureName && includeSetsOutsideGoal) {
      finalText += ' (counting cards from all sets)';
    }

    if (includedSetIds && includedSetIds.length > 0 && Object.keys(setNames).length > 0) {
      const setNamesList = includedSetIds
        .map((id: string) => setNames[id])
        .filter(Boolean)
        .join(', ');

      if (setNamesList) {
        finalText = finalText.replace('from specific sets', `from ${setNamesList}`);
      }
    }

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
    onePrintingPerPureName,
    flexibleFinishes,
    includeSetsOutsideGoal,
  ]);

  return (
    <Typography variant="body2" color="text.secondary">
      {description}
    </Typography>
  );
}
