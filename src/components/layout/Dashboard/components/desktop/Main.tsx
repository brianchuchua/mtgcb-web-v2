'use client';

import { styled } from '@mui/material/styles';
import { useDashboardContext } from '@/components/layout/Dashboard/context/DashboardContext';
import { SessionMessageBanner } from '@/components/common/SessionMessageBanner';
import Footer from '@/components/layout/Footer';

interface MainProps {
  children: React.ReactNode;
}

const Main = ({ children }: MainProps) => {
  const { isDesktopOpen, sidenavWidth } = useDashboardContext();

  return (
    <StyledMain open={isDesktopOpen} sidenavwidth={sidenavWidth}>
      <MainContent>
        <SessionMessageBanner />
        {children}
      </MainContent>
      <Footer />
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
  display: 'flex',
  flexDirection: 'column',
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  [theme.breakpoints.down('md')]: {
    display: 'none',
  },
}));

const MainContent = styled('div')(({ theme }) => ({
  width: '100%',
  padding: `${theme.spacing(2)} ${theme.spacing(4)} ${theme.spacing(4)} ${theme.spacing(4)}`,
  minHeight: 'calc(100vh - 64px)', // Full viewport minus header, pushes footer below fold
}));
