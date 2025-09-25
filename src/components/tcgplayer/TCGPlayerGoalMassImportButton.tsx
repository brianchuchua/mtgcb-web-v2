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
import TCGPlayerGoalLazyChunksDialog from './TCGPlayerGoalLazyChunksDialog';

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
  const [showLazyChunksDialog, setShowLazyChunksDialog] = useState(false);
  const [lazyChunksConfig, setLazyChunksConfig] = useState<{
    initialCards: CardWithQuantity[];
    totalCount: number;
    hasRegularNeeds: boolean;
    hasFoilNeeds: boolean;
    goalConfig: {
      onePrintingPerPureName: boolean;
      priceType: string;
      allSetIds?: string[];
    };
    initialRegularCards?: CardWithQuantity[];
    initialFoilCards?: CardWithQuantity[];
  } | null>(null);
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

      // Fetch first batch to determine if we need lazy loading
      const firstBatchResult = await getCards(
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
          limit: 500,
          offset: 0,
          ...(setId !== 'all' && {
            setId: {
              OR: allSetIds || [setId],
            },
          }),
          userId,
          goalId,
          showGoalProgress: true,
          showGoals: 'incomplete' as const,
          priceType: priceType.toLowerCase() as 'market' | 'low' | 'average' | 'high',
          ...(useOneResultPerCardName && { oneResultPerCardName: true }),
        },
        true, // Force refetch
      );

      if (!firstBatchResult.data?.data?.cards) {
        enqueueSnackbar('Failed to fetch cards. Please try again.', { variant: 'error' });
        return;
      }

      const totalCount = firstBatchResult.data.data.totalCount || 0;
      const firstBatchCards = firstBatchResult.data.data.cards;
      let allCards = firstBatchCards;

      // If total count > 500, we'll use lazy loading
      // Otherwise, fetch all remaining cards
      if (totalCount > 500 && totalCount > firstBatchCards.length) {
        // Will use lazy loading - don't fetch more
      } else if (totalCount > firstBatchCards.length) {
        // Total is 500 or less but we didn't get all in first batch (shouldn't happen)
        // Fetch remaining cards
        let offset = 500;
        while (offset < totalCount) {
          const nextBatchResult = await getCards(
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
              limit: 500,
              offset,
              ...(setId !== 'all' && {
                setId: {
                  OR: allSetIds || [setId],
                },
              }),
              userId,
              goalId,
              showGoalProgress: true,
              showGoals: 'incomplete' as const,
              priceType: priceType.toLowerCase() as 'market' | 'low' | 'average' | 'high',
              ...(useOneResultPerCardName && { oneResultPerCardName: true }),
            },
            true, // Force refetch
          );

          if (!nextBatchResult.data?.data?.cards) {
            break;
          }

          allCards = [...allCards, ...nextBatchResult.data.data.cards];
          offset += 500;
        }
      }

      // With showGoals: 'incomplete', if we get 0 cards, the goal is complete
      if (totalCount === 0) {
        enqueueSnackbar(
          setId === 'all'
            ? 'You already have all the cards needed for this goal!'
            : 'You already have all the cards needed for this goal in this set!',
          { variant: 'info' },
        );
        return;
      }

      // Process cards that need to be purchased for the goal
      // With showGoals: 'incomplete', all returned cards are ones we need
      const cardsNeededForGoal: CardWithQuantity[] = [];
      const regularCardsNeeded: CardWithQuantity[] = [];
      const foilCardsNeeded: CardWithQuantity[] = [];
      let hasRegularNeeds = false;
      let hasFoilNeeds = false;

      allCards.forEach((card) => {
        // With showGoals: 'incomplete', we only get cards that aren't fully met
        // No need to check goalFullyMet anymore

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

      // Check if we should use lazy loading (when total count from API > 500)
      // Since we're using showGoals: 'incomplete', totalCount is the number of incomplete cards
      const shouldUseLazyLoading = totalCount > 500;


      // Only check for empty cards if we're not using lazy loading
      // With lazy loading, we might have more cards in subsequent chunks
      if (!shouldUseLazyLoading && totalCardsNeeded === 0) {
        enqueueSnackbar(
          setId === 'all'
            ? 'You already have all the cards needed for this goal!'
            : 'You already have all the cards needed for this goal in this set!',
          { variant: 'info' },
        );
        return;
      }

      if (shouldUseLazyLoading) {
        // Use lazy loading for large orders
        // totalCount from API is the total number of incomplete cards
        setLazyChunksConfig({
          initialCards: cardsNeededForGoal,
          totalCount: totalCount, // This is already the count of incomplete cards from API
          hasRegularNeeds: hasRegularNeeds,
          hasFoilNeeds: hasFoilNeeds,
          goalConfig: {
            onePrintingPerPureName: useOneResultPerCardName,
            priceType: priceType.toLowerCase(),
            allSetIds: allSetIds,
          },
          initialRegularCards: regularCardsNeeded,
          initialFoilCards: foilCardsNeeded,
        });
        setShowLazyChunksDialog(true);
      } else {
        // Use existing logic for small orders (500 or fewer cards total)
        if (needsSplitByFinish) {
          // Need to split by finish
          setRegularCardsForSplit(regularCardsNeeded);
          setFoilCardsForSplit(foilCardsNeeded);

          // Check if either regular or foil cards exceed 500
          if (regularCardsNeeded.length > 500 || foilCardsNeeded.length > 500) {
            setShowSplitByFinishChunksDialog(true);
          } else {
            setShowSplitByFinishDialog(true);
          }
        } else if (isFoilOnly) {
          // Foil-only import
          setIsFoilOnlyImport(true);
          if (cardsNeededForGoal.length > 500) {
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
          if (cardsNeededForGoal.length > 500) {
            setCardsForChunking(cardsNeededForGoal);
            setShowChunksDialog(true);
          } else {
            // Submit immediately for 500 or fewer cards
            const importString = formatMassImportString(cardsNeededForGoal, 1, false);
            const formTarget = getFormTarget();
            submitToTCGPlayer(importString, formTarget);
          }
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

      {lazyChunksConfig && (
        <TCGPlayerGoalLazyChunksDialog
          open={showLazyChunksDialog}
          onClose={() => {
            setShowLazyChunksDialog(false);
            setLazyChunksConfig(null);
          }}
          userId={userId}
          goalId={goalId}
          setId={setId}
          includeSubsetsInSets={includeSubsetsInSets}
          initialCards={lazyChunksConfig.initialCards}
          totalCount={lazyChunksConfig.totalCount}
          hasRegularNeeds={lazyChunksConfig.hasRegularNeeds}
          hasFoilNeeds={lazyChunksConfig.hasFoilNeeds}
          goalConfig={lazyChunksConfig.goalConfig}
          initialRegularCards={lazyChunksConfig.initialRegularCards}
          initialFoilCards={lazyChunksConfig.initialFoilCards}
        />
      )}
    </>
  );
};

export default TCGPlayerGoalMassImportButton;
