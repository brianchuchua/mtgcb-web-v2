import React, { useState, useEffect, useCallback } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, TextField, Tooltip, Typography } from '@mui/material';
import { Add, Remove } from '@mui/icons-material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { styled } from '@mui/material/styles';

const StyledQuantityBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'stretch',
  width: '160px',
  height: '37px',
  boxSizing: 'border-box',
  '&:focus-within': {
    '& button': {
      borderColor: theme.palette.primary.main,
    },
  },
  [theme.breakpoints.down('sm')]: {
    width: '100%',
  },
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  flex: 1,
  minWidth: 0,
  '& .MuiOutlinedInput-input': {
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
    paddingTop: theme.spacing(0.75),
    paddingBottom: theme.spacing(0.75),
    textAlign: 'center',
    fontSize: '0.875rem',
    height: '37px',
    boxSizing: 'border-box',
  },
  '& .MuiInputLabel-root': {
    left: '50%',
    transform: 'translate(-50%, 16px) scale(1)',
    transformOrigin: 'center',
    '&.MuiInputLabel-shrink': {
      transform: 'translate(-50%, -9px) scale(0.75)',
    },
  },
  '& .MuiOutlinedInput-notchedOutline legend': {
    marginLeft: 'auto',
    marginRight: 'auto',
    textAlign: 'center',
  },
  '& .MuiOutlinedInput-root': {
    height: '37px',
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

const StyledIconButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== 'error',
})<{ error?: boolean }>(({ theme, error }) => ({
  padding: theme.spacing(1),
  width: '35px',
  height: '37px',
  borderRadius: 0,
  border: `1px solid ${error ? theme.palette.error.main : theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  transition: 'border-color 0.2s, background-color 0.2s',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    borderColor: error ? theme.palette.error.main : theme.palette.divider,
  },
  '&:active': {
    backgroundColor: theme.palette.background.paper,
  },
  '&.MuiIconButton-root:active': {
    backgroundColor: theme.palette.background.paper,
  },
  '&.Mui-disabled': {
    borderColor: error ? theme.palette.error.main : theme.palette.divider,
  },
  '& .MuiSvgIcon-root': {
    fontSize: '1.1rem',
  },
  '&:first-of-type': {
    borderTopLeftRadius: theme.shape.borderRadius,
    borderBottomLeftRadius: theme.shape.borderRadius,
    borderRight: 'none',
  },
  '&:last-of-type': {
    borderTopRightRadius: theme.shape.borderRadius,
    borderBottomRightRadius: theme.shape.borderRadius,
    borderLeft: 'none',
  },
}));

export interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  onBlur?: () => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  label?: string;
  tooltip?: string;
  size?: 'small' | 'medium';
}

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  value,
  onChange,
  onBlur,
  min = 0,
  max,
  disabled = false,
  error = false,
  helperText,
  label,
  tooltip,
  size = 'medium',
}) => {
  const [localValue, setLocalValue] = useState(value.toString());

  useEffect(() => {
    setLocalValue(value.toString());
  }, [value]);

  const handleIncrement = useCallback(() => {
    const newValue = value + 1;
    if (max === undefined || newValue <= max) {
      onChange(newValue);
    }
  }, [value, max, onChange]);

  const handleDecrement = useCallback(() => {
    const newValue = value - 1;
    if (newValue >= min) {
      onChange(newValue);
    }
  }, [value, min, onChange]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    
    if (inputValue === '') {
      setLocalValue('');
      return;
    }

    const numericValue = parseInt(inputValue, 10);
    if (!isNaN(numericValue)) {
      setLocalValue(inputValue);
      if (numericValue >= min && (max === undefined || numericValue <= max)) {
        onChange(numericValue);
      }
    }
  };

  const handleInputBlur = () => {
    const numericValue = parseInt(localValue, 10);
    if (isNaN(numericValue) || numericValue < min) {
      setLocalValue(min.toString());
      onChange(min);
    } else if (max !== undefined && numericValue > max) {
      setLocalValue(max.toString());
      onChange(max);
    } else {
      setLocalValue(numericValue.toString());
      onChange(numericValue);
    }
    onBlur?.();
  };

  const handleSelectAll = (event: React.FocusEvent<HTMLInputElement>) => {
    event.target.select();
  };

  const content = (
    <Box>
      <StyledQuantityBox>
        <StyledIconButton
          size={size}
          onMouseDown={(e) => {
            e.preventDefault();
            handleDecrement();
          }}
          disabled={disabled || value <= min}
          aria-label="Decrease quantity"
          error={error}
          disableRipple
          disableFocusRipple
          tabIndex={-1}
        >
          <Remove fontSize={size} />
        </StyledIconButton>
        <StyledTextField
          type="number"
          value={localValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={handleSelectAll}
          disabled={disabled}
          error={error}
          size={size}
          label={label}
          InputLabelProps={{ shrink: true }}
          variant="outlined"
          inputProps={{
            min,
            max,
            'aria-label': label || 'Quantity',
          }}
        />
        <StyledIconButton
          size={size}
          onMouseDown={(e) => {
            e.preventDefault();
            handleIncrement();
          }}
          disabled={disabled || (max !== undefined && value >= max)}
          aria-label="Increase quantity"
          error={error}
          disableRipple
          disableFocusRipple
          tabIndex={-1}
        >
          <Add fontSize={size} />
        </StyledIconButton>
      </StyledQuantityBox>
      {helperText && (
        <Typography
          variant="caption"
          color={error ? 'error' : 'text.secondary'}
          sx={{ mt: 0.5, display: 'block' }}
        >
          {helperText}
        </Typography>
      )}
    </Box>
  );

  if (tooltip && disabled) {
    return (
      <Tooltip title={tooltip} arrow>
        <Box sx={{ display: 'inline-block' }}>{content}</Box>
      </Tooltip>
    );
  }

  return content;
};

export interface DualQuantitySelectorProps {
  regularValue: number;
  foilValue: number;
  onRegularChange: (value: number) => void;
  onFoilChange: (value: number) => void;
  onBlur?: () => void;
  canBeNonFoil?: boolean;
  canBeFoil?: boolean;
  maxRegular?: number;
  maxFoil?: number;
  regularError?: boolean;
  foilError?: boolean;
  regularHelperText?: string;
  foilHelperText?: string;
  size?: 'small' | 'medium';
  orientation?: 'horizontal' | 'vertical';
  labels?: {
    regular?: string;
    foil?: string;
  };
  overrideNonFoil?: boolean;
  overrideFoil?: boolean;
  onOverrideNonFoil?: () => void;
  onOverrideFoil?: () => void;
}

export const DualQuantitySelector: React.FC<DualQuantitySelectorProps> = ({
  regularValue,
  foilValue,
  onRegularChange,
  onFoilChange,
  onBlur,
  canBeNonFoil = true,
  canBeFoil = true,
  maxRegular,
  maxFoil,
  regularError = false,
  foilError = false,
  regularHelperText,
  foilHelperText,
  size = 'medium',
  orientation = 'horizontal',
  labels = {
    regular: 'Regular',
    foil: 'Foils',
  },
  overrideNonFoil = false,
  overrideFoil = false,
  onOverrideNonFoil,
  onOverrideFoil,
}) => {
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [overrideDialogType, setOverrideDialogType] = useState<'regular' | 'foil'>('regular');

  const handleDisabledFieldClick = (type: 'regular' | 'foil') => {
    setOverrideDialogType(type);
    setShowOverrideDialog(true);
  };

  const handleOverrideConfirm = () => {
    if (overrideDialogType === 'regular') {
      onOverrideNonFoil?.();
    } else {
      onOverrideFoil?.();
    }
    setShowOverrideDialog(false);
  };

  const handleOverrideCancel = () => {
    setShowOverrideDialog(false);
  };

  // Determine if fields should be disabled (considering overrides)
  const isRegularDisabled = !canBeNonFoil && !overrideNonFoil;
  const isFoilDisabled = !canBeFoil && !overrideFoil;

  return (
    <>
      <Box sx={{
        display: 'flex',
        gap: 2,
        alignItems: 'flex-start',
        flexDirection: {
          xs: 'column', // Stack vertically on mobile
          sm: orientation === 'vertical' ? 'column' : 'row' // Use orientation prop on larger screens
        },
        '& > div': {
          width: { xs: '100%', sm: 'auto' }, // Full width on mobile
        },
        '& .MuiBox-root': {
          width: { xs: '100%', sm: 'auto' }, // Full width for quantity selector wrapper on mobile
        },
        '& > div > div:first-of-type': {
          width: { xs: '100%', sm: '160px' }, // Full width for StyledQuantityBox on mobile
        }
      }}>
        <Box sx={{ position: 'relative', display: 'flex' }}>
          <QuantitySelector
            value={regularValue}
            onChange={onRegularChange}
            onBlur={onBlur}
            max={maxRegular}
            disabled={isRegularDisabled}
            error={regularError || (!canBeNonFoil && !overrideNonFoil && regularValue > 0)}
            helperText={
              !canBeNonFoil && !overrideNonFoil && regularValue > 0
                ? 'This card cannot be non-foil'
                : regularHelperText
            }
            label={labels.regular}
            tooltip={!canBeNonFoil && !overrideNonFoil ? 'This card can only be foil. (Click to override.)' : undefined}
            size={size}
          />
          {isRegularDisabled && onOverrideNonFoil && (
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
        <Box sx={{ position: 'relative', display: 'flex' }}>
          <QuantitySelector
            value={foilValue}
            onChange={onFoilChange}
            onBlur={onBlur}
            max={maxFoil}
            disabled={isFoilDisabled}
            error={foilError || (!canBeFoil && !overrideFoil && foilValue > 0)}
            helperText={
              !canBeFoil && !overrideFoil && foilValue > 0
                ? 'This card cannot be foil'
                : foilHelperText
            }
            label={labels.foil}
            tooltip={!canBeFoil && !overrideFoil ? 'This card cannot be foil. (Click to override.)' : undefined}
            size={size}
          />
          {isFoilDisabled && onOverrideFoil && (
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
      </Box>

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
    </>
  );
};