'use client';

import { Button, ButtonProps, CircularProgress } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useCallback, useState } from 'react';
import { useFetchCardsForMassImport } from './useFetchCardsForMassImport';
import { CountType } from '@/components/tcgplayer/useFetchCardsForMassImport';
import { useTCGPlayer } from '@/context/TCGPlayerContext';
import { getFormTarget } from '@/utils/browser/detectSafari';
import { formatMassImportString } from '@/utils/tcgplayer/formatMassImportString';

interface TCGPlayerMassImportButtonProps extends Omit<ButtonProps, 'onClick'> {
  setId: string;
  count: number;
  countType: CountType;
  children?: React.ReactNode;
  includeSubsetsInSets?: boolean;
  userId?: number; // Optional - when provided, only missing cards will be included
}

const TCGPlayerMassImportButton: React.FC<TCGPlayerMassImportButtonProps> = ({
  setId,
  count,
  countType,
  children,
  includeSubsetsInSets = false,
  userId,
  ...buttonProps
}) => {
  const { submitToTCGPlayer } = useTCGPlayer();
  const { enqueueSnackbar } = useSnackbar();
  const [localIsLoading, setLocalIsLoading] = useState(false);

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
  });

  const handleClick = useCallback(async () => {
    if (isHookLoading || localIsLoading) return;

    try {
      setLocalIsLoading(true);

      const cards = await fetchCards();

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
      const importString = formatMassImportString(cards, count, isDraftCube);

      const formTarget = getFormTarget();
      submitToTCGPlayer(importString, formTarget);
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
    enqueueSnackbar,
  ]);

  const isLoading = isHookLoading || localIsLoading;

  return (
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
  );
};

export default TCGPlayerMassImportButton;
