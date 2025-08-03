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
  const { isMobileOpen, setMobileOpen } = useDashboardContext();

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
            onClick={() => setMobileOpen(!isMobileOpen)}
          >
            {isMobileOpen ? <KeyboardDoubleArrowLeftIcon /> : <MenuIcon />}
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            MTG CB
            <Tooltip title="Last Updated: 2025-08-02" arrow>
              <Link href="/changelog" style={{ textDecoration: 'none', marginLeft: '4px' }}>
                <Typography variant="caption" color="text.secondary" component="span" sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                  v0.90.0
                </Typography>
              </Link>
            </Tooltip>
          </Typography>
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
