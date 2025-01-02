'use client';

import { styled } from '@mui/material/styles';
import { useDashboardContext } from '@/components/contexts/DashboardContext';

interface MainProps {
  children: React.ReactNode;
}

const Main = ({ children }: MainProps) => {
  const { isOpen, isMobile, sidenavWidth } = useDashboardContext();

  const StyledMain = styled('main')(({ theme }) => ({
    flexGrow: 1,
    padding: theme.spacing(3),
    marginLeft: (!isMobile && isOpen) ? `${sidenavWidth}px` : 0,
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  }));

  return <StyledMain>{children}</StyledMain>;
};

export default Main;