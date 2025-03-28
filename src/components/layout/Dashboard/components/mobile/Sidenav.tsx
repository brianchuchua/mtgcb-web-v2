'use client';

import { Drawer } from '@mui/material';
import { styled } from '@mui/material/styles';
import { SidenavItems } from '@/components/layout/Dashboard/components/shared/SidenavItems';
import { useDashboardContext } from '@/components/layout/Dashboard/context/DashboardContext';

const Sidenav = () => {
  const { isMobileOpen, setMobileOpen, sidenavWidth } = useDashboardContext();

  const handleClose = () => {
    setMobileOpen(false);
  };

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
      onClose={handleClose}
      elevation={0}
    >
      <SidenavItems onNavigate={handleClose} />
    </StyledDrawer>
  );
};

const StyledDrawer = styled(Drawer)(() => ({}));

export default Sidenav;
