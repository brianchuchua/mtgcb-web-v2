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
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <DashboardProvider sidenavWidth={sidenavWidth}>
      {!isMobile && <DashboardDesktop>{children}</DashboardDesktop>}
      {isMobile && <DashboardMobile>{children}</DashboardMobile>}
    </DashboardProvider>
  );
};

export default Dashboard;
