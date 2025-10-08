'use client';

import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RemoveIcon from '@mui/icons-material/Remove';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  TextField,
  Tooltip,
  Typography,
  styled,
} from '@mui/material';
import debounce from 'lodash.debounce';
import { useSnackbar } from 'notistack';
import React, { useCallback, useEffect, useState } from 'react';
import { useUpdateCollectionMutation } from '@/api/collections/collectionsApi';

const QuantityContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'stretch',
  '&:focus-within': {
    '& button': {
      borderColor: theme.palette.primary.main,
    },
  },
  // Ensure consistent width when stacked vertically
  '@container card (max-width: 280px)': {
    width: '140px',
  },
}));

const QuantityInput = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-input': {
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
    width: '50px',
    textAlign: 'center',
    fontSize: '0.875rem',
  },
  '& .MuiInputLabel-root': {
    left: '50%',
    transform: 'translate(-50%, 16px) scale(1)',
    transformOrigin: 'center',
    '&.MuiInputLabel-shrink': {
      transform: 'translate(-50%, -9px) scale(0.75)',
      maxWidth: 'calc(133% - 16px)',
    },
  },
  '& .MuiOutlinedInput-notchedOutline legend': {
    marginLeft: 'auto',
    marginRight: 'auto',
    textAlign: 'center',
  },
  '& .MuiOutlinedInput-root': {
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
    '&.Mui-disabled fieldset': {
      borderColor: theme.palette.divider,
    },
    '&.Mui-error fieldset': {
      borderColor: theme.palette.error.main,
    },
    '&.Mui-error:hover fieldset': {
      borderColor: theme.palette.error.main,
    },
    '&.Mui-error.Mui-focused fieldset': {
      borderColor: theme.palette.error.main,
    },
    '&.Mui-error.Mui-disabled fieldset': {
      borderColor: theme.palette.error.main,
    },
  },
  '& input[type="number"]::-webkit-inner-spin-button, & input[type="number"]::-webkit-outer-spin-button': {
    WebkitAppearance: 'none',
    margin: 0,
  },
  '& input[type="number"]': {
    MozAppearance: 'textfield',
  },
}));

const QuantityButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== '$error',
})<{ $error?: boolean }>(({ theme, $error }) => ({
  padding: theme.spacing(1),
  width: '35px',
  borderRadius: 0,
  border: `1px solid ${$error ? theme.palette.error.main : theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  transition: 'border-color 0.2s, background-color 0.2s',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    borderColor: $error ? theme.palette.error.main : theme.palette.divider,
  },
  '&.Mui-disabled': {
    borderColor: $error ? theme.palette.error.main : theme.palette.divider,
  },
  '& .MuiSvgIcon-root': {
    fontSize: '1.1rem',
  },
}));

const LeftButton = styled(QuantityButton)(({ theme }) => ({
  borderTopLeftRadius: theme.shape.borderRadius,
  borderBottomLeftRadius: theme.shape.borderRadius,
  borderRight: 'none',
}));

const RightButton = styled(QuantityButton)(({ theme }) => ({
  borderTopRightRadius: theme.shape.borderRadius,
  borderBottomRightRadius: theme.shape.borderRadius,
  borderLeft: 'none',
}));

interface EditableCardQuantityProps {
  cardId: number;
  cardName: string;
  quantityReg: number;
  quantityFoil: number;
  canBeNonFoil?: boolean;
  canBeFoil?: boolean;
  readOnly?: boolean;
}

export const EditableCardQuantity: React.FC<EditableCardQuantityProps> = ({
  cardId,
  cardName,
  quantityReg,
  quantityFoil,
  canBeNonFoil = true,
  canBeFoil = true,
  readOnly = false,
}) => {
  const [localQuantityReg, setLocalQuantityReg] = useState(quantityReg);
  const [localQuantityFoil, setLocalQuantityFoil] = useState(quantityFoil);
  const [inputValueReg, setInputValueReg] = useState(quantityReg.toString());
  const [inputValueFoil, setInputValueFoil] = useState(quantityFoil.toString());
  const [isLoadingReg, setIsLoadingReg] = useState(false);
  const [isLoadingFoil, setIsLoadingFoil] = useState(false);
  const [showSuccessReg, setShowSuccessReg] = useState(false);
  const [showSuccessFoil, setShowSuccessFoil] = useState(false);
  const [overrideNonFoil, setOverrideNonFoil] = useState(false);
  const [overrideFoil, setOverrideFoil] = useState(false);
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [overrideDialogType, setOverrideDialogType] = useState<'regular' | 'foil'>('regular');
  const [updateCollection] = useUpdateCollectionMutation();
  const { enqueueSnackbar } = useSnackbar();
  const updatePromiseRef = React.useRef<{ abort: () => void } | null>(null);
  const isUserEditingRef = React.useRef(false);
  const editingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (editingTimeoutRef.current) {
        clearTimeout(editingTimeoutRef.current);
      }
    };
  }, []);

  // Update local state when props change - but only if user is not actively editing
  useEffect(() => {
    if (!isUserEditingRef.current) {
      setLocalQuantityReg(quantityReg);
      setLocalQuantityFoil(quantityFoil);
      setInputValueReg(quantityReg.toString());
      setInputValueFoil(quantityFoil.toString());
    }
  }, [quantityReg, quantityFoil]);

  // Create debounced update function
  const debouncedUpdate = useCallback(
    debounce(async (newQuantityReg: number, newQuantityFoil: number, changedType: 'regular' | 'foil') => {
      // Cancel any pending request
      if (updatePromiseRef.current) {
        updatePromiseRef.current.abort();
      }

      // Set loading state
      if (changedType === 'regular') {
        setIsLoadingReg(true);
        setShowSuccessReg(false);
      } else {
        setIsLoadingFoil(true);
        setShowSuccessFoil(false);
      }

      try {
        const promise = updateCollection({
          mode: 'set',
          cards: [
            {
              cardId,
              quantityReg: newQuantityReg,
              quantityFoil: newQuantityFoil,
            },
          ],
        });

        // Store the promise so we can abort it later
        updatePromiseRef.current = promise;

        const result = await promise.unwrap();

        if (result.success) {
          // Set success state - persists until page navigation
          if (changedType === 'regular') {
            setIsLoadingReg(false);
            setShowSuccessReg(true);
          } else {
            setIsLoadingFoil(false);
            setShowSuccessFoil(true);
          }

          // Success is now shown inline with checkmark icon
        } else {
          // Clear loading state on error
          if (changedType === 'regular') {
            setIsLoadingReg(false);
          } else {
            setIsLoadingFoil(false);
          }
          enqueueSnackbar(`Failed to update ${cardName}`, { variant: 'error' });
        }
      } catch (error: any) {
        // Clear loading state on error
        if (changedType === 'regular') {
          setIsLoadingReg(false);
        } else {
          setIsLoadingFoil(false);
        }
        // Don't show error for aborted requests
        if (error.name !== 'AbortError' && error.message !== 'Aborted') {
          enqueueSnackbar(`Error updating ${cardName}`, { variant: 'error' });
        }
      }
    }, 400),
    [cardId, cardName, updateCollection, enqueueSnackbar],
  );

  const handleQuantityChange = (type: 'regular' | 'foil', value: number) => {
    const newValue = Math.max(0, value);

    // Mark as user editing
    isUserEditingRef.current = true;

    // Clear any existing timeout
    if (editingTimeoutRef.current) {
      clearTimeout(editingTimeoutRef.current);
    }

    // Set timeout to clear editing flag after updates are likely done
    editingTimeoutRef.current = setTimeout(() => {
      isUserEditingRef.current = false;
    }, 2000); // 2 seconds should be enough for debounce + API + cache invalidation

    if (type === 'regular') {
      setLocalQuantityReg(newValue);
      debouncedUpdate(newValue, localQuantityFoil, 'regular');
    } else {
      setLocalQuantityFoil(newValue);
      debouncedUpdate(localQuantityReg, newValue, 'foil');
    }
  };

  const handleIncrement = (type: 'regular' | 'foil', event: React.MouseEvent<HTMLButtonElement>) => {
    event.currentTarget.blur();
    if (type === 'regular') {
      const newValue = localQuantityReg + 1;
      setInputValueReg(newValue.toString());
      handleQuantityChange('regular', newValue);
    } else {
      const newValue = localQuantityFoil + 1;
      setInputValueFoil(newValue.toString());
      handleQuantityChange('foil', newValue);
    }
  };

  const handleDecrement = (type: 'regular' | 'foil', event: React.MouseEvent<HTMLButtonElement>) => {
    event.currentTarget.blur();
    if (type === 'regular') {
      const newValue = Math.max(0, localQuantityReg - 1);
      setInputValueReg(newValue.toString());
      handleQuantityChange('regular', newValue);
    } else {
      const newValue = Math.max(0, localQuantityFoil - 1);
      setInputValueFoil(newValue.toString());
      handleQuantityChange('foil', newValue);
    }
  };

  const handleInputChange = (type: 'regular' | 'foil', event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;

    // Update the input display value
    if (type === 'regular') {
      setInputValueReg(inputValue);
    } else {
      setInputValueFoil(inputValue);
    }

    // Allow empty string without updating the actual quantity
    if (inputValue === '') {
      return; // Don't trigger the API call yet
    }

    const value = parseInt(inputValue) || 0;
    handleQuantityChange(type, value);
  };

  const handleInputBlur = (type: 'regular' | 'foil', event: React.FocusEvent<HTMLInputElement>) => {
    const inputValue = type === 'regular' ? inputValueReg : inputValueFoil;

    // If empty, set to 0
    if (inputValue === '') {
      const newValue = 0;
      if (type === 'regular') {
        setLocalQuantityReg(newValue);
        setInputValueReg('0');
        debouncedUpdate(newValue, localQuantityFoil, 'regular');
      } else {
        setLocalQuantityFoil(newValue);
        setInputValueFoil('0');
        debouncedUpdate(localQuantityReg, newValue, 'foil');
      }
    } else {
      // Ensure the display value matches the numeric value
      const numValue = parseInt(inputValue) || 0;
      if (type === 'regular') {
        setInputValueReg(numValue.toString());
      } else {
        setInputValueFoil(numValue.toString());
      }
    }
  };

  const handleInputFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    // Select all text on focus - use currentTarget which is always the input
    event.currentTarget.select();
  };

  const handleDisabledFieldClick = (type: 'regular' | 'foil') => {
    setOverrideDialogType(type);
    setShowOverrideDialog(true);
  };

  const handleOverrideConfirm = () => {
    if (overrideDialogType === 'regular') {
      setOverrideNonFoil(true);
    } else {
      setOverrideFoil(true);
    }
    setShowOverrideDialog(false);
  };

  const handleOverrideCancel = () => {
    setShowOverrideDialog(false);
  };

  // Determine error states and disabled states
  const regularHasError = !canBeNonFoil && !overrideNonFoil && localQuantityReg > 0;
  const foilHasError = !canBeFoil && !overrideFoil && localQuantityFoil > 0;
  const isRegularDisabled = readOnly || (!canBeNonFoil && !overrideNonFoil);
  const isFoilDisabled = readOnly || (!canBeFoil && !overrideFoil);

  return (
    <Box
      display="flex"
      gap={1}
      justifyContent="center"
      sx={{
        mt: 0.5,
        flexDirection: 'row',
        // Use container query to stack vertically when card is narrow
        '@container card (max-width: 280px)': {
          flexDirection: 'column',
          alignItems: 'center',
        },
      }}
    >
      <QuantityContainer
        onClick={(e) => {
          if (isRegularDisabled && !readOnly && !canBeNonFoil && !overrideNonFoil) {
            e.preventDefault();
            e.stopPropagation();
            handleDisabledFieldClick('regular');
          }
        }}
        sx={{
          cursor: isRegularDisabled && !readOnly && !canBeNonFoil && !overrideNonFoil ? 'pointer' : undefined,
        }}
      >
        <Box component="span" sx={{ display: 'inline-flex' }}>
          <LeftButton
            size="small"
            onMouseDown={(e) => {
              e.preventDefault();
              handleDecrement('regular', e);
            }}
            disabled={readOnly || localQuantityReg === 0}
            tabIndex={-1}
            disableFocusRipple
            $error={regularHasError}
          >
            <RemoveIcon sx={{ visibility: readOnly ? 'hidden' : 'visible' }} />
          </LeftButton>
        </Box>
        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            flex: 1,
          }}
        >
            <QuantityInput
              type="number"
              value={inputValueReg}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('regular', e)}
              onBlur={(e: React.FocusEvent<HTMLInputElement>) => handleInputBlur('regular', e)}
              onFocus={handleInputFocus}
              onClick={(e) => {
                if (!isRegularDisabled) {
                  (e.currentTarget.querySelector('input') as HTMLInputElement)?.select();
                }
              }}
              inputProps={{ min: 0 }}
              variant="outlined"
              size="small"
              label={
                <Box display="flex" alignItems="center" gap={0.25}>
                  Regular
                  {isLoadingReg && <CircularProgress size={12} thickness={5} sx={{ color: 'primary.main' }} />}
                  {showSuccessReg && <CheckCircleIcon sx={{ fontSize: '0.875rem', color: 'inherit' }} />}
                </Box>
              }
              InputLabelProps={{ shrink: true }}
              disabled={isRegularDisabled}
              error={regularHasError}
            />
            {isRegularDisabled && !readOnly && !canBeNonFoil && !overrideNonFoil && (
              <Box
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDisabledFieldClick('regular');
                }}
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  cursor: 'pointer',
                  zIndex: 1,
                }}
              />
            )}
          </Box>
        <Tooltip
          title={
            !canBeNonFoil && !overrideNonFoil
              ? regularHasError
                ? "This card doesn't come in non-foil. You can only reduce the quantity. (Click to override.)"
                : "This card doesn't come in non-foil. (Click to override.)"
              : ''
          }
          placement="top"
          disableHoverListener={canBeNonFoil || overrideNonFoil}
          disableFocusListener={canBeNonFoil || overrideNonFoil}
          disableTouchListener={canBeNonFoil || overrideNonFoil}
        >
          <Box component="span" sx={{ display: 'inline-flex' }}>
            <RightButton
              size="small"
              onMouseDown={(e) => {
                e.preventDefault();
                if (isRegularDisabled && !readOnly && !canBeNonFoil && !overrideNonFoil) {
                  handleDisabledFieldClick('regular');
                } else {
                  handleIncrement('regular', e);
                }
              }}
              tabIndex={-1}
              disableFocusRipple
              disabled={isRegularDisabled}
              $error={regularHasError}
              sx={{
                cursor: isRegularDisabled && !readOnly && !canBeNonFoil && !overrideNonFoil ? 'pointer' : undefined,
              }}
            >
              <AddIcon sx={{ visibility: readOnly ? 'hidden' : 'visible' }} />
            </RightButton>
          </Box>
        </Tooltip>
      </QuantityContainer>

      <QuantityContainer
        onClick={(e) => {
          if (isFoilDisabled && !readOnly && !canBeFoil && !overrideFoil) {
            e.preventDefault();
            e.stopPropagation();
            handleDisabledFieldClick('foil');
          }
        }}
        sx={{
          cursor: isFoilDisabled && !readOnly && !canBeFoil && !overrideFoil ? 'pointer' : undefined,
        }}
      >
        <Box component="span" sx={{ display: 'inline-flex' }}>
          <LeftButton
            size="small"
            onMouseDown={(e) => {
              e.preventDefault();
              handleDecrement('foil', e);
            }}
            disabled={readOnly || localQuantityFoil === 0}
            tabIndex={-1}
            disableFocusRipple
            $error={foilHasError}
          >
            <RemoveIcon sx={{ visibility: readOnly ? 'hidden' : 'visible' }} />
          </LeftButton>
        </Box>
        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            flex: 1,
          }}
        >
            <QuantityInput
              type="number"
              value={inputValueFoil}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('foil', e)}
              onBlur={(e: React.FocusEvent<HTMLInputElement>) => handleInputBlur('foil', e)}
              onFocus={handleInputFocus}
              onClick={(e) => {
                if (!isFoilDisabled) {
                  (e.currentTarget.querySelector('input') as HTMLInputElement)?.select();
                }
              }}
              inputProps={{ min: 0 }}
              variant="outlined"
              size="small"
              label={
                <Box display="flex" alignItems="center" gap={0.25}>
                  Foils
                  {isLoadingFoil && <CircularProgress size={12} thickness={5} sx={{ color: 'primary.main' }} />}
                  {showSuccessFoil && <CheckCircleIcon sx={{ fontSize: '0.875rem', color: 'inherit' }} />}
                </Box>
              }
              InputLabelProps={{ shrink: true }}
              disabled={isFoilDisabled}
              error={foilHasError}
            />
            {isFoilDisabled && !readOnly && !canBeFoil && !overrideFoil && (
              <Box
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDisabledFieldClick('foil');
                }}
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  cursor: 'pointer',
                  zIndex: 1,
                }}
              />
            )}
          </Box>
        <Tooltip
          title={
            !canBeFoil && !overrideFoil
              ? foilHasError
                ? "This card doesn't come in foil. You can only reduce the quantity. (Click to override.)"
                : "This card doesn't come in foil. (Click to override.)"
              : ''
          }
          placement="top"
          disableHoverListener={canBeFoil || overrideFoil}
          disableFocusListener={canBeFoil || overrideFoil}
          disableTouchListener={canBeFoil || overrideFoil}
        >
          <Box component="span" sx={{ display: 'inline-flex' }}>
            <RightButton
              size="small"
              onMouseDown={(e) => {
                e.preventDefault();
                if (isFoilDisabled && !readOnly && !canBeFoil && !overrideFoil) {
                  handleDisabledFieldClick('foil');
                } else {
                  handleIncrement('foil', e);
                }
              }}
              tabIndex={-1}
              disableFocusRipple
              disabled={isFoilDisabled}
              $error={foilHasError}
              sx={{
                cursor: isFoilDisabled && !readOnly && !canBeFoil && !overrideFoil ? 'pointer' : undefined,
              }}
            >
              <AddIcon sx={{ visibility: readOnly ? 'hidden' : 'visible' }} />
            </RightButton>
          </Box>
        </Tooltip>
      </QuantityContainer>

      <Dialog
        open={showOverrideDialog}
        onClose={handleOverrideCancel}
        aria-labelledby="override-dialog-title"
        aria-describedby="override-dialog-description"
      >
        <DialogTitle id="override-dialog-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningAmberIcon color="warning" />
          Enable {overrideDialogType === 'regular' ? 'Non-Foil' : 'Foil'} Quantity?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="override-dialog-description" component="div">
            <Typography variant="body2" gutterBottom>
              According to our data, this card doesn&apos;t come in{' '}
              {overrideDialogType === 'regular' ? 'non-foil' : 'foil'} finish.
            </Typography>
            <Typography variant="body2" gutterBottom>
              However, this data can sometimes be incorrect or incomplete. If you have this card in{' '}
              {overrideDialogType === 'regular' ? 'non-foil' : 'foil'} finish, you can override this restriction.
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500, mt: 2 }}>
              Would you like to enable this field anyway?
            </Typography>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleOverrideCancel} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleOverrideConfirm} variant="contained" color="primary" autoFocus>
            Enable Field
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
