'use client';

import { styled } from '@mui/material/styles';
import { useDashboardContext } from '@/components/contexts/DashboardContext';

interface MainProps {
  sidenavWidth: number;
  children: React.ReactNode;
}

const Main = ({ sidenavWidth, children }: MainProps) => {
  const { isOpen } = useDashboardContext();

  const StyledMain = styled('main')(({ theme }) => ({
    flexGrow: 1,
    padding: theme.spacing(3),
    marginLeft: isOpen ? 0 : `-${sidenavWidth}px`,
  }));

  return <StyledMain>{children}</StyledMain>;
};

export default Main;
