'use client';

import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { Box, IconButton, TextField, Typography, styled } from '@mui/material';
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
}));

const QuantityInput = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-input': {
    padding: theme.spacing(1),
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
  },
  '& input[type="number"]::-webkit-inner-spin-button, & input[type="number"]::-webkit-outer-spin-button': {
    WebkitAppearance: 'none',
    margin: 0,
  },
  '& input[type="number"]': {
    MozAppearance: 'textfield',
  },
}));

const QuantityButton = styled(IconButton)(({ theme }) => ({
  padding: theme.spacing(1),
  width: '40px',
  borderRadius: 0,
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  transition: 'border-color 0.2s, background-color 0.2s',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    borderColor: theme.palette.divider,
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
}

export const EditableCardQuantity: React.FC<EditableCardQuantityProps> = ({
  cardId,
  cardName,
  quantityReg,
  quantityFoil,
}) => {
  const [localQuantityReg, setLocalQuantityReg] = useState(quantityReg);
  const [localQuantityFoil, setLocalQuantityFoil] = useState(quantityFoil);
  const [inputValueReg, setInputValueReg] = useState(quantityReg.toString());
  const [inputValueFoil, setInputValueFoil] = useState(quantityFoil.toString());
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
          const quantity = changedType === 'regular' ? newQuantityReg : newQuantityFoil;
          const message =
            changedType === 'regular'
              ? `${cardName} has been set to ${quantity}`
              : `${cardName} (Foil) has been set to ${quantity}`;
          enqueueSnackbar(message, { variant: 'success' });
        } else {
          enqueueSnackbar(`Failed to update ${cardName}`, { variant: 'error' });
        }
      } catch (error: any) {
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

  return (
    <Box display="flex" gap={2} justifyContent="center" sx={{ mt: 0.5 }}>
      <QuantityContainer>
        <LeftButton
          size="small"
          onMouseDown={(e) => {
            e.preventDefault();
            handleDecrement('regular', e);
          }}
          disabled={localQuantityReg === 0}
          tabIndex={-1}
          disableFocusRipple
        >
          <RemoveIcon />
        </LeftButton>
        <QuantityInput
          type="number"
          value={inputValueReg}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('regular', e)}
          onBlur={(e: React.FocusEvent<HTMLInputElement>) => handleInputBlur('regular', e)}
          onFocus={handleInputFocus}
          onClick={(e) => (e.currentTarget.querySelector('input') as HTMLInputElement)?.select()}
          inputProps={{ min: 0 }}
          variant="outlined"
          size="small"
          label="Regular"
          InputLabelProps={{ shrink: true }}
        />
        <RightButton
          size="small"
          onMouseDown={(e) => {
            e.preventDefault();
            handleIncrement('regular', e);
          }}
          tabIndex={-1}
          disableFocusRipple
        >
          <AddIcon />
        </RightButton>
      </QuantityContainer>

      <QuantityContainer>
        <LeftButton
          size="small"
          onMouseDown={(e) => {
            e.preventDefault();
            handleDecrement('foil', e);
          }}
          disabled={localQuantityFoil === 0}
          tabIndex={-1}
          disableFocusRipple
        >
          <RemoveIcon />
        </LeftButton>
        <QuantityInput
          type="number"
          value={inputValueFoil}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('foil', e)}
          onBlur={(e: React.FocusEvent<HTMLInputElement>) => handleInputBlur('foil', e)}
          onFocus={handleInputFocus}
          onClick={(e) => (e.currentTarget.querySelector('input') as HTMLInputElement)?.select()}
          inputProps={{ min: 0 }}
          variant="outlined"
          size="small"
          label="Foils"
          InputLabelProps={{ shrink: true }}
        />
        <RightButton
          size="small"
          onMouseDown={(e) => {
            e.preventDefault();
            handleIncrement('foil', e);
          }}
          tabIndex={-1}
          disableFocusRipple
        >
          <AddIcon />
        </RightButton>
      </QuantityContainer>
    </Box>
  );
};
