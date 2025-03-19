'use client';

import { ReactNode, createContext, useContext, useState } from 'react';

interface DashboardContextProps {
  isDesktopOpen: boolean;
  isMobileOpen: boolean;
  setDesktopOpen: (open: boolean) => void;
  setMobileOpen: (open: boolean) => void;
  sidenavWidth: number;
}

const DashboardContext = createContext<DashboardContextProps | undefined>(undefined);

interface DashboardProviderProps {
  children: ReactNode;
  sidenavWidth?: number;
}

export const DashboardProvider = ({ children, sidenavWidth = 320 }: DashboardProviderProps) => {
  const [isDesktopOpen, setDesktopOpen] = useState(true);
  const [isMobileOpen, setMobileOpen] = useState(false);

  return (
    <DashboardContext.Provider
      value={{
        isDesktopOpen,
        isMobileOpen,
        setDesktopOpen,
        setMobileOpen,
        sidenavWidth,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboardContext = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboardContext must be used within a DashboardProvider');
  }
  return context;
};
