'use client';

import { Button, ButtonProps, CircularProgress } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
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
  const [triggerFetch, setTriggerFetch] = useState(false);
  const [processingForm, setProcessingForm] = useState(false);

  const {
    cards,
    isLoading: isLoadingCards,
    isError,
  } = useFetchCardsForMassImport({
    setId,
    countType,
    enabled: triggerFetch,
    includeSubsetsInSets,
  });

  const handleClick = useCallback(() => {
    if (!isLoadingCards && !processingForm) {
      setTriggerFetch(true);
    }
  }, [setId, count, countType, isLoadingCards, processingForm]);

  useEffect(() => {
    if (!triggerFetch || isLoadingCards) return;

    const processCards = async () => {
      try {
        setProcessingForm(true);

        const validCards = cards || [];

        if (validCards.length === 0) {
          // TODO: An error toast perhaps, should be rare
          setTriggerFetch(false);
          return;
        }

        const importString = formatMassImportString(validCards, count);
        const formTarget = getFormTarget();

        submitToTCGPlayer(importString, formTarget);

        setTriggerFetch(false);
      } catch (error) {
        alert('There was an error preparing your card list. Please try again.');
        setTriggerFetch(false);
      } finally {
        setProcessingForm(false);
      }
    };

    if (cards && cards.length > 0) {
      processCards();
    }
  }, [cards, count, setId, countType, triggerFetch, isLoadingCards, submitToTCGPlayer]);

  if (isError && triggerFetch) {
    setTriggerFetch(false);
  }

  const isLoading = isLoadingCards || processingForm;

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
