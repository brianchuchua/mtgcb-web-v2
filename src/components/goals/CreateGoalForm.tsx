import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import {
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  TextField,
  Typography,
  styled,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useCallback, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { GoalSearchForm } from './GoalSearchForm';
import { CardApiParams } from '@/api/browse/types';
import { useCreateGoalMutation } from '@/api/goals/goalsApi';
import { CreateGoalRequest } from '@/api/goals/types';
import { formatSearchCriteria } from '@/utils/goals/formatSearchCriteria';
import { useSetNames } from '@/utils/goals/useSetNames';

interface CreateGoalFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface FormValues {
  name: string;
  description: string;
  targetQuantityReg?: number;
  targetQuantityFoil?: number;
  targetQuantityAll?: number;
}

export function CreateGoalForm({ onClose, onSuccess }: CreateGoalFormProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [createGoal, { isLoading }] = useCreateGoalMutation();
  const [quantityMode, setQuantityMode] = useState<'separate' | 'all'>('all');
  const [searchConditions, setSearchConditions] = useState<
    Omit<CardApiParams, 'limit' | 'offset' | 'sortBy' | 'sortDirection'>
  >({});

  const handleSearchConditionsChange = useCallback(
    (conditions: Omit<CardApiParams, 'limit' | 'offset' | 'sortBy' | 'sortDirection'>) => {
      setSearchConditions(conditions);
    },
    [],
  );

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormValues>({
    defaultValues: {
      name: '',
      description: '',
      targetQuantityReg: undefined,
      targetQuantityFoil: undefined,
      targetQuantityAll: undefined,
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      const searchCriteria = {
        conditions: searchConditions,
        sort: undefined,
        order: undefined,
      };

      const request: CreateGoalRequest = {
        name: data.name,
        description: data.description || undefined,
        searchCriteria,
      };

      if (quantityMode === 'all') {
        request.targetQuantityAll = data.targetQuantityAll;
      } else {
        if (data.targetQuantityReg) request.targetQuantityReg = data.targetQuantityReg;
        if (data.targetQuantityFoil) request.targetQuantityFoil = data.targetQuantityFoil;
      }

      await createGoal(request).unwrap();

      enqueueSnackbar('Goal created successfully!', { variant: 'success' });
      onSuccess();
    } catch (error: any) {
      enqueueSnackbar(error?.data?.error?.message || 'Failed to create goal', { variant: 'error' });
    }
  };

  return (
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
          <Box 
            sx={{ 
              mb: 2,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1
            }}
          >
            <Chip
              label="Any Type"
              onClick={() => setQuantityMode('all')}
              color={quantityMode === 'all' ? 'primary' : 'default'}
            />
            <Chip
              label="Separate Regular/Foil"
              onClick={() => setQuantityMode('separate')}
              color={quantityMode === 'separate' ? 'primary' : 'default'}
            />
          </Box>

          {quantityMode === 'separate' ? (
            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 3, 
                justifyContent: 'center',
                alignItems: { xs: 'center', sm: 'flex-start' }
              }}
            >
              <Controller
                name="targetQuantityReg"
                control={control}
                rules={{
                  min: { value: 1, message: 'Must be at least 1' },
                  validate: (value, formValues) =>
                    value || formValues.targetQuantityFoil ? true : 'At least one quantity is required',
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
                          onChange(Math.max(0, (value || 0) - 1) || undefined);
                        }}
                        disabled={!value || value === 0}
                        tabIndex={-1}
                        disableFocusRipple
                      >
                        <RemoveIcon />
                      </QuantityLeftButton>
                      <QuantityInput
                        type="number"
                        value={value ?? ''}
                        onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : undefined)}
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
                rules={{ min: { value: 1, message: 'Must be at least 1' } }}
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
                          onChange(Math.max(0, (value || 0) - 1) || undefined);
                        }}
                        disabled={!value || value === 0}
                        tabIndex={-1}
                        disableFocusRipple
                      >
                        <RemoveIcon />
                      </QuantityLeftButton>
                      <QuantityInput
                        type="number"
                        value={value ?? ''}
                        onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : undefined)}
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
                  required: 'Quantity is required',
                  min: { value: 1, message: 'Must be at least 1' },
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
                          onChange(Math.max(0, (value || 0) - 1) || undefined);
                        }}
                        disabled={!value || value === 0}
                        tabIndex={-1}
                        disableFocusRipple
                      >
                        <RemoveIcon />
                      </QuantityLeftButton>
                      <QuantityInput
                        type="number"
                        value={value ?? ''}
                        onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : undefined)}
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

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isLoading}>
            Create Goal
          </Button>
        </Box>
      </Box>
    </form>
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
    const criteriaText = formatSearchCriteria({
      conditions: searchConditions,
      sort: undefined,
      order: undefined,
    });

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
  ]);

  return (
    <Typography variant="body2" color="text.secondary">
      {description}
    </Typography>
  );
}