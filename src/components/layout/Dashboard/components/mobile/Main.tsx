'use client';

import { styled } from '@mui/material/styles';
import { SessionMessageBanner } from '@/components/common/SessionMessageBanner';

interface MainProps {
  children: React.ReactNode;
}

const Main = ({ children }: MainProps) => {
  return (
    <StyledMain>
      <SessionMessageBanner />
      {children}
    </StyledMain>
  );
};

const StyledMain = styled('main')(({ theme }) => ({
  flexGrow: 1,
  padding: `${theme.spacing(1)} ${theme.spacing(3)} ${theme.spacing(3)} ${theme.spacing(3)}`,
  marginTop: theme.spacing(8), // Account for fixed header
  [theme.breakpoints.up('sm')]: {
    padding: `${theme.spacing(2)} ${theme.spacing(3)} ${theme.spacing(3)} ${theme.spacing(3)}`,
  },
  [theme.breakpoints.up('md')]: {
    display: 'none',
  },
}));

export default Main;
