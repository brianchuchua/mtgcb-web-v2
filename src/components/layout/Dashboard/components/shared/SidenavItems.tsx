'use client';

import {
  BarChart as BarChartIcon,
  Dashboard as DashboardIcon,
  Favorite as FavoriteIcon,
  Home as HomeIcon,
  Iso as IsoIcon,
  ImportContacts as LibraryIcon,
  ListAlt as ListAltIcon,
  Style as StyleIcon,
  Timeline as TimelineIcon,
  SaveAlt as ImportIcon,
  Launch as ExportIcon,
} from '@mui/icons-material';
import { AutoStories as BinderIcon } from '@mui/icons-material';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Box,
  Collapse,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { SearchForms } from '@/components/layout/Dashboard/components/shared/SearchForms';
import { Link } from '@/components/ui/link';
import { useAuth } from '@/hooks/useAuth';

interface SidenavItemsProps {
  onNavigate?: () => void;
}

export const SidenavItems = ({ onNavigate }: SidenavItemsProps) => {
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuth();
  const [isCollectionMenuOpen] = useState(false); // Kept for future collection menu implementation
  const [isNavExpanded, setIsNavExpanded] = useState(true);

  const toggleNavExpanded = () => {
    setIsNavExpanded(!isNavExpanded);
  };

  const handleClick = () => {
    if (onNavigate) {
      onNavigate();
    }
  };

  return (
    <SidenavContainer>
      <ScrollableContent>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            py: 1,
            cursor: 'pointer',
            backgroundColor: (theme) => theme.palette.background.paper,
            minHeight: '64px',
            height: '64px',
          }}
          onClick={toggleNavExpanded}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ListAltIcon color="primary" sx={{ mr: 1.5 }} />
            <Typography variant="subtitle1" fontWeight="medium">
              Main Menu
            </Typography>
          </Box>
          <IconButton
            onClick={(e) => {
              e.stopPropagation(); // Prevent the Box onClick from firing
              toggleNavExpanded();
            }}
            size="small"
            aria-label={isNavExpanded ? 'Collapse navigation' : 'Expand navigation'}
          >
            {isNavExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
        <Divider />
        {/* Collapsible navigation menu */}
        <Collapse in={isNavExpanded} timeout="auto">
          <List disablePadding>
            <ListItem disablePadding>
              <ListItemButton component={Link} href="/" selected={pathname === '/'} onClick={handleClick}>
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

            {isAuthenticated &&
              user?.userId &&
              (pathname?.startsWith('/collections') || pathname === '/goals' || pathname?.startsWith('/locations') || pathname === '/export') && (
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
                    <ListItemButton
                      component={Link}
                      href="/goals"
                      selected={pathname === '/goals'}
                      onClick={handleClick}
                      sx={{ pl: 4 }}
                    >
                      <ListItemIcon>
                        <BarChartIcon />
                      </ListItemIcon>
                      <ListItemText primary="Goals" />
                    </ListItemButton>
                  </ListItem>
                  <ListItem disablePadding>
                    <ListItemButton
                      component={Link}
                      href="/locations"
                      selected={pathname === '/locations' || pathname?.startsWith('/locations/')}
                      onClick={handleClick}
                      sx={{ pl: 4 }}
                    >
                      <ListItemIcon>
                        <BinderIcon />
                      </ListItemIcon>
                      <ListItemText primary="Locations" />
                    </ListItemButton>
                  </ListItem>
                  <ListItem disablePadding>
                    <ListItemButton disabled sx={{ pl: 4 }}>
                      <ListItemIcon>
                        <StyleIcon
                          sx={{
                            transform: 'scaleY(-1)',
                            transformOrigin: 'center',
                          }}
                        />
                      </ListItemIcon>
                      <ListItemText primary="Decks (In Development)" />
                    </ListItemButton>
                  </ListItem>
                  <ListItem disablePadding>
                    <ListItemButton disabled sx={{ pl: 4 }}>
                      <ListItemIcon>
                        <ImportIcon />
                      </ListItemIcon>
                      <ListItemText primary="Import (In Development)" />
                    </ListItemButton>
                  </ListItem>
                  <ListItem disablePadding>
                    <ListItemButton
                      component={Link}
                      href="/export"
                      selected={pathname === '/export'}
                      onClick={handleClick}
                      sx={{ pl: 4 }}
                    >
                      <ListItemIcon>
                        <ExportIcon />
                      </ListItemIcon>
                      <ListItemText primary="Export" />
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
                  <TimelineIcon />
                </ListItemIcon>
                <ListItemText primary="Changelog" />
              </ListItemButton>
            </ListItem>
          </List>
        </Collapse>

        <Divider />
        <SearchForms />
      </ScrollableContent>
    </SidenavContainer>
  );
};

// Create a container for the entire sidenav content
const SidenavContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100vh', // Take full viewport height
  position: 'relative',
  overflow: 'hidden',
}));

// Create a scrollable container for the content
const ScrollableContent = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  overflow: 'auto',
  height: '100%',
  // Default scrollbar is shown
}));
