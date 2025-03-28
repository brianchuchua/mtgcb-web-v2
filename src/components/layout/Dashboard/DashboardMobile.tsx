'use client';

import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import { ReactNode } from 'react';
import Header from './components/mobile/Header';
import Main from './components/mobile/Main';
import Sidenav from './components/mobile/Sidenav';

interface DashboardMobileProps {
  children: ReactNode;
}

export const DashboardMobile = ({ children }: DashboardMobileProps) => {
  return (
    <StyledDashboardMobile>
      <Header />
      <Sidenav />
      <Main>{children}</Main>
    </StyledDashboardMobile>
  );
};

const StyledDashboardMobile = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  [theme.breakpoints.up('md')]: {
    display: 'none',
  },
}));
