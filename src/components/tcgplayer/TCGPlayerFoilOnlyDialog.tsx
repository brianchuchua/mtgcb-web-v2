'use client';

import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';
import { useTCGPlayer } from '@/context/TCGPlayerContext';
import { getFormTarget } from '@/utils/browser/detectSafari';
import { CardWithQuantity, formatMassImportString } from '@/utils/tcgplayer/formatMassImportString';

interface TCGPlayerFoilOnlyDialogProps {
  open: boolean;
  onClose: () => void;
  foilCards: CardWithQuantity[];
}

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  padding: theme.spacing(3),
}));

const InfoBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.action.hover,
  marginBottom: theme.spacing(3),
}));

const FoilButton = styled(Button)(({ theme }) => ({
  justifyContent: 'space-between',
  textTransform: 'none',
  padding: theme.spacing(1.5, 2),
}));

const TCGPlayerFoilOnlyDialog: React.FC<TCGPlayerFoilOnlyDialogProps> = ({ open, onClose, foilCards }) => {
  const { submitToTCGPlayer } = useTCGPlayer();

  const handleSubmit = () => {
    const importString = formatMassImportString(foilCards, 1, false);
    const formTarget = getFormTarget();
    submitToTCGPlayer(importString, formTarget);
    onClose();
  };

  const totalQuantity = foilCards.reduce((sum, card) => sum + (card.neededQuantity || 0), 0);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
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
          pb: 1,
          fontSize: '1.25rem',
          fontWeight: 500,
        }}
      >
        Import Foil Cards
      </DialogTitle>

      <StyledDialogContent>
        <InfoBox>
          <Typography variant="body2" color="textSecondary">
            <strong>Important:</strong> After importing these foil cards into TCGPlayer, you must mark them as foils.
            Under "Item Options" in TCGPlayer, make sure only "Foil" is checked.
          </Typography>
        </InfoBox>

        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
          Mass Entry:
        </Typography>

        <Stack spacing={1}>
          <FoilButton variant="outlined" color="secondary" onClick={handleSubmit} fullWidth>
            <span>Import Foil Cards</span>
            <Chip
              label={`${foilCards.length} cards, ${totalQuantity} total`}
              size="small"
              sx={{ ml: 2 }}
              color="secondary"
              variant="outlined"
            />
          </FoilButton>
        </Stack>

        <Typography
          variant="caption"
          sx={{
            display: 'block',
            textAlign: 'center',
            mt: 3,
            fontStyle: 'italic',
            color: 'warning.main',
            fontWeight: 'medium',
          }}
        >
          Don't forget: Under "Item Options" in TCGPlayer, choose "Foil" for the printing.
        </Typography>
      </StyledDialogContent>

      <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TCGPlayerFoilOnlyDialog;
