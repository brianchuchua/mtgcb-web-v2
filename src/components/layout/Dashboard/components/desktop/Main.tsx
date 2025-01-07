'use client';

import { styled } from '@mui/material/styles';
import { useDashboardContext } from '@/components/layout/Dashboard/context/DashboardContext';

interface MainProps {
  children: React.ReactNode;
}

const Main = ({ children }: MainProps) => {
  const { isDesktopOpen, sidenavWidth } = useDashboardContext();

  return (
    <StyledMain open={isDesktopOpen} sidenavwidth={sidenavWidth}>
      <MainContent>
        {children}
      </MainContent>
    </StyledMain>
  );
};

export default Main;

interface StyledMainProps {
  open: boolean;
  sidenavwidth: number;
}

const StyledMain = styled('main', {
  shouldForwardProp: (prop) => prop !== 'open' && prop !== 'sidenavwidth',
})<StyledMainProps>(({ theme, open, sidenavwidth }) => ({
  flexGrow: 1,
  marginLeft: open ? `${sidenavwidth}px` : 0,
  paddingTop: '64px',
  minHeight: '100vh',
  display: 'flex',
  justifyContent: 'center',
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  [theme.breakpoints.down('sm')]: {
    display: 'none',
  },
}));

const MainContent = styled('div')(({ theme }) => ({
  width: '100%',
  padding: theme.spacing(4),
}));
