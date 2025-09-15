'use client';

import {
  BarChart as BarChartIcon,
  Dashboard as DashboardIcon,
  Launch as ExportIcon,
  Favorite as FavoriteIcon,
  Home as HomeIcon,
  SaveAlt as ImportIcon,
  Iso as IsoIcon,
  ImportContacts as LibraryIcon,
  ListAlt as ListAltIcon,
  Style as StyleIcon,
  Timeline as TimelineIcon,
  DeleteForever as ResetIcon,
  Tune as TuneIcon,
  Article as ArticleIcon,
  Newspaper as NewsIcon,
  HelpOutline as FAQIcon,
  ContactSupport as ContactIcon,
  Description as TemplateIcon,
  Analytics as DraftHelperIcon,
  ViewModule,
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
import { useEffect, useState } from 'react';
import { SearchForms } from '@/components/layout/Dashboard/components/shared/SearchForms';
import { Link } from '@/components/ui/link';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardContext } from '@/components/layout/Dashboard/context/DashboardContext';

interface SidenavItemsProps {
  onNavigate?: () => void;
}

export const SidenavItems = ({ onNavigate }: SidenavItemsProps) => {
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuth();
  const { isMainSectionExpanded, setMainSectionExpanded } = useDashboardContext();
  const [isCollectionMenuOpen, setIsCollectionMenuOpen] = useState(false);
  const [isResourcesMenuOpen, setIsResourcesMenuOpen] = useState(false);

  const toggleNavExpanded = () => {
    setMainSectionExpanded(!isMainSectionExpanded);
  };

  const handleClick = () => {
    if (onNavigate) {
      onNavigate();
    }
  };

  const handleHomeClick = () => {
    setIsCollectionMenuOpen(false);
    setIsResourcesMenuOpen(false);
    handleClick();
  };

  const handleCollectionClick = () => {
    setIsCollectionMenuOpen(false);
    setIsResourcesMenuOpen(false);
    handleClick();
  };

  const handleBrowseClick = () => {
    setIsCollectionMenuOpen(false);
    setIsResourcesMenuOpen(false);
    handleClick();
  };

  const handleResourceClick = () => {
    // Don't close the menu when clicking items inside it
    handleClick();
  };

  // Auto-open collection menu when on collection-related pages
  useEffect(() => {
    const isOnCollectionPage =
      pathname?.startsWith('/collections/edit-cards') ||
      pathname === '/goals' ||
      pathname?.startsWith('/locations') ||
      pathname === '/export' ||
      pathname === '/import' ||
      pathname === '/reset-collection';

    const isOnResourcesPage =
      pathname === '/news' ||
      pathname === '/changelog' ||
      pathname === '/faq' ||
      pathname === '/contact' ||
      pathname === '/binder-templates' ||
      pathname === '/draft-helper' ||
      pathname === '/draft-cubes';

    if (isOnCollectionPage && isAuthenticated && user?.userId) {
      setIsCollectionMenuOpen(true);
    }
    
    if (isOnResourcesPage) {
      setIsResourcesMenuOpen(true);
    }
  }, [pathname, isAuthenticated, user?.userId]);

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
            aria-label={isMainSectionExpanded ? 'Collapse navigation' : 'Expand navigation'}
          >
            {isMainSectionExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
        <Divider />
        {/* Collapsible navigation menu */}
        <Collapse in={isMainSectionExpanded} timeout="auto">
          <List disablePadding>
            <ListItem disablePadding>
              <ListItemButton component={Link} href="/" selected={pathname === '/'} onClick={handleHomeClick}>
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
                onClick={handleBrowseClick}
              >
                <ListItemIcon>
                  <DashboardIcon />
                </ListItemIcon>
                <ListItemText primary="Browse" />
              </ListItemButton>
            </ListItem>

            {isAuthenticated && user?.userId && (
              <>
                <ListItem disablePadding>
                  <ListItemButton
                    component={Link}
                    href={`/collections/${user.userId}`}
                    selected={pathname?.startsWith(`/collections/${user.userId}`)}
                    onClick={handleCollectionClick}
                  >
                    <ListItemIcon>
                      <LibraryIcon />
                    </ListItemIcon>
                    <ListItemText primary="Collection" />
                  </ListItemButton>
                </ListItem>

                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => setIsCollectionMenuOpen(!isCollectionMenuOpen)}
                    selected={
                      pathname?.startsWith('/collections/edit-cards') ||
                      pathname === '/goals' ||
                      pathname?.startsWith('/locations') ||
                      pathname === '/export' ||
                      pathname === '/import' ||
                      pathname === '/reset-collection'
                    }
                  >
                    <ListItemIcon>
                      <TuneIcon />
                    </ListItemIcon>
                    <ListItemText primary="Manage Collection" />
                    {isCollectionMenuOpen ? (
                      <ExpandLessIcon sx={{ mr: '5px' }} />
                    ) : (
                      <ExpandMoreIcon sx={{ mr: '5px' }} />
                    )}
                  </ListItemButton>
                </ListItem>
              </>
            )}

            {isAuthenticated && user?.userId && (
              <Collapse in={isCollectionMenuOpen} timeout="auto">
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
                    <ListItemButton
                      component={Link}
                      href="/import"
                      selected={pathname === '/import'}
                      onClick={handleClick}
                      sx={{ pl: 4 }}
                    >
                      <ListItemIcon>
                        <ImportIcon />
                      </ListItemIcon>
                      <ListItemText primary="Import" />
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
                  <ListItem disablePadding>
                    <ListItemButton
                      component={Link}
                      href="/reset-collection"
                      selected={pathname === '/reset-collection'}
                      onClick={handleClick}
                      sx={{ pl: 4 }}
                    >
                      <ListItemIcon>
                        <ResetIcon />
                      </ListItemIcon>
                      <ListItemText primary="Reset Collection" />
                    </ListItemButton>
                  </ListItem>
                </List>
              </Collapse>
            )}

            <ListItem disablePadding>
              <ListItemButton
                onClick={() => setIsResourcesMenuOpen(!isResourcesMenuOpen)}
                selected={
                  pathname === '/news' ||
                  pathname === '/changelog' ||
                  pathname === '/faq' ||
                  pathname === '/contact' ||
                  pathname === '/binder-templates' ||
                  pathname === '/draft-helper' ||
                  pathname === '/draft-cubes'
                }
              >
                <ListItemIcon>
                  <ArticleIcon />
                </ListItemIcon>
                <ListItemText primary="Resources" />
                {isResourcesMenuOpen ? (
                  <ExpandLessIcon sx={{ mr: '5px' }} />
                ) : (
                  <ExpandMoreIcon sx={{ mr: '5px' }} />
                )}
              </ListItemButton>
            </ListItem>

            <Collapse in={isResourcesMenuOpen} timeout="auto">
              <List component="div" disablePadding>
                <ListItem disablePadding>
                  <ListItemButton
                    component={Link}
                    href="/news"
                    selected={pathname === '/news'}
                    onClick={handleResourceClick}
                    sx={{ pl: 4 }}
                  >
                    <ListItemIcon>
                      <NewsIcon />
                    </ListItemIcon>
                    <ListItemText primary="News" />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton
                    component={Link}
                    href="/changelog"
                    selected={pathname === '/changelog'}
                    onClick={handleResourceClick}
                    sx={{ pl: 4 }}
                  >
                    <ListItemIcon>
                      <TimelineIcon />
                    </ListItemIcon>
                    <ListItemText primary="Changelog" />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton
                    component={Link}
                    href="/faq"
                    selected={pathname === '/faq'}
                    onClick={handleResourceClick}
                    sx={{ pl: 4 }}
                  >
                    <ListItemIcon>
                      <FAQIcon />
                    </ListItemIcon>
                    <ListItemText primary="FAQ" />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton
                    component={Link}
                    href="/contact"
                    selected={pathname === '/contact'}
                    onClick={handleResourceClick}
                    sx={{ pl: 4 }}
                  >
                    <ListItemIcon>
                      <ContactIcon />
                    </ListItemIcon>
                    <ListItemText primary="Contact" />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton
                    component={Link}
                    href="/binder-templates"
                    selected={pathname === '/binder-templates'}
                    onClick={handleResourceClick}
                    sx={{ pl: 4 }}
                  >
                    <ListItemIcon>
                      <TemplateIcon />
                    </ListItemIcon>
                    <ListItemText primary="Binder Templates" />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton
                    component={Link}
                    href="/draft-helper"
                    selected={pathname === '/draft-helper'}
                    onClick={handleResourceClick}
                    sx={{ pl: 4 }}
                  >
                    <ListItemIcon>
                      <DraftHelperIcon />
                    </ListItemIcon>
                    <ListItemText primary="Draft Helper" />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton
                    component={Link}
                    href="/draft-cubes"
                    selected={pathname === '/draft-cubes'}
                    onClick={handleResourceClick}
                    sx={{ pl: 4 }}
                  >
                    <ListItemIcon>
                      <ViewModule />
                    </ListItemIcon>
                    <ListItemText primary="Draft Cubes" />
                  </ListItemButton>
                </ListItem>
              </List>
            </Collapse>

            <ListItem disablePadding>
              <ListItemButton disabled>
                <ListItemIcon>
                  <FavoriteIcon />
                </ListItemIcon>
                <ListItemText primary="Patrons (In Development)" />
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
