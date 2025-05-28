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
  const [updateCollection] = useUpdateCollectionMutation();
  const { enqueueSnackbar } = useSnackbar();

  // Update local state when props change
  useEffect(() => {
    setLocalQuantityReg(quantityReg);
    setLocalQuantityFoil(quantityFoil);
  }, [quantityReg, quantityFoil]);

  // Create debounced update function
  const debouncedUpdate = useCallback(
    debounce(async (newQuantityReg: number, newQuantityFoil: number, changedType: 'regular' | 'foil') => {
      try {
        const result = await updateCollection({
          mode: 'set',
          cards: [
            {
              cardId,
              quantityReg: newQuantityReg,
              quantityFoil: newQuantityFoil,
            },
          ],
        }).unwrap();

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
      } catch (error) {
        enqueueSnackbar(`Error updating ${cardName}`, { variant: 'error' });
      }
    }, 200),
    [cardId, cardName, updateCollection, enqueueSnackbar],
  );

  const handleQuantityChange = (type: 'regular' | 'foil', value: number) => {
    const newValue = Math.max(0, value);

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
      handleQuantityChange('regular', localQuantityReg + 1);
    } else {
      handleQuantityChange('foil', localQuantityFoil + 1);
    }
  };

  const handleDecrement = (type: 'regular' | 'foil', event: React.MouseEvent<HTMLButtonElement>) => {
    event.currentTarget.blur();
    if (type === 'regular') {
      handleQuantityChange('regular', localQuantityReg - 1);
    } else {
      handleQuantityChange('foil', localQuantityFoil - 1);
    }
  };

  const handleInputChange = (type: 'regular' | 'foil', event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value) || 0;
    handleQuantityChange(type, value);
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
          value={localQuantityReg}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('regular', e)}
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
          value={localQuantityFoil}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('foil', e)}
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
