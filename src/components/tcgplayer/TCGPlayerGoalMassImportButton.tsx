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
import TCGPlayerSplitByFinishDialog from './TCGPlayerSplitByFinishDialog';
import TCGPlayerSplitByFinishChunksDialog from './TCGPlayerSplitByFinishChunksDialog';
import TCGPlayerFoilOnlyDialog from './TCGPlayerFoilOnlyDialog';

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
  const [showSplitByFinishDialog, setShowSplitByFinishDialog] = useState(false);
  const [showSplitByFinishChunksDialog, setShowSplitByFinishChunksDialog] = useState(false);
  const [regularCardsForSplit, setRegularCardsForSplit] = useState<CardWithQuantity[]>([]);
  const [foilCardsForSplit, setFoilCardsForSplit] = useState<CardWithQuantity[]>([]);
  const [showFoilOnlyDialog, setShowFoilOnlyDialog] = useState(false);
  const [isFoilOnlyImport, setIsFoilOnlyImport] = useState(false);
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
      const regularCardsNeeded: CardWithQuantity[] = [];
      const foilCardsNeeded: CardWithQuantity[] = [];
      let hasRegularNeeds = false;
      let hasFoilNeeds = false;

      allCards.forEach((card) => {
        // Skip cards that are fully met for the goal
        if (card.goalFullyMet) {
          return;
        }

        // Calculate the total needed quantity
        // Goals can specify either:
        // 1. Specific regular/foil needs (goalRegNeeded + goalFoilNeeded)
        // 2. Any type needs (goalAllNeeded)
        const regNeeded = card.goalRegNeeded || 0;
        const foilNeeded = card.goalFoilNeeded || 0;
        const allNeeded = card.goalAllNeeded || 0;

        // If goal specifies "any" type needs, we'll treat them as regular for simplicity
        if (allNeeded > 0) {
          cardsNeededForGoal.push({
            ...card,
            neededQuantity: allNeeded,
          });
        } else {
          // Goal specifies specific regular/foil needs
          if (regNeeded > 0) {
            hasRegularNeeds = true;
            regularCardsNeeded.push({
              ...card,
              neededQuantity: regNeeded,
            });
          }
          if (foilNeeded > 0) {
            hasFoilNeeds = true;
            foilCardsNeeded.push({
              ...card,
              neededQuantity: foilNeeded,
            });
          }
        }
      });

      // If we have both regular and foil needs, we need to split them
      const needsSplitByFinish = hasRegularNeeds && hasFoilNeeds;
      const isFoilOnly = hasFoilNeeds && !hasRegularNeeds;
      
      // Combine all cards if we're not splitting by finish
      if (!needsSplitByFinish) {
        cardsNeededForGoal.push(...regularCardsNeeded, ...foilCardsNeeded);
      }

      const totalCardsNeeded = needsSplitByFinish 
        ? regularCardsNeeded.length + foilCardsNeeded.length 
        : cardsNeededForGoal.length;

      if (totalCardsNeeded === 0) {
        enqueueSnackbar(
          setId === 'all'
            ? 'You already have all the cards needed for this goal!'
            : 'You already have all the cards needed for this goal in this set!',
          { variant: 'info' },
        );
        return;
      }

      // Determine which dialog to show based on the needs
      if (needsSplitByFinish) {
        // Need to split by finish
        setRegularCardsForSplit(regularCardsNeeded);
        setFoilCardsForSplit(foilCardsNeeded);
        
        // Check if either regular or foil cards exceed 1000
        if (regularCardsNeeded.length > 1000 || foilCardsNeeded.length > 1000) {
          setShowSplitByFinishChunksDialog(true);
        } else {
          setShowSplitByFinishDialog(true);
        }
      } else if (isFoilOnly) {
        // Foil-only import
        setIsFoilOnlyImport(true);
        if (cardsNeededForGoal.length > 1000) {
          // For large foil-only orders, use chunks dialog but mark as foil-only
          setCardsForChunking(cardsNeededForGoal);
          setShowChunksDialog(true);
        } else {
          // For small foil-only orders, show the foil reminder dialog
          setFoilCardsForSplit(cardsNeededForGoal);
          setShowFoilOnlyDialog(true);
        }
      } else {
        // Regular cards only or "any" type cards
        if (cardsNeededForGoal.length > 1000) {
          setCardsForChunking(cardsNeededForGoal);
          setShowChunksDialog(true);
        } else {
          // Submit immediately for 1000 or fewer cards
          const importString = formatMassImportString(cardsNeededForGoal, 1, false);
          const formTarget = getFormTarget();
          submitToTCGPlayer(importString, formTarget);
        }
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
        onClose={() => {
          setShowChunksDialog(false);
          setIsFoilOnlyImport(false);
        }}
        cards={cardsForChunking}
        isFoilOnly={isFoilOnlyImport}
      />
      
      <TCGPlayerSplitByFinishDialog
        open={showSplitByFinishDialog}
        onClose={() => setShowSplitByFinishDialog(false)}
        regularCards={regularCardsForSplit}
        foilCards={foilCardsForSplit}
      />
      
      <TCGPlayerSplitByFinishChunksDialog
        open={showSplitByFinishChunksDialog}
        onClose={() => setShowSplitByFinishChunksDialog(false)}
        regularCards={regularCardsForSplit}
        foilCards={foilCardsForSplit}
      />
      
      <TCGPlayerFoilOnlyDialog
        open={showFoilOnlyDialog}
        onClose={() => setShowFoilOnlyDialog(false)}
        foilCards={foilCardsForSplit}
      />
    </>
  );
};

export default TCGPlayerGoalMassImportButton;
