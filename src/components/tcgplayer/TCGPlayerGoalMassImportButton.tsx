'use client';

import { Button, ButtonProps } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useCallback, useState } from 'react';
import { useLazyGetCardsQuery, useLazyGetSetsQuery } from '@/api/browse/browseApi';
import { useLazyGetGoalQuery } from '@/api/goals/goalsApi';
import { useTCGPlayer } from '@/context/TCGPlayerContext';
import { usePriceType } from '@/hooks/usePriceType';
import { getFormTarget } from '@/utils/browser/detectSafari';
import { formatMassImportString } from '@/utils/tcgplayer/formatMassImportString';
import { CardWithQuantity } from '@/utils/tcgplayer/formatMassImportString';
import TCGPlayerMassImportChunksDialog from './TCGPlayerMassImportChunksDialog';

interface TCGPlayerGoalMassImportButtonProps extends Omit<ButtonProps, 'onClick'> {
  setId: string | 'all';
  userId: number;
  goalId: number;
  includeSubsetsInSets?: boolean;
  children?: React.ReactNode;
}

const TCGPlayerGoalMassImportButton: React.FC<TCGPlayerGoalMassImportButtonProps> = ({
  setId,
  userId,
  goalId,
  includeSubsetsInSets = false,
  children,
  ...buttonProps
}) => {
  const { submitToTCGPlayer } = useTCGPlayer();
  const { enqueueSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);
  const [showChunksDialog, setShowChunksDialog] = useState(false);
  const [cardsForChunking, setCardsForChunking] = useState<CardWithQuantity[]>([]);
  const priceType = usePriceType();
  const [getCards] = useLazyGetCardsQuery();
  const [getSets] = useLazyGetSetsQuery();
  const [getGoal] = useLazyGetGoalQuery();

  const handleClick = useCallback(async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);

      // First, fetch the goal to check if onePrintingPerPureName is true
      const goalResult = await getGoal({ userId, goalId });
      if (!goalResult?.data?.data) {
        enqueueSnackbar('Failed to fetch goal information.', { variant: 'error' });
        return;
      }

      const goal = goalResult.data.data;
      const useOneResultPerCardName = goal.onePrintingPerPureName === true;

      // If we need to include subsets and have a specific setId, fetch child sets first
      let allSetIds: string[] | undefined;
      if (includeSubsetsInSets && setId !== 'all') {
        allSetIds = [setId];
        
        const setsResult = await getSets(
          {
            parentSetId: setId,
          },
          true, // Force refetch
        );

        if (setsResult?.data?.data?.sets && setsResult?.data?.data?.sets?.length > 0) {
          const subsetIds = setsResult.data.data.sets.map((set) => set.id);
          allSetIds = [setId, ...subsetIds];
        }
      }

      // Fetch all cards with goal data
      let allCards: any[] = [];
      let offset = 0;
      const limit = 500;
      let hasMore = true;

      while (hasMore) {
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
            ],
            limit,
            offset,
            ...(setId !== 'all' && {
              setId: {
                OR: allSetIds || [setId],
              },
            }),
            userId,
            goalId,
            showGoalProgress: true,
            priceType: priceType.toLowerCase() as 'market' | 'low' | 'average' | 'high',
            ...(useOneResultPerCardName && { oneResultPerCardName: true }),
          },
          true, // Force refetch
        );

        if (!cardsResult.data?.data?.cards) {
          break;
        }

        allCards = [...allCards, ...cardsResult.data.data.cards];

        // Check if there are more cards to fetch
        const totalCount = cardsResult.data.data.totalCount || 0;
        offset += limit;
        hasMore = offset < totalCount;
      }

      if (allCards.length === 0) {
        enqueueSnackbar(setId === 'all' ? 'No cards found for this goal.' : 'No cards found in this set.', {
          variant: 'error',
        });
        return;
      }

      // Filter cards that need to be purchased for the goal
      const cardsNeededForGoal: CardWithQuantity[] = [];

      allCards.forEach((card) => {
        // Skip cards that are fully met for the goal
        if (card.goalFullyMet) {
          return;
        }

        // Calculate the total needed quantity
        // TCGPlayer mass import doesn't distinguish between regular and foil,
        // so we need to sum up the needs
        // Goals can specify either:
        // 1. Specific regular/foil needs (goalRegNeeded + goalFoilNeeded)
        // 2. Any type needs (goalAllNeeded)
        const regNeeded = card.goalRegNeeded || 0;
        const foilNeeded = card.goalFoilNeeded || 0;
        const allNeeded = card.goalAllNeeded || 0;

        // Use goalAllNeeded if specified, otherwise sum regular and foil
        const totalNeeded = allNeeded > 0 ? allNeeded : regNeeded + foilNeeded;

        if (totalNeeded > 0) {
          cardsNeededForGoal.push({
            ...card,
            neededQuantity: totalNeeded,
          });
        }
      });

      if (cardsNeededForGoal.length === 0) {
        enqueueSnackbar(
          setId === 'all'
            ? 'You already have all the cards needed for this goal!'
            : 'You already have all the cards needed for this goal in this set!',
          { variant: 'info' },
        );
        return;
      }

      // Check if we need to chunk the cards
      if (cardsNeededForGoal.length > 1000) {
        setCardsForChunking(cardsNeededForGoal);
        setShowChunksDialog(true);
      } else {
        // Submit immediately for 1000 or fewer cards
        const importString = formatMassImportString(cardsNeededForGoal, 1, false);
        const formTarget = getFormTarget();
        submitToTCGPlayer(importString, formTarget);
      }
    } catch (error) {
      enqueueSnackbar('There was an error preparing your card list. Please try again.', { variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [setId, userId, goalId, includeSubsetsInSets, isLoading, priceType, getCards, getSets, getGoal, submitToTCGPlayer, enqueueSnackbar]);

  return (
    <>
      <Button
        variant="outlined"
        disabled={isLoading}
        onClick={handleClick}
        size="small"
        sx={{
          textTransform: 'none',
          py: 0.5,
          ...buttonProps.sx,
        }}
        {...buttonProps}
      >
        {children || 'Buy missing cards for this goal'}
      </Button>
      
      <TCGPlayerMassImportChunksDialog
        open={showChunksDialog}
        onClose={() => setShowChunksDialog(false)}
        cards={cardsForChunking}
      />
    </>
  );
};

export default TCGPlayerGoalMassImportButton;
