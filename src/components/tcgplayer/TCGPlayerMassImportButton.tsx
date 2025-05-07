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
}

const TCGPlayerMassImportButton: React.FC<TCGPlayerMassImportButtonProps> = ({
  setId,
  count,
  countType,
  children,
  includeSubsetsInSets = false,
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
  });

  const handleClick = useCallback(async () => {
    if (isHookLoading || localIsLoading) return;

    try {
      setLocalIsLoading(true);

      const cards = await fetchCards();

      if (!cards || cards.length === 0) {
        enqueueSnackbar('No matching cards found with TCGPlayer IDs.', { variant: 'error' });
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
      {isLoading ? <CircularProgress size={16} color="inherit" /> : children || `Buy ${count}x`}
    </Button>
  );
};

export default TCGPlayerMassImportButton;
