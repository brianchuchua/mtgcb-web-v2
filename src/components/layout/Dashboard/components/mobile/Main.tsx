'use client';

import { styled } from '@mui/material/styles';

interface MainProps {
  children: React.ReactNode;
}

const Main = ({ children }: MainProps) => {
  return <StyledMain>{children}</StyledMain>;
};

const StyledMain = styled('main')(({ theme }) => ({
  flexGrow: 1,
  padding: `${theme.spacing(1)} ${theme.spacing(3)} ${theme.spacing(3)} ${theme.spacing(3)}`,
  marginTop: theme.spacing(8), // Account for fixed header
}));

export default Main;
