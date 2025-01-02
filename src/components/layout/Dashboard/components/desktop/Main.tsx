'use client';

import { styled } from '@mui/material/styles';
import { useDashboardContext } from '@/components/layout/Dashboard/context/DashboardContext';

interface MainProps {
  children: React.ReactNode;
}

const Main = ({ children }: MainProps) => {
  const { isDesktopOpen, sidenavWidth } = useDashboardContext();

  return <StyledMain open={isDesktopOpen} sidenavwidth={sidenavWidth}>{children}</StyledMain>;
};

interface StyledMainProps {
  open: boolean;
  sidenavwidth: number;
}

const StyledMain = styled('main', {
  shouldForwardProp: (prop) => prop !== 'open' && prop !== 'sidenavwidth',
})<StyledMainProps>(({ theme, open, sidenavwidth }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  marginLeft: open ? `${sidenavwidth}px` : 0,
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  [theme.breakpoints.down('sm')]: {
    display: 'none',
  },
}));

export default Main;