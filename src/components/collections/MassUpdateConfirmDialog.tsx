import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';
import { MassUpdateFormData } from './MassUpdatePanel';

interface MassUpdateConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  formData: MassUpdateFormData;
  setName?: string;
  estimatedCards?: number;
  isLoading?: boolean;
}

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  padding: theme.spacing(2),
}));

const ConfirmationBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.action.hover,
  marginBottom: theme.spacing(2),
}));

const getRarityLabel = (rarity: string): string => {
  const labels: Record<string, string> = {
    common: 'commons',
    uncommon: 'uncommons',
    rare: 'rares',
    mythic: 'mythics',
    all: 'cards',
  };
  return labels[rarity] || rarity;
};

const getActionDescription = (formData: MassUpdateFormData, setName?: string): string => {
  const rarityLabel = getRarityLabel(formData.rarity);
  const { mode, quantityReg, quantityFoil } = formData;
  const setPhrase = setName ? ` in ${setName}` : ' in this set';

  if (mode === 'set') {
    return `Set all ${rarityLabel}${setPhrase} to ${quantityReg} regular and ${quantityFoil} foil.`;
  } else {
    // Handle increment/decrement mode
    if (quantityReg === 0 && quantityFoil === 0) {
      return `No changes will be made to ${rarityLabel}${setPhrase}.`;
    }

    const parts: string[] = [];

    if (quantityReg !== 0) {
      const action = quantityReg > 0 ? 'Add' : 'Remove';
      parts.push(`${action} ${Math.abs(quantityReg)} regular`);
    }

    if (quantityFoil !== 0) {
      const action = quantityFoil > 0 ? 'add' : 'remove';
      // Capitalize if this is the first/only action
      const finalAction = parts.length === 0 ? action.charAt(0).toUpperCase() + action.slice(1) : action;
      parts.push(`${finalAction} ${Math.abs(quantityFoil)} foil`);
    }

    const combinedAction = parts.join(' and ');
    return `${combinedAction} for all ${rarityLabel}${setPhrase}.`;
  }
};

const MassUpdateConfirmDialog: React.FC<MassUpdateConfirmDialogProps> = ({
  open,
  onConfirm,
  onCancel,
  formData,
  setName = 'this set',
  estimatedCards,
  isLoading = false,
}) => {
  const actionDescription = getActionDescription(formData, setName);
  const isRemoveAll = formData.mode === 'set' && formData.quantityReg === 0 && formData.quantityFoil === 0;

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        elevation: 0,
        sx: {
          borderRadius: 2,
          border: (theme) => `1px solid ${theme.palette.divider}`,
        },
      }}
    >
      <DialogTitle
        sx={{
          textAlign: 'center',
          pb: 1,
          fontSize: '1rem',
          fontWeight: 500,
        }}
      >
        Confirm Mass Update
      </DialogTitle>

      <StyledDialogContent>
        <ConfirmationBox>
          <Typography
            variant="body2"
            color="textSecondary"
            fontWeight="medium"
            sx={{ textAlign: 'center', fontStyle: 'italic' }}
          >
            {actionDescription}
          </Typography>
        </ConfirmationBox>

        {isRemoveAll && (
          <Box
            sx={{
              p: 1.5,
              mb: 2,
              borderRadius: 1,
              border: (theme) => `1px solid ${theme.palette.warning.main}`,
              backgroundColor: (theme) => theme.palette.warning.light + '10',
            }}
          >
            <Typography variant="body2" color="warning" sx={{ textAlign: 'center' }}>
              This will remove all selected cards from your collection!
            </Typography>
          </Box>
        )}

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: 'block',
            textAlign: 'center',
            mt: 1,
          }}
        >
          This action cannot be undone.
        </Typography>
      </StyledDialogContent>

      <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
        <Button variant="outlined" size="small" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color={isRemoveAll ? 'error' : 'primary'}
          size="small"
          disabled={isLoading}
        >
          {isLoading ? 'Updating...' : 'Apply'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MassUpdateConfirmDialog;
