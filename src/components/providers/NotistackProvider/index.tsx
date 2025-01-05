'use client';

import { SnackbarProvider as NotistackProvider } from 'notistack';
import { ReactNode, useEffect, useState } from 'react';

export default function SnackbarProvider({ children }: { children: ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 600); // Material's default breakpoint for mobile
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <NotistackProvider
      maxSnack={3}
      autoHideDuration={8000}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: isMobile ? 'center' : 'left',
      }}
      style={{ marginBottom: '24px' }}
    >
      {children}
    </NotistackProvider>
  );
}
