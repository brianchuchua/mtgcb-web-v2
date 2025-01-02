'use client';

import { ReactNode, createContext, useContext, useState, useEffect } from 'react';
import { useMediaQuery, useTheme } from '@mui/material';

interface DashboardContextProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isMobile: boolean;
  sidenavWidth: number;
}

const DashboardContext = createContext<DashboardContextProps | undefined>(undefined);

interface DashboardProviderProps {
  children: ReactNode;
  sidenavWidth?: number;
}

export const DashboardProvider = ({ children, sidenavWidth = 320 }: DashboardProviderProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isOpen, setIsOpen] = useState(false);

  // Set initial drawer state based on viewport
  useEffect(() => {
    setIsOpen(!isMobile);
  }, [isMobile]);

  return (
    <DashboardContext.Provider value={{ isOpen, setIsOpen, isMobile, sidenavWidth }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboardContext = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboardContext must be used within a LayoutProvider');
  }
  return context;
};