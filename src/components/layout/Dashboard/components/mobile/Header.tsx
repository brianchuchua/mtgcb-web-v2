'use client';

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
import { useDashboardContext } from '@/components/layout/Dashboard/context/DashboardContext';

const Header = () => {
  const { isMobileOpen, setMobileOpen, setMainSectionExpanded } = useDashboardContext();

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
            <Typography variant="h6" component="div">
              MTG CB
            </Typography>
            <Tooltip title="Last Updated: 2025-08-05" arrow>
              <Link href="/changelog" style={{ textDecoration: 'none' }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  component="span"
                  sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                >
                  v0.96.0
                </Typography>
              </Link>
            </Tooltip>
          </Box>
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
