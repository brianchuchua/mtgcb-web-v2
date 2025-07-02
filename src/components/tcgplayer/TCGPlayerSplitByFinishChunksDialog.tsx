'use client';

import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { useMemo, useState } from 'react';
import { useTCGPlayer } from '@/context/TCGPlayerContext';
import { CardWithQuantity, formatMassImportString } from '@/utils/tcgplayer/formatMassImportString';

interface CardWithFinishNeeds extends CardWithQuantity {
  goalRegNeeded?: number;
  goalFoilNeeded?: number;
}

interface TCGPlayerSplitByFinishChunksDialogProps {
  open: boolean;
  onClose: () => void;
  regularCards: CardWithFinishNeeds[];
  foilCards: CardWithFinishNeeds[];
  chunkSize?: number;
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

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(1),
}));

const TCGPlayerSplitByFinishChunksDialog: React.FC<TCGPlayerSplitByFinishChunksDialogProps> = ({
  open,
  onClose,
  regularCards,
  foilCards,
  chunkSize = 1000,
}) => {
  const { submitToTCGPlayer } = useTCGPlayer();
  const [submittedChunks, setSubmittedChunks] = useState<Set<string>>(new Set());

  const regularChunks = useMemo(() => {
    const result: CardWithFinishNeeds[][] = [];
    for (let i = 0; i < regularCards.length; i += chunkSize) {
      result.push(regularCards.slice(i, i + chunkSize));
    }
    return result;
  }, [regularCards, chunkSize]);

  const foilChunks = useMemo(() => {
    const result: CardWithFinishNeeds[][] = [];
    for (let i = 0; i < foilCards.length; i += chunkSize) {
      result.push(foilCards.slice(i, i + chunkSize));
    }
    return result;
  }, [foilCards, chunkSize]);

  const handleChunkSubmit = (chunkId: string, cards: CardWithFinishNeeds[]) => {
    const importString = formatMassImportString(cards, 1, false);
    submitToTCGPlayer(importString, '_blank');
    setSubmittedChunks((prev) => new Set(prev).add(chunkId));
  };

  const totalRegularCards = regularCards.length;
  const totalFoilCards = foilCards.length;
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
        Split by Card Finish & Large Mass Entry
      </DialogTitle>

      <StyledDialogContent>
        <InfoBox>
          <Typography variant="body2" color="textSecondary" paragraph>
            Your goal includes both regular and foil cards. It's easiest to import these into TCGPlayer by grouping
            foils and regulars separately.
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Additionally, TCGPlayer has issues with over 1000 cards at once, so we've split large imports into batches.
            Each button opens a new TCGPlayer tab.
          </Typography>
          <Typography variant="body2" color="textSecondary">
            <strong>Important:</strong> After importing the foil cards into TCGPlayer, you must mark them as foils.
            Under "Item Options" in TCGPlayer, make sure only "Foil" is checked.
          </Typography>
        </InfoBox>

        <Stack spacing={3}>
          {regularChunks.length > 0 && (
            <Box>
              <SectionTitle variant="subtitle1">
                Regular Cards ({totalRegularCards} unique, {totalRegularQuantity} total)
              </SectionTitle>
              <Stack spacing={1}>
                {regularChunks.map((chunk, index) => {
                  const chunkId = `regular-${index}`;
                  const startCard = index * chunkSize + 1;
                  const endCard = Math.min((index + 1) * chunkSize, totalRegularCards);
                  const isSubmitted = submittedChunks.has(chunkId);
                  const chunkQuantity = chunk.reduce((sum, card) => sum + (card.neededQuantity || 0), 0);

                  return (
                    <ChunkButton
                      key={chunkId}
                      variant="outlined"
                      color={isSubmitted ? 'success' : 'primary'}
                      onClick={() => handleChunkSubmit(chunkId, chunk)}
                      fullWidth
                      sx={{
                        borderColor: isSubmitted ? 'success.main' : 'primary.main',
                        '&:hover': {
                          borderColor: isSubmitted ? 'success.dark' : 'primary.dark',
                        },
                      }}
                    >
                      <span>
                        Regular cards {startCard}-{endCard}
                        {isSubmitted && ' ✓'}
                      </span>
                      <Chip
                        label={`${chunk.length} cards, ${chunkQuantity} total`}
                        size="small"
                        sx={{ ml: 2 }}
                        color={isSubmitted ? 'success' : 'default'}
                        variant={isSubmitted ? 'filled' : 'outlined'}
                      />
                    </ChunkButton>
                  );
                })}
              </Stack>
            </Box>
          )}

          {foilChunks.length > 0 && (
            <Box>
              <SectionTitle variant="subtitle1">
                Foil Cards ({totalFoilCards} unique, {totalFoilQuantity} total)
              </SectionTitle>
              <Stack spacing={1}>
                {foilChunks.map((chunk, index) => {
                  const chunkId = `foil-${index}`;
                  const startCard = index * chunkSize + 1;
                  const endCard = Math.min((index + 1) * chunkSize, totalFoilCards);
                  const isSubmitted = submittedChunks.has(chunkId);
                  const chunkQuantity = chunk.reduce((sum, card) => sum + (card.neededQuantity || 0), 0);

                  return (
                    <ChunkButton
                      key={chunkId}
                      variant="outlined"
                      color={isSubmitted ? 'success' : 'secondary'}
                      onClick={() => handleChunkSubmit(chunkId, chunk)}
                      fullWidth
                      sx={{
                        borderColor: isSubmitted ? 'success.main' : 'secondary.main',
                        '&:hover': {
                          borderColor: isSubmitted ? 'success.dark' : 'secondary.dark',
                        },
                      }}
                    >
                      <span>
                        Foil cards {startCard}-{endCard}
                        {isSubmitted && ' ✓'}
                      </span>
                      <Chip
                        label={`${chunk.length} cards, ${chunkQuantity} total`}
                        size="small"
                        sx={{ ml: 2 }}
                        color={isSubmitted ? 'success' : 'secondary'}
                        variant={isSubmitted ? 'filled' : 'outlined'}
                      />
                    </ChunkButton>
                  );
                })}
              </Stack>
            </Box>
          )}
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
          {submittedChunks.size > 0 &&
            `${submittedChunks.size} of ${regularChunks.length + foilChunks.length} batches submitted`}
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

export default TCGPlayerSplitByFinishChunksDialog;
