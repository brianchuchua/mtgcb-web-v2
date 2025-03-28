'use client';

import { useMediaQuery, useTheme } from '@mui/material';
import { ReactNode } from 'react';
import { DashboardDesktop } from './DashboardDesktop';
import { DashboardMobile } from './DashboardMobile';
import { DashboardProvider } from './context/DashboardContext';

interface DashboardProps {
  sidenavWidth?: number;
  children: ReactNode;
}

const Dashboard = ({ children, sidenavWidth = 320 }: DashboardProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <DashboardProvider sidenavWidth={sidenavWidth}>
      {isMobile ? (
        <DashboardMobile>{children}</DashboardMobile>
      ) : (
        <DashboardDesktop>{children}</DashboardDesktop>
      )}
    </DashboardProvider>
  );
};

export default Dashboard;
