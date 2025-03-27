'use client';

import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import { SnackbarProvider as NotistackProvider, SnackbarKey } from 'notistack';
import { ReactNode, useEffect, useRef, useState } from 'react';

type SnackbarProviderRef = {
  closeSnackbar: (key: SnackbarKey) => void;
};

export default function SnackbarProvider({ children }: { children: ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);
  // Create a ref with proper typing and initial value
  const notistackRef = useRef<SnackbarProviderRef | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 600); // Material's default breakpoint for mobile
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Custom action to close snackbar
  const onClickDismiss = (key: SnackbarKey) => {
    if (notistackRef.current) {
      notistackRef.current.closeSnackbar(key);
    }
  };

  return (
    <NotistackProvider
      maxSnack={3}
      autoHideDuration={8000}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: isMobile ? 'center' : 'right',
      }}
      // Store the ref to get access to the closeSnackbar function
      ref={(ref) => {
        notistackRef.current = ref;
      }}
      action={(key) => (
        <IconButton size="small" onClick={() => onClickDismiss(key)} sx={{ color: 'white' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      )}
    >
      {children}
    </NotistackProvider>
  );
}
