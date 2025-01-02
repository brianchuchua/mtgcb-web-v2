'use client';

import MenuIcon from '@mui/icons-material/Menu';
import AppBar, { AppBarProps } from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import { useDashboardContext } from '@/components/contexts/DashboardContext';

interface HeaderProps {
  sidenavWidth: number;
}

const Header: React.FC<HeaderProps> = ({ sidenavWidth }) => {
  const { isOpen, setIsOpen } = useDashboardContext();

  return (
    <Box sx={{ flexGrow: 1 }}>
      <TopBar position="fixed" isOpen={isOpen} sidenavWidth={sidenavWidth}>
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
})<TopBarProps>(({ theme, sidenavWidth }) => ({
  variants: [
    {
      props: ({ isOpen }) => isOpen,
      style: {
        width: `calc(100% - ${sidenavWidth}px)`,
        marginLeft: `${sidenavWidth}px`,
      },
    },
  ],
}));
