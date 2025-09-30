'use client';

import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { useCallback, useState } from 'react';
import { useLazyGetCardsQuery } from '@/api/browse/browseApi';
import { useTCGPlayer } from '@/context/TCGPlayerContext';
import { getFormTarget } from '@/utils/browser/detectSafari';
import { CardWithQuantity, formatMassImportString } from '@/utils/tcgplayer/formatMassImportString';

interface CardWithFinishNeeds extends CardWithQuantity {
  goalRegNeeded?: number;
  goalFoilNeeded?: number;
  goalAllNeeded?: number;
  goalFullyMet?: boolean;
}

interface TCGPlayerGoalLazyChunksDialogProps {
  open: boolean;
  onClose: () => void;
  userId: number;
  goalId: number;
  setId: string | 'all';
  includeSubsetsInSets?: boolean;

  // Initial data from first fetch
  initialCards: CardWithFinishNeeds[];
  totalCount: number;
  hasRegularNeeds: boolean;
  hasFoilNeeds: boolean;
  goalConfig: {
    onePrintingPerPureName: boolean;
    priceType: string;
    allSetIds?: string[];
  };

  // For mixed finish scenarios
  initialRegularCards?: CardWithFinishNeeds[];
  initialFoilCards?: CardWithFinishNeeds[];
}

interface ChunkState {
  status: 'pending' | 'loading' | 'submitted';
  regularStatus?: 'pending' | 'loading' | 'submitted';
  foilStatus?: 'pending' | 'loading' | 'submitted';
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

const TCGPlayerGoalLazyChunksDialog: React.FC<TCGPlayerGoalLazyChunksDialogProps> = ({
  open,
  onClose,
  userId,
  goalId,
  setId,
  includeSubsetsInSets = false,
  initialCards,
  totalCount,
  hasRegularNeeds,
  hasFoilNeeds,
  goalConfig,
  initialRegularCards,
  initialFoilCards,
}) => {
  const { submitToTCGPlayer } = useTCGPlayer();
  const [getCards] = useLazyGetCardsQuery();

  const CHUNK_SIZE = 500;
  const needsSplitByFinish = hasRegularNeeds && hasFoilNeeds;

  // Calculate counts from initial data for display
  const totalRegularCards = initialRegularCards?.length || 0;
  const totalFoilCards = initialFoilCards?.length || 0;
  const totalRegularQuantity = initialRegularCards?.reduce((sum, card) => sum + (card.goalRegNeeded || 0), 0) || 0;
  const totalFoilQuantity = initialFoilCards?.reduce((sum, card) => sum + (card.goalFoilNeeded || 0), 0) || 0;

  // Calculate chunks based on finish split or total
  const totalChunks = needsSplitByFinish
    ? Math.max(Math.ceil(totalRegularCards / CHUNK_SIZE), Math.ceil(totalFoilCards / CHUNK_SIZE))
    : Math.ceil(totalCount / CHUNK_SIZE);

  // Initialize chunk states
  const initializeChunks = useCallback(() => {
    const chunks: Record<string, ChunkState> = {};
    for (let i = 0; i < totalChunks; i++) {
      if (needsSplitByFinish) {
        chunks[i.toString()] = {
          status: 'pending',
          regularStatus: 'pending',
          foilStatus: 'pending',
        };
      } else {
        chunks[i.toString()] = { status: 'pending' };
      }
    }
    return chunks;
  }, [totalChunks, needsSplitByFinish]);

  const [chunks, setChunks] = useState<Record<string, ChunkState>>(initializeChunks);

  const handleChunkClick = useCallback(
    async (chunkIndex: number, finishType?: 'regular' | 'foil') => {
      const chunk = chunks[chunkIndex];

      // For split finish mode, check the specific status
      if (needsSplitByFinish && finishType) {
        const statusKey = finishType === 'regular' ? 'regularStatus' : 'foilStatus';
        if (chunk[statusKey] === 'submitted' || chunk[statusKey] === 'loading') {
          return;
        }

        // Set loading state for specific finish type
        setChunks((prev) => ({
          ...prev,
          [chunkIndex]: {
            ...prev[chunkIndex],
            [statusKey]: 'loading',
          },
        }));
      } else {
        // Simple mode - check overall status
        if (chunk.status === 'submitted' || chunk.status === 'loading') {
          return;
        }

        // Set loading state
        setChunks((prev) => ({
          ...prev,
          [chunkIndex]: { status: 'loading' },
        }));
      }

      try {
        // For the first chunk, use initial data instead of fetching
        let cards: CardWithFinishNeeds[] = [];
        let regularCards: CardWithFinishNeeds[] = [];
        let foilCards: CardWithFinishNeeds[] = [];

        if (chunkIndex === 0) {
          // Use initial data for first chunk
          if (needsSplitByFinish) {
            regularCards = initialRegularCards || [];
            foilCards = initialFoilCards || [];
          } else {
            cards = initialCards;
          }
        } else {
          // Fetch the chunk
          const offset = chunkIndex * CHUNK_SIZE;
          const cardsResult = await getCards(
            {
              select: [
                'id',
                'name',
                'tcgplayerName',
                'setName',
                'setId',
                'tcgplayerId',
                'rarity',
                'code',
                'tcgplayerSetCode',
                'quantityReg',
                'quantityFoil',
                'goalRegNeeded',
                'goalFoilNeeded',
                'goalAllNeeded',
                'goalFullyMet',
                'canBeFoil',
                'canBeNonFoil',
              ],
              limit: CHUNK_SIZE,
              offset,
              ...(setId !== 'all' && {
                setId: goalConfig.allSetIds ? { OR: goalConfig.allSetIds } : { OR: [setId] },
              }),
              userId,
              goalId,
              showGoalProgress: true,
              showGoals: 'incomplete' as const,
              priceType: goalConfig.priceType.toLowerCase() as 'market' | 'low' | 'average' | 'high',
              ...(goalConfig.onePrintingPerPureName && { oneResultPerCardName: true }),
            },
            true, // Force refetch
          );

          if (!cardsResult.data?.data?.cards) {
            throw new Error('Failed to fetch cards');
          }

          const fetchedCards = cardsResult.data.data.cards;

          // Process cards to determine needs
          fetchedCards.forEach((card: any) => {
            const regNeeded = card.goalRegNeeded || 0;
            const foilNeeded = card.goalFoilNeeded || 0;
            const allNeeded = card.goalAllNeeded || 0;

            if (allNeeded > 0) {
              cards.push({
                ...card,
                neededQuantity: allNeeded,
              });
            } else {
              if (regNeeded > 0) {
                regularCards.push({
                  ...card,
                  neededQuantity: regNeeded,
                });
              }
              if (foilNeeded > 0) {
                foilCards.push({
                  ...card,
                  neededQuantity: foilNeeded,
                });
              }
            }
          });

          // Combine cards if not splitting by finish
          if (!needsSplitByFinish) {
            cards = [...cards, ...regularCards, ...foilCards];
          }
        }

        // Submit to TCGPlayer based on type
        let cardsToSubmit: CardWithFinishNeeds[] = [];

        if (needsSplitByFinish) {
          if (finishType === 'regular' && regularCards.length > 0) {
            cardsToSubmit = regularCards;
          } else if (finishType === 'foil' && foilCards.length > 0) {
            cardsToSubmit = foilCards;
          }
        } else {
          cardsToSubmit = cards;
        }

        if (cardsToSubmit.length > 0) {
          const importString = formatMassImportString(cardsToSubmit, 1, false);
          const formTarget = getFormTarget();
          submitToTCGPlayer(importString, formTarget);
        }

        // Mark as submitted
        if (needsSplitByFinish && finishType) {
          const statusKey = finishType === 'regular' ? 'regularStatus' : 'foilStatus';
          setChunks((prev) => ({
            ...prev,
            [chunkIndex]: {
              ...prev[chunkIndex],
              [statusKey]: 'submitted',
            },
          }));
        } else {
          setChunks((prev) => ({
            ...prev,
            [chunkIndex]: { status: 'submitted' },
          }));
        }
      } catch (error) {
        // Reset to pending on error
        if (needsSplitByFinish && finishType) {
          const statusKey = finishType === 'regular' ? 'regularStatus' : 'foilStatus';
          setChunks((prev) => ({
            ...prev,
            [chunkIndex]: {
              ...prev[chunkIndex],
              [statusKey]: 'pending',
            },
          }));
        } else {
          setChunks((prev) => ({
            ...prev,
            [chunkIndex]: { status: 'pending' },
          }));
        }
        console.error('Error loading chunk:', error);
      }
    },
    [
      chunks,
      needsSplitByFinish,
      initialCards,
      initialRegularCards,
      initialFoilCards,
      getCards,
      setId,
      goalConfig,
      userId,
      goalId,
      submitToTCGPlayer,
    ],
  );

  // Simple case - no finish split needed
  if (!needsSplitByFinish) {
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
        <DialogTitle>Purchase Cards for Goal ({totalCount.toLocaleString()} cards needed)</DialogTitle>

        <StyledDialogContent>
          <InfoBox>
            <Typography variant="body2" color="textSecondary" paragraph>
              We've split your {totalCount.toLocaleString()} cards into {totalChunks} manageable chunk(s). Click each
              chunk to open it in TCGPlayer.
            </Typography>
            {hasFoilNeeds && !hasRegularNeeds && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>Important:</strong>{' '}
                <Box component="span" sx={{ color: 'warning.main', fontWeight: 'medium' }}>
                  These are foil cards. After importing each batch, under "Item Options" in TCGPlayer, make sure only
                  "Foil" is checked.
                </Box>
              </Typography>
            )}
            {hasRegularNeeds && !hasFoilNeeds && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>Important:</strong>{' '}
                <Box component="span" sx={{ color: 'warning.main', fontWeight: 'medium' }}>
                  These are normal (non-foil) cards. After importing each batch, under "Item Options" in TCGPlayer, make
                  sure "Foil" is unchecked.
                </Box>
              </Typography>
            )}
          </InfoBox>

          <Stack spacing={1}>
            {Array.from({ length: totalChunks }, (_, i) => {
              const chunk = chunks[i.toString()];
              const startCard = i * CHUNK_SIZE + 1;
              const endCard = Math.min((i + 1) * CHUNK_SIZE, totalCount);
              const isSubmitted = chunk.status === 'submitted';
              const isLoading = chunk.status === 'loading';

              return (
                <ChunkButton
                  key={i}
                  variant="outlined"
                  color={isSubmitted ? 'success' : 'primary'}
                  onClick={() => handleChunkClick(i)}
                  fullWidth
                  disabled={isLoading}
                  sx={{
                    borderColor: isSubmitted ? 'success.main' : 'divider',
                    '&:hover': {
                      borderColor: isSubmitted ? 'success.dark' : 'primary.main',
                    },
                  }}
                >
                  {isLoading ? (
                    <>
                      <CircularProgress size={16} sx={{ mr: 1 }} />
                      <span>
                        Loading cards {startCard}-{endCard}...
                      </span>
                    </>
                  ) : (
                    <>
                      <span>
                        Cards {startCard}-{endCard}
                        {isSubmitted && ' ✓'}
                      </span>
                      <Chip
                        label={`Chunk ${i + 1}`}
                        size="small"
                        color={isSubmitted ? 'success' : 'default'}
                        variant={isSubmitted ? 'filled' : 'outlined'}
                        sx={{ ml: 2 }}
                      />
                    </>
                  )}
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
            {Object.values(chunks).filter((c) => c.status === 'submitted').length > 0 &&
              `${Object.values(chunks).filter((c) => c.status === 'submitted').length} of ${totalChunks} chunks opened`}
          </Typography>
        </StyledDialogContent>

        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button variant="outlined" onClick={onClose}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  // Mixed finish case - needs separate regular/foil buttons
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        elevation: 0,
        sx: {
          borderRadius: 2,
          border: (theme) => `1px solid ${theme.palette.divider}`,
        },
      }}
    >
      <DialogTitle>Purchase Cards for Goal ({totalCount.toLocaleString()} cards needed)</DialogTitle>

      <StyledDialogContent>
        <InfoBox>
          <Typography variant="body2" color="textSecondary" paragraph>
            Your goal requires both regular and foil cards. We've split your {totalCount.toLocaleString()} cards into{' '}
            {totalChunks} manageable chunk(s).
          </Typography>
          <Typography variant="body2">
            <strong>Important:</strong>{' '}
            <Box component="span" sx={{ color: 'warning.main', fontWeight: 'medium' }}>
              After importing, check the correct finish under "Item Options" in TCGPlayer: For foil cards, make sure
              only "Foil" is checked. For normal cards, make sure "Foil" is unchecked.
            </Box>
          </Typography>
        </InfoBox>

        <Stack spacing={2}>
          {Array.from({ length: totalChunks }, (_, i) => {
            const chunk = chunks[i.toString()];
            const regularSubmitted = chunk.regularStatus === 'submitted';
            const foilSubmitted = chunk.foilStatus === 'submitted';
            const regularLoading = chunk.regularStatus === 'loading';
            const foilLoading = chunk.foilStatus === 'loading';

            // Determine if this chunk has regular/foil cards
            const hasRegularInChunk = i + 1 <= Math.ceil(totalRegularCards / CHUNK_SIZE);
            const hasFoilInChunk = i + 1 <= Math.ceil(totalFoilCards / CHUNK_SIZE);
            const bothSubmitted =
              (hasRegularInChunk ? regularSubmitted : true) && (hasFoilInChunk ? foilSubmitted : true);

            return (
              <Box key={i}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Chunk {i + 1}
                  {bothSubmitted && ' ✓'}
                </Typography>

                <Stack direction="row" spacing={1}>
                  {hasRegularInChunk && (
                    <ChunkButton
                      variant="outlined"
                      color={regularSubmitted ? 'success' : 'primary'}
                      onClick={() => handleChunkClick(i, 'regular')}
                      sx={{ flex: 1, flexDirection: 'column', alignItems: 'stretch', py: 1 }}
                      disabled={regularLoading}
                    >
                      {regularLoading ? (
                        <>
                          <CircularProgress size={16} sx={{ mr: 1 }} />
                          Loading...
                        </>
                      ) : (
                        <>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              width: '100%',
                            }}
                          >
                            <span>Regular Cards</span>
                            {regularSubmitted && <Chip label="Opened" size="small" color="success" sx={{ ml: 1 }} />}
                          </Box>
                          {i === 0 && totalRegularCards > 0 && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, textAlign: 'left' }}>
                              {totalRegularCards} unique, {totalRegularQuantity} total
                            </Typography>
                          )}
                        </>
                      )}
                    </ChunkButton>
                  )}

                  {hasFoilInChunk && (
                    <ChunkButton
                      variant="outlined"
                      color={foilSubmitted ? 'success' : 'secondary'}
                      onClick={() => handleChunkClick(i, 'foil')}
                      sx={{ flex: 1, flexDirection: 'column', alignItems: 'stretch', py: 1 }}
                      disabled={foilLoading}
                    >
                      {foilLoading ? (
                        <>
                          <CircularProgress size={16} sx={{ mr: 1 }} />
                          Loading...
                        </>
                      ) : (
                        <>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              width: '100%',
                            }}
                          >
                            <span>Foil Cards</span>
                            {foilSubmitted && <Chip label="Opened" size="small" color="success" sx={{ ml: 1 }} />}
                          </Box>
                          {i === 0 && totalFoilCards > 0 && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, textAlign: 'left' }}>
                              {totalFoilCards} unique, {totalFoilQuantity} total
                            </Typography>
                          )}
                        </>
                      )}
                    </ChunkButton>
                  )}
                </Stack>
              </Box>
            );
          })}
        </Stack>
      </StyledDialogContent>

      <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
        <Button variant="outlined" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TCGPlayerGoalLazyChunksDialog;
