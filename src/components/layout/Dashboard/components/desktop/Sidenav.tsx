'use client';

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { Drawer, IconButton } from '@mui/material';
import { Theme, styled } from '@mui/material/styles';
import { SidenavItems } from '@/components/layout/Dashboard/components/shared/SidenavItems';
import { useDashboardContext } from '@/components/layout/Dashboard/context/DashboardContext';

const Sidenav = () => {
  const { isDesktopOpen, setDesktopOpen, sidenavWidth } = useDashboardContext();

  return (
    <StyledDrawer
      sx={{
        width: sidenavWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: sidenavWidth,
          boxSizing: 'border-box',
        },
      }}
      variant="persistent"
      anchor="left"
      open={isDesktopOpen}
    >
      <SidenavHeader>
        <IconButton onClick={() => setDesktopOpen(!isDesktopOpen)}>
          <ChevronLeftIcon />
        </IconButton>
      </SidenavHeader>
      <SidenavItems />
    </StyledDrawer>
  );
};

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  [theme.breakpoints.down('sm')]: {
    display: 'none',
  },
}));

const SidenavHeader = styled('div')(({ theme }: { theme: Theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

export default Sidenav;
