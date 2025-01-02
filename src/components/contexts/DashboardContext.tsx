'use client';

import { ReactNode, createContext, useContext, useState } from 'react';

interface DashboardContextProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const DashboardContext = createContext<DashboardContextProps | undefined>(undefined);

export const DashboardProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <DashboardContext.Provider value={{ isOpen, setIsOpen }}>{children}</DashboardContext.Provider>
  );
};

export const useDashboardContext = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboardContext must be used within a LayoutProvider');
  }
  return context;
};
