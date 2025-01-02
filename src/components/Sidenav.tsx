'use client';

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { Drawer, IconButton } from '@mui/material';
import { Theme, styled, useTheme } from '@mui/material/styles';
import { useDashboardContext } from '@/components/contexts/DashboardContext';

interface DrawerProps {
  sidenavWidth: number;
}

// TODO: Unit test setIsOpen behavior, maybe make a handler function

// TODO: Confirm how theme is passed in
const Sidenav: React.FC<DrawerProps> = ({ sidenavWidth }) => {
  const { isOpen, setIsOpen } = useDashboardContext();

  return (
    <>
      <Drawer
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
        open={isOpen}
      >
        <SidenavHeader>
          <IconButton onClick={() => setIsOpen(!isOpen)}>
            <ChevronLeftIcon />
          </IconButton>
        </SidenavHeader>
        Drawer
      </Drawer>
    </>
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
