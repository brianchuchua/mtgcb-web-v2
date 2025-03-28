'use client';

import { Drawer } from '@mui/material';
import { styled } from '@mui/material/styles';
import { SidenavItems } from '@/components/layout/Dashboard/components/shared/SidenavItems';
import { useDashboardContext } from '@/components/layout/Dashboard/context/DashboardContext';

const Sidenav = () => {
  const { isDesktopOpen, sidenavWidth } = useDashboardContext();

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
      <SidenavItems />
    </StyledDrawer>
  );
};

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  [theme.breakpoints.down('md')]: {
    display: 'none',
  },
}));

export default Sidenav;
