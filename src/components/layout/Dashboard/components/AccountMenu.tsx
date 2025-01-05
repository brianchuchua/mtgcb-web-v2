'use client';

import { AccountCircle, Login, Logout, Person, PersonAdd } from '@mui/icons-material';
import { IconButton, Menu, MenuItem, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export const AccountMenu = () => {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleProfile = () => {
    handleClose();
    if (user?.userId) {
      router.push(`/collections/${user.userId}`);
    }
  };

  const handleLogout = async () => {
    handleClose();
    await logout();
    router.push('/');
  };

  const handleLogin = () => {
    handleClose();
    router.push('/login');
  };

  const handleSignUp = () => {
    handleClose();
    router.push('/signup');
  };

  const menuItems = isAuthenticated
    ? [
        <MenuItem key="profile" onClick={handleProfile}>
          <Person sx={{ mr: 1 }} />
          <Typography>Profile</Typography>
        </MenuItem>,
        <MenuItem key="logout" onClick={handleLogout}>
          <Logout sx={{ mr: 1 }} />
          <Typography>Log out</Typography>
        </MenuItem>,
      ]
    : [
        <MenuItem key="login" onClick={handleLogin}>
          <Login sx={{ mr: 1 }} />
          <Typography>Log in</Typography>
        </MenuItem>,
        <MenuItem key="signup" onClick={handleSignUp}>
          <PersonAdd sx={{ mr: 1 }} />
          <Typography>Sign up</Typography>
        </MenuItem>,
      ];

  return (
    <>
      <IconButton
        size="large"
        aria-label="account menu"
        aria-controls="menu-appbar"
        aria-haspopup="true"
        onClick={handleMenu}
        color="inherit"
      >
        <AccountCircle />
      </IconButton>
      <Menu
        id="menu-appbar"
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        {menuItems}
      </Menu>
    </>
  );
};
