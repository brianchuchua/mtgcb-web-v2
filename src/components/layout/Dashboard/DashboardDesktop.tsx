'use client';

import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import { ReactNode } from 'react';
import Header from './components/desktop/Header';
import Main from './components/desktop/Main';
import Sidenav from './components/desktop/Sidenav';

interface DashboardDesktopProps {
  children: ReactNode;
}

export const DashboardDesktop = ({ children }: DashboardDesktopProps) => {
  return (
    <StyledDashboardDesktop>
      <Header />
      <Sidenav />
      <Main>{children}</Main>
    </StyledDashboardDesktop>
  );
};

const StyledDashboardDesktop = styled(Box)(({ theme }) => ({
  display: 'flex',
  [theme.breakpoints.down('sm')]: {
    display: 'none',
  },
}));