'use client';

import {
  BarChart as BarChartIcon,
  Dashboard as DashboardIcon,
  Favorite as FavoriteIcon,
  Home as HomeIcon,
  Iso as IsoIcon,
  ImportContacts as LibraryIcon,
  ListAlt as ListAltIcon,
} from '@mui/icons-material';
import { AutoStories as BinderIcon } from '@mui/icons-material';
import { Divider, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Link } from '@/components/ui/link';
import { useAuth } from '@/hooks/useAuth';

interface SidenavItemsProps {
  onNavigate?: () => void;
}

export const SidenavItems = ({ onNavigate }: SidenavItemsProps) => {
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuth();
  const [isCollectionMenuOpen] = useState(false); // Kept for future collection menu implementation

  const handleClick = () => {
    if (onNavigate) {
      onNavigate();
    }
  };

  return (
    <>
      <Divider />
      <List disablePadding>
        <ListItem disablePadding>
          <ListItemButton
            component={Link}
            href="/"
            selected={pathname === '/'}
            onClick={handleClick}
          >
            <ListItemIcon>
              <HomeIcon />
            </ListItemIcon>
            <ListItemText primary="Home" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton
            component={Link}
            href="/browse"
            selected={pathname.startsWith('/browse')}
            onClick={handleClick}
          >
            <ListItemIcon>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText primary="Browse" />
          </ListItemButton>
        </ListItem>

        {isAuthenticated && user?.userId && (
          <ListItem disablePadding>
            <ListItemButton
              component={Link}
              href={`/collections/${user.userId}`}
              selected={pathname?.startsWith(`/collections/${user.userId}`)}
              onClick={handleClick}
            >
              <ListItemIcon>
                <LibraryIcon />
              </ListItemIcon>
              <ListItemText primary="Collection" />
            </ListItemButton>
          </ListItem>
        )}

        {isAuthenticated && user?.userId && pathname?.startsWith('/collections') && (
          <List component="div" disablePadding>
            <ListItem disablePadding>
              <ListItemButton
                component={Link}
                href="/collections/edit-cards"
                selected={pathname?.startsWith('/collections/edit-cards')}
                onClick={handleClick}
                sx={{ pl: 4 }}
              >
                <ListItemIcon>
                  <IsoIcon />
                </ListItemIcon>
                <ListItemText primary="Add or Remove Cards" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton disabled sx={{ pl: 4 }}>
                <ListItemIcon>
                  <BarChartIcon />
                </ListItemIcon>
                <ListItemText primary="Goals (In Development)" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton disabled sx={{ pl: 4 }}>
                <ListItemIcon>
                  <BinderIcon />
                </ListItemIcon>
                <ListItemText primary="Locations (In Development)" />
              </ListItemButton>
            </ListItem>
          </List>
        )}

        <ListItem disablePadding>
          <ListItemButton disabled>
            <ListItemIcon>
              <FavoriteIcon />
            </ListItemIcon>
            <ListItemText primary="Patrons (In Development)" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton
            component={Link}
            href="/changelog"
            selected={pathname === '/changelog'}
            onClick={handleClick}
          >
            <ListItemIcon>
              <ListAltIcon />
            </ListItemIcon>
            <ListItemText primary="Changelog" />
          </ListItemButton>
        </ListItem>
      </List>
      <Divider />
    </>
  );
};
