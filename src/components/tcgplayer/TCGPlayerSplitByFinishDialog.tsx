'use client';

import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';
import { useTCGPlayer } from '@/context/TCGPlayerContext';
import { getFormTarget } from '@/utils/browser/detectSafari';
import { CardWithQuantity, formatMassImportString } from '@/utils/tcgplayer/formatMassImportString';

interface CardWithFinishNeeds extends CardWithQuantity {
  goalRegNeeded?: number;
  goalFoilNeeded?: number;
}

interface TCGPlayerSplitByFinishDialogProps {
  open: boolean;
  onClose: () => void;
  regularCards: CardWithFinishNeeds[];
  foilCards: CardWithFinishNeeds[];
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

const FinishButton = styled(Button)(({ theme }) => ({
  justifyContent: 'space-between',
  textTransform: 'none',
  padding: theme.spacing(1.5, 2),
}));

const TCGPlayerSplitByFinishDialog: React.FC<TCGPlayerSplitByFinishDialogProps> = ({
  open,
  onClose,
  regularCards,
  foilCards,
}) => {
  const { submitToTCGPlayer } = useTCGPlayer();

  const handleRegularSubmit = () => {
    const importString = formatMassImportString(regularCards, 1, false);
    const formTarget = getFormTarget();
    submitToTCGPlayer(importString, formTarget);
  };

  const handleFoilSubmit = () => {
    const importString = formatMassImportString(foilCards, 1, false);
    const formTarget = getFormTarget();
    submitToTCGPlayer(importString, formTarget);
  };

  const totalRegularQuantity = regularCards.reduce((sum, card) => sum + (card.neededQuantity || 0), 0);
  const totalFoilQuantity = foilCards.reduce((sum, card) => sum + (card.neededQuantity || 0), 0);

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
        Split by Card Finish
      </DialogTitle>

      <StyledDialogContent>
        <InfoBox>
          <Typography variant="body2" color="textSecondary" paragraph>
            Your goal includes both regular and foil cards. It's easiest to import these into TCGPlayer by grouping
            foils and regulars separately.
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Click the appropriate button below to import each type of card. For foil cards, after importing, under "Item
            Options" in TCGPlayer, make sure only "Foil" is checked for the printing.
          </Typography>
        </InfoBox>

        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
          Mass Entry Options:
        </Typography>

        <Stack spacing={1}>
          {regularCards.length > 0 && (
            <FinishButton variant="outlined" color="primary" onClick={handleRegularSubmit} fullWidth>
              <span>Import Regular Cards</span>
              <Chip
                label={`${regularCards.length} cards, ${totalRegularQuantity} total`}
                size="small"
                sx={{ ml: 2 }}
                variant="outlined"
              />
            </FinishButton>
          )}

          {foilCards.length > 0 && (
            <FinishButton variant="outlined" color="secondary" onClick={handleFoilSubmit} fullWidth>
              <span>Import Foil Cards</span>
              <Chip
                label={`${foilCards.length} cards, ${totalFoilQuantity} total`}
                size="small"
                sx={{ ml: 2 }}
                color="secondary"
                variant="outlined"
              />
            </FinishButton>
          )}
        </Stack>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: 'block',
            textAlign: 'center',
            mt: 3,
            fontStyle: 'italic',
          }}
        >
          Important: For foil cards, under "Item Options" in TCGPlayer, choose only "Foil" for the printing.
        </Typography>
      </StyledDialogContent>

      <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
        <Button variant="outlined" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TCGPlayerSplitByFinishDialog;
