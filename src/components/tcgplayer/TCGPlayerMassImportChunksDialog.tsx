'use client';

import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { useMemo, useState } from 'react';
import { useTCGPlayer } from '@/context/TCGPlayerContext';
import { getFormTarget } from '@/utils/browser/detectSafari';
import { CardWithQuantity, formatMassImportString } from '@/utils/tcgplayer/formatMassImportString';

interface TCGPlayerMassImportChunksDialogProps {
  open: boolean;
  onClose: () => void;
  cards: CardWithQuantity[];
  chunkSize?: number;
  isFoilOnly?: boolean;
  isNormalOnly?: boolean;
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

const ChunkButton = styled(Button)(({ theme }) => ({
  justifyContent: 'space-between',
  textTransform: 'none',
  padding: theme.spacing(1.5, 2),
}));

const TCGPlayerMassImportChunksDialog: React.FC<TCGPlayerMassImportChunksDialogProps> = ({
  open,
  onClose,
  cards,
  chunkSize = 500,
  isFoilOnly = false,
  isNormalOnly = false,
}) => {
  const { submitToTCGPlayer } = useTCGPlayer();
  const [submittedChunks, setSubmittedChunks] = useState<Set<number>>(new Set());

  const chunks = useMemo(() => {
    const result: CardWithQuantity[][] = [];
    for (let i = 0; i < cards.length; i += chunkSize) {
      result.push(cards.slice(i, i + chunkSize));
    }
    return result;
  }, [cards, chunkSize]);

  const handleChunkSubmit = (chunkIndex: number) => {
    const chunk = chunks[chunkIndex];
    const importString = formatMassImportString(chunk, 1, false);
    // Always use _blank for chunk submissions to ensure new tabs
    submitToTCGPlayer(importString, '_blank');

    setSubmittedChunks((prev) => new Set(prev).add(chunkIndex));
  };

  const totalCards = cards.length;
  const totalChunks = chunks.length;

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
        Large Mass Entry Detected
      </DialogTitle>

      <StyledDialogContent>
        <InfoBox>
          <Typography variant="body2" color="textSecondary" paragraph>
            TCGPlayer's mass entry feature has issues dealing with over 500 cards at once. To prevent crashes, we've
            split your {totalCards} cards into {totalChunks} separate entries.
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Click each button below to open a new TCGPlayer tab with that batch of cards. You can submit multiple
            batches by clicking multiple buttons.
          </Typography>
          {isFoilOnly && (
            <Typography variant="body2" sx={{ mt: 2 }}>
              <strong>Important:</strong>{' '}
              <Box component="span" sx={{ color: 'warning.main', fontWeight: 'medium' }}>
                These are foil cards. After importing each batch, under "Item Options"
                in TCGPlayer, choose "Foil" for the printing.
              </Box>
            </Typography>
          )}
          {isNormalOnly && (
            <Typography variant="body2" sx={{ mt: 2 }}>
              <strong>Important:</strong>{' '}
              <Box component="span" sx={{ color: 'warning.main', fontWeight: 'medium' }}>
                These are normal (non-foil) cards. After importing each batch, under "Item Options"
                in TCGPlayer, make sure "Foil" is unchecked.
              </Box>
            </Typography>
          )}
        </InfoBox>

        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
          Mass Entry Batches:
        </Typography>

        <Stack spacing={1}>
          {chunks.map((chunk, index) => {
            const startCard = index * chunkSize + 1;
            const endCard = Math.min((index + 1) * chunkSize, totalCards);
            const isSubmitted = submittedChunks.has(index);

            return (
              <ChunkButton
                key={index}
                variant="outlined"
                color={isSubmitted ? 'success' : 'primary'}
                onClick={() => handleChunkSubmit(index)}
                fullWidth
                sx={{
                  borderColor: isSubmitted ? 'success.main' : 'divider',
                  '&:hover': {
                    borderColor: isSubmitted ? 'success.dark' : 'primary.main',
                  },
                }}
              >
                <span>
                  Mass Entry cards {startCard}-{endCard}
                  {isSubmitted && ' ✓'}
                </span>
                <Chip
                  label={`${chunk.length} cards`}
                  size="small"
                  sx={{ ml: 2 }}
                  color={isSubmitted ? 'success' : 'default'}
                  variant={isSubmitted ? 'filled' : 'outlined'}
                />
              </ChunkButton>
            );
          })}
        </Stack>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: 'block',
            textAlign: 'center',
            mt: 3,
          }}
        >
          {submittedChunks.size > 0 && `${submittedChunks.size} of ${totalChunks} batches submitted`}
        </Typography>
        
        {isFoilOnly && (
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              textAlign: 'center',
              mt: 2,
              fontStyle: 'italic',
              color: 'warning.main',
              fontWeight: 'medium',
            }}
          >
            Don't forget: Under "Item Options" in TCGPlayer, choose "Foil" for the printing.
          </Typography>
        )}
        {isNormalOnly && (
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              textAlign: 'center',
              mt: 2,
              fontStyle: 'italic',
              color: 'warning.main',
              fontWeight: 'medium',
            }}
          >
            Don't forget: Under "Item Options" in TCGPlayer, make sure "Foil" is unchecked for normal cards.
          </Typography>
        )}
      </StyledDialogContent>

      <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
        <Button variant="outlined" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TCGPlayerMassImportChunksDialog;
