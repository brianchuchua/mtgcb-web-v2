'use client';

import { Button, ButtonProps, CircularProgress } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useCallback, useState } from 'react';
import { useFetchCardsForMassImport } from './useFetchCardsForMassImport';
import { CountType } from '@/components/tcgplayer/useFetchCardsForMassImport';
import { useTCGPlayer } from '@/context/TCGPlayerContext';
import { usePriceType } from '@/hooks/usePriceType';
import { getFormTarget } from '@/utils/browser/detectSafari';
import { formatMassImportString, CardWithQuantity } from '@/utils/tcgplayer/formatMassImportString';
import TCGPlayerMassImportChunksDialog from './TCGPlayerMassImportChunksDialog';
import { useLazyGetGoalQuery } from '@/api/goals/goalsApi';
import { useAuth } from '@/hooks/useAuth';

interface TCGPlayerMassImportButtonProps extends Omit<ButtonProps, 'onClick'> {
  setId: string;
  count: number;
  countType: CountType;
  children?: React.ReactNode;
  includeSubsetsInSets?: boolean;
  userId?: number; // Optional - when provided, only missing cards will be included
  goalId?: number; // Optional - when provided with userId, only cards needed for the goal will be included
}

const TCGPlayerMassImportButton: React.FC<TCGPlayerMassImportButtonProps> = ({
  setId,
  count,
  countType,
  children,
  includeSubsetsInSets = false,
  userId,
  goalId,
  ...buttonProps
}) => {
  const { submitToTCGPlayer } = useTCGPlayer();
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();
  const [localIsLoading, setLocalIsLoading] = useState(false);
  const [showChunksDialog, setShowChunksDialog] = useState(false);
  const [cardsForChunking, setCardsForChunking] = useState<CardWithQuantity[]>([]);
  const priceType = usePriceType();
  const [getGoal] = useLazyGetGoalQuery();

  // Use user's draft cube variant preference, defaulting to 'standard'
  const draftCubeVariant = user?.draftCubeVariant || 'standard';

  const {
    fetchCards,
    isLoading: isHookLoading,
    isError,
  } = useFetchCardsForMassImport({
    setId,
    countType,
    includeSubsetsInSets,
    userId,
    count,
    goalId,
    priceType: priceType.toLowerCase() as 'market' | 'low' | 'average' | 'high',
    draftCubeVariant,
  });

  const handleClick = useCallback(async () => {
    if (isHookLoading || localIsLoading) return;

    try {
      setLocalIsLoading(true);

      // Fetch goal data if goalId is provided to check onePrintingPerPureName
      let oneResultPerCardName = false;
      if (userId && goalId) {
        const goalResult = await getGoal({ userId, goalId });
        if (goalResult.data?.data?.onePrintingPerPureName) {
          oneResultPerCardName = true;
        }
      }

      const cards = await fetchCards(oneResultPerCardName);

      if (!cards || cards.length === 0) {
        // Show a softer message when user has collection context (already owns all cards)
        if (userId) {
          const isDraftCube = countType === 'draftcube';
          if (isDraftCube) {
            enqueueSnackbar('You already have all the cards needed for a draft cube!', { variant: 'info' });
          } else if (countType === 'all') {
            enqueueSnackbar('You already own all cards in this set!', { variant: 'info' });
          } else {
            enqueueSnackbar(`You already own all ${countType} cards in this set!`, { variant: 'info' });
          }
        } else {
          enqueueSnackbar('No matching cards found with TCGPlayer IDs.', { variant: 'error' });
        }
        return;
      }

      const isDraftCube = countType === 'draftcube';
      
      // Convert cards to CardWithQuantity format for consistency
      const cardsWithQuantity: CardWithQuantity[] = cards.map(card => {
        let neededQuantity = count;
        if (isDraftCube) {
          const rarity = card.rarity?.toLowerCase();
          if (rarity === 'common') {
            neededQuantity = 4;
          } else if (rarity === 'uncommon') {
            neededQuantity = draftCubeVariant === 'two-uncommon' ? 2 : 4;
          } else {
            neededQuantity = 1; // rare or mythic
          }
        }
        return {
          ...card,
          neededQuantity
        };
      });

      // Check if we need to chunk the cards
      if (cardsWithQuantity.length > 500) {
        setCardsForChunking(cardsWithQuantity);
        setShowChunksDialog(true);
      } else {
        // Submit immediately for 500 or fewer cards
        const importString = formatMassImportString(cards, count, isDraftCube, draftCubeVariant);
        const formTarget = getFormTarget();
        submitToTCGPlayer(importString, formTarget);
      }
    } catch (error) {
      enqueueSnackbar('There was an error preparing your card list. Please try again.', { variant: 'error' });
    } finally {
      setLocalIsLoading(false);
    }
  }, [
    setId,
    count,
    countType,
    isHookLoading,
    localIsLoading,
    fetchCards,
    submitToTCGPlayer,
    includeSubsetsInSets,
    userId,
    goalId,
    enqueueSnackbar,
    getGoal,
  ]);

  const isLoading = isHookLoading || localIsLoading;

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        disabled={isLoading}
        onClick={handleClick}
        sx={{
          fontSize: '0.7rem',
          py: 0.2,
          minWidth: 'auto',
          textTransform: 'capitalize',
          ...buttonProps.sx,
        }}
        {...buttonProps}
      >
        {children || `Buy ${count}x`}
      </Button>
      
      <TCGPlayerMassImportChunksDialog
        open={showChunksDialog}
        onClose={() => setShowChunksDialog(false)}
        cards={cardsForChunking}
      />
    </>
  );
};

export default TCGPlayerMassImportButton;
