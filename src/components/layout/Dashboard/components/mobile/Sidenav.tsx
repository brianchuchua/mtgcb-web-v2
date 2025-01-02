'use client';

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { Drawer, IconButton } from '@mui/material';
import { Theme, styled } from '@mui/material/styles';
import { useDashboardContext } from '@/components/layout/Dashboard/context/DashboardContext';

const Sidenav = () => {
  const { isMobileOpen, setMobileOpen, sidenavWidth } = useDashboardContext();

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
      variant="temporary"
      anchor="left"
      open={isMobileOpen}
      onClose={() => setMobileOpen(false)}
    >
      <SidenavHeader>
        <IconButton onClick={() => setMobileOpen(false)}>
          <ChevronLeftIcon />
        </IconButton>
      </SidenavHeader>
      Mobile Drawer Content
    </StyledDrawer>
  );
};

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  [theme.breakpoints.up('sm')]: {
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