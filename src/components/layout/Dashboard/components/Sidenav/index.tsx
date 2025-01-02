'use client';

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { Drawer, IconButton } from '@mui/material';
import { Theme, styled } from '@mui/material/styles';
import { useDashboardContext } from '@/components/layout/Dashboard/context/DashboardContext';

// TODO: Unit test setIsOpen behavior, maybe make a handler function

// TODO: Confirm how theme is passed in
const Sidenav = () => {
  const { isOpen, setIsOpen, isMobile, sidenavWidth } = useDashboardContext();

  return (
    <Drawer
      sx={{
        width: sidenavWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: sidenavWidth,
          boxSizing: 'border-box',
        },
      }}
      variant={isMobile ? 'temporary' : 'persistent'}
      anchor="left"
      open={isOpen}
      onClose={() => setIsOpen(false)}
    >
      <SidenavHeader>
        <IconButton onClick={() => setIsOpen(!isOpen)}>
          <ChevronLeftIcon />
        </IconButton>
      </SidenavHeader>
      Drawer
    </Drawer>
  );
};

export default Sidenav;

const SidenavHeader = styled('div')(({ theme }: { theme: Theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));