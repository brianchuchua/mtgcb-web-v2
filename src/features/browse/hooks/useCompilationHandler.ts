import React, { useEffect, useRef } from 'react';
import { useSnackbar } from 'notistack';
import { Button } from '@mui/material';
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import {
  setCompilationState,
  incrementRetryCount,
  resetCompilationState,
} from '@/redux/slices/compilationSlice';

interface UseCompilationHandlerProps {
  refetch: () => void;
}

export const useCompilationHandler = ({ refetch }: UseCompilationHandlerProps) => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const dispatch = useAppDispatch();
  const compilationState = useAppSelector((state) => state.compilation);
  const retryTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const snackbarKeyRef = useRef<string | number | undefined>(undefined);

  useEffect(() => {
    if (compilationState.isCompiling) {
      const maxRetries = 5;
      
      // Check if we need to update the message after max retries
      if (compilationState.retryCount >= maxRetries && snackbarKeyRef.current) {
        // Close the old notification and show the new one
        closeSnackbar(snackbarKeyRef.current);
        snackbarKeyRef.current = enqueueSnackbar(
          'Goal compilation is taking longer than expected. Please try again later.',
          {
            variant: 'info',
            persist: true,
            action: React.createElement(
              Button,
              {
                color: 'inherit',
                size: 'small',
                onClick: () => {
                  refetch();
                },
              },
              'Retry Now'
            ),
          }
        );
      } else if (!snackbarKeyRef.current) {
        // Create initial notification
        snackbarKeyRef.current = enqueueSnackbar(
          compilationState.message || 'Your collection goal is being updated...',
          {
            variant: 'info',
            persist: true,
            action: React.createElement(
              Button,
              {
                color: 'inherit',
                size: 'small',
                onClick: () => {
                  refetch();
                },
              },
              'Retry Now'
            ),
          }
        );
      }

      // Implement smart retry with exponential backoff
      if (compilationState.retryCount < maxRetries) {
        // Custom delays: 2s, 5s, 10s, 20s, 35s
        const delays = [2000, 5000, 10000, 20000, 35000];
        const delay = delays[compilationState.retryCount] || 35000;

        retryTimeoutRef.current = setTimeout(() => {
          dispatch(incrementRetryCount());
          refetch();
        }, delay);
      }
    } else if (snackbarKeyRef.current) {
      // Compilation complete - close notification
      closeSnackbar(snackbarKeyRef.current);
      snackbarKeyRef.current = undefined;
      if (compilationState.retryCount > 0) {
        enqueueSnackbar('Goal compilation complete!', { variant: 'success' });
      }
      dispatch(resetCompilationState());
    }

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [
    compilationState.isCompiling,
    compilationState.message,
    compilationState.retryCount,
    refetch,
    dispatch,
    enqueueSnackbar,
    closeSnackbar,
  ]);

  return {
    isCompiling: compilationState.isCompiling,
    compilationMessage: compilationState.message,
    retryCount: compilationState.retryCount,
  };
};