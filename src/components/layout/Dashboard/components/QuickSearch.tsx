'use client';

import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SearchIcon from '@mui/icons-material/Search';
import { Box, IconButton, InputAdornment, Paper, Popper, TextField, Tooltip, Typography } from '@mui/material';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export const QuickSearch = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const anchorRef = useRef<HTMLButtonElement>(null);

  // Extract userId from collection paths
  const getUserIdFromPath = useCallback((): string | null => {
    const match = pathname.match(/\/collections\/([^/]+)/);
    const potentialUserId = match ? match[1] : null;

    // Exclude special collection routes that are not userIds
    if (potentialUserId === 'edit-cards') {
      return null;
    }

    return potentialUserId;
  }, [pathname]);

  const handleToggle = useCallback(() => {
    setOpen((prev) => !prev);
    if (!open) {
      setSearchValue('');
    }
  }, [open]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setSearchValue('');
  }, []);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (!searchValue.trim()) {
        handleClose();
        return;
      }

      const encodedSearch = encodeURIComponent(searchValue.trim());
      let targetUrl: string;
      const collectionUserId = getUserIdFromPath();

      if (collectionUserId) {
        // If on a collection page, search within that collection
        targetUrl = `/collections/${collectionUserId}?name=${encodedSearch}&contentType=cards`;
      } else if (isAuthenticated && user?.userId) {
        // If logged in but not on a collection page, search in own collection
        targetUrl = `/collections/${user.userId}?name=${encodedSearch}&contentType=cards`;
      } else {
        // If not logged in and not on a collection page, search in browse
        targetUrl = `/browse?name=${encodedSearch}&contentType=cards`;
      }

      router.push(targetUrl);
      handleClose();
    },
    [searchValue, isAuthenticated, user, router, handleClose, getUserIdFromPath],
  );

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  }, []);

  return (
    <>
      <Tooltip title="Quick Search">
        <IconButton
          ref={anchorRef}
          size="large"
          aria-label="quick search"
          onClick={handleToggle}
          color="inherit"
          sx={{ mr: 1 }}
        >
          <SearchIcon />
        </IconButton>
      </Tooltip>

      <Popper open={open} anchorEl={anchorRef.current} placement="bottom-end" style={{ zIndex: 1300 }} disablePortal>
        <Paper elevation={1} sx={{ width: 300, mt: 1.5, border: 1, borderColor: 'divider' }}>
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Quick Search
            </Typography>
            <form onSubmit={handleSearch}>
              <TextField
                autoFocus
                fullWidth
                placeholder="Search by card name..."
                variant="outlined"
                size="small"
                value={searchValue}
                onChange={handleInputChange}
                onBlur={handleClose}
                type="search"
                autoComplete="off"
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          edge="end"
                          onClick={handleSearch}
                          onMouseDown={(e) => e.preventDefault()}
                          aria-label="search"
                          sx={{ color: 'primary.main' }}
                        >
                          <ArrowForwardIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                  htmlInput: {
                    maxLength: 2000,
                    spellCheck: 'false',
                    autoCapitalize: 'off',
                    autoCorrect: 'off',
                    inputMode: 'search',
                    enterKeyHint: 'search',
                  },
                }}
              />
            </form>
          </Box>
        </Paper>
      </Popper>
    </>
  );
};
