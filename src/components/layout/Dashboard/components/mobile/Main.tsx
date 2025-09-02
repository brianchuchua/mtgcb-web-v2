'use client';

import { styled } from '@mui/material/styles';
import { SessionMessageBanner } from '@/components/common/SessionMessageBanner';
import Footer from '@/components/layout/Footer';

interface MainProps {
  children: React.ReactNode;
}

const Main = ({ children }: MainProps) => {
  return (
    <StyledMain>
      <MainContent>
        <SessionMessageBanner />
        {children}
      </MainContent>
      <Footer />
    </StyledMain>
  );
};

const StyledMain = styled('main')(({ theme }) => ({
  flexGrow: 1,
  marginTop: theme.spacing(8), // Account for fixed header
  display: 'flex',
  flexDirection: 'column',
  [theme.breakpoints.up('md')]: {
    display: 'none',
  },
}));

const MainContent = styled('div')(({ theme }) => ({
  padding: `${theme.spacing(1)} ${theme.spacing(3)} ${theme.spacing(3)} ${theme.spacing(3)}`,
  minHeight: 'calc(100vh - 64px)', // Full viewport minus header, pushes footer below fold
  [theme.breakpoints.up('sm')]: {
    padding: `${theme.spacing(2)} ${theme.spacing(3)} ${theme.spacing(3)} ${theme.spacing(3)}`,
  },
}));

export default Main;
