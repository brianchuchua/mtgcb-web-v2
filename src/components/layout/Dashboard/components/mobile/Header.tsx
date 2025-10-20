'use client';

import IsoIcon from '@mui/icons-material/Iso';
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import MenuIcon from '@mui/icons-material/Menu';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import Link from 'next/link';
import { AccountMenu } from '@/components/layout/Dashboard/components/AccountMenu';
import { JumpToSetsMenu } from '@/components/layout/Dashboard/components/JumpToSetsMenu';
import { QuickSearch } from '@/components/layout/Dashboard/components/QuickSearch';
import { useDashboardContext } from '@/components/layout/Dashboard/context/DashboardContext';
import { getLatestRelease } from '@/app/changelog/changelog';
import { useShowQuickEditIcon } from '@/contexts/DisplaySettingsContext';
import { useAuth } from '@/hooks/useAuth';

const Header = () => {
  const { isMobileOpen, setMobileOpen, setMainSectionExpanded } = useDashboardContext();
  const latestRelease = getLatestRelease();
  const { isAuthenticated, user } = useAuth();
  const [showQuickEditIcon] = useShowQuickEditIcon();

  const handleMenuClick = () => {
    if (!isMobileOpen) {
      setMainSectionExpanded(true);
    }
    setMobileOpen(!isMobileOpen);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <StyledAppBar position="fixed">
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
            onClick={handleMenuClick}
          >
            {isMobileOpen ? <KeyboardDoubleArrowLeftIcon /> : <MenuIcon />}
          </IconButton>
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'baseline', gap: 1 }}>
            <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              <Typography variant="h6" component="div">
                MTG CB
              </Typography>
            </Link>
            {latestRelease && (
              <Tooltip title={`Last Updated: ${latestRelease.date}`} arrow>
                <Link href="/changelog" style={{ textDecoration: 'none' }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    component="span"
                    sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                  >
                    v{latestRelease.version}
                  </Typography>
                </Link>
              </Tooltip>
            )}
          </Box>
          {isAuthenticated && user?.userId && showQuickEditIcon && (
            <Tooltip title="Add or Remove Cards" arrow>
              <IconButton
                color="inherit"
                component={Link}
                href="/collections/edit-cards"
                size="large"
                sx={{ mr: 1 }}
              >
                <IsoIcon />
              </IconButton>
            </Tooltip>
          )}
          <QuickSearch />
          <JumpToSetsMenu />
          <AccountMenu />
        </Toolbar>
      </StyledAppBar>
    </Box>
  );
};

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  [theme.breakpoints.up('md')]: {
    display: 'none',
  },
}));

export default Header;
