'use client';

import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import MenuIcon from '@mui/icons-material/Menu';
import AppBar, { AppBarProps } from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import Link from 'next/link';
import { AccountMenu } from '@/components/layout/Dashboard/components/AccountMenu';
import { useDashboardContext } from '@/components/layout/Dashboard/context/DashboardContext';
import { getLatestRelease } from '@/app/changelog/changelog';

export const Header = () => {
  const { isDesktopOpen, setDesktopOpen, sidenavWidth } = useDashboardContext();
  const latestRelease = getLatestRelease();

  return (
    <Box sx={{ flexGrow: 1 }}>
      <TopBar position="fixed" isOpen={isDesktopOpen} sidenavWidth={sidenavWidth}>
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
            onClick={() => setDesktopOpen(!isDesktopOpen)}
          >
            {isDesktopOpen ? <KeyboardDoubleArrowLeftIcon /> : <MenuIcon />}
          </IconButton>
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'baseline', gap: 1 }}>
            <Typography variant="h6" component="div">
              MTG Collection Builder
            </Typography>
            {latestRelease && (
              <Tooltip title={`Last Updated: ${latestRelease.date}`} arrow>
                <Link href="/changelog" style={{ textDecoration: 'none' }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                  >
                    v{latestRelease.version}
                  </Typography>
                </Link>
              </Tooltip>
            )}
          </Box>
          <AccountMenu />
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
  [theme.breakpoints.down('md')]: {
    display: 'none',
  },
}));
