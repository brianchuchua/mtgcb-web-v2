'use client';

import MenuIcon from '@mui/icons-material/Menu';
import AppBar, { AppBarProps } from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import { useDashboardContext } from '@/components/layout/Dashboard/context/DashboardContext';

const Header = () => {
  const { isOpen, setIsOpen, isMobile, sidenavWidth } = useDashboardContext();

  return (
    <Box sx={{ flexGrow: 1 }}>
      <TopBar 
        position="fixed" 
        isOpen={isOpen && !isMobile} 
        sidenavWidth={sidenavWidth}
      >
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
            onClick={() => setIsOpen(!isOpen)}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            MTG Collection Builder
          </Typography>
          <Button color="inherit">Login</Button>
        </Toolbar>
      </TopBar>
    </Box>
  );
};

export default Header;

interface TopBarProps extends AppBarProps {
  isOpen?: boolean;
  sidenavWidth: number;
}

const TopBar = styled(AppBar, {
  shouldForwardProp: (prop) => prop !== 'isOpen' && prop !== 'sidenavWidth',
})<TopBarProps>(({ theme, isOpen, sidenavWidth }) => ({
  width: '100%',
  ...(isOpen && {
    width: `calc(100% - ${sidenavWidth}px)`,
    marginLeft: `${sidenavWidth}px`,
  }),
}));