'use client';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import {
  Autocomplete,
  AutocompleteRenderOptionState,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Popper,
  TextField,
  Tooltip,
  Typography,
  createFilterOptions,
} from '@mui/material';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import { useGetAllSetsQuery } from '@/api/sets/setsApi';
import { useAuth } from '@/hooks/useAuth';
import { Set } from '@/types/sets';
import { getCollectionSetUrl } from '@/utils/collectionUrls';

// Memoized option component
const SetOption = memo(
  ({
    option,
    state,
    generateUrl,
  }: {
    option: Set;
    state: AutocompleteRenderOptionState;
    generateUrl: (set: Set) => string;
  }) => {
    const { key, selected, inputValue, index, ...htmlProps } = state as any;
    const targetUrl = generateUrl(option);

    return (
      <Box
        component="li"
        key={key}
        {...htmlProps}
        sx={{
          padding: 0,
          cursor: 'pointer',
          '&:hover': { bgcolor: 'action.hover' },
          ...(selected && { bgcolor: 'action.selected' }),
        }}
      >
        <Link
          href={targetUrl}
          onClick={(e) => {
            // Allow Ctrl+Click, Cmd+Click, Middle-click, Shift+Click to open in new tab/window
            // Only prevent default on regular left-click to let Autocomplete handle selection
            if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) {
              e.stopPropagation(); // Prevent Autocomplete from handling this click
              return; // Let browser handle modified clicks normally
            }

            // Prevent link navigation on regular click - let Autocomplete handle it
            e.preventDefault();
          }}
          style={{
            display: 'block',
            width: '100%',
            padding: '4px 16px',
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="body2" noWrap>
              {option.name}
            </Typography>
            {option.code && (
              <Typography variant="caption" color="text.secondary" noWrap>
                {option.code}
              </Typography>
            )}
          </Box>
        </Link>
      </Box>
    );
  },
);

SetOption.displayName = 'SetOption';

export const JumpToSetsMenu = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [selectedSet, setSelectedSet] = useState<Set | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [resultLimit, setResultLimit] = useState(100);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  // Fetch all sets
  const { data: setsResponse, isLoading } = useGetAllSetsQuery();

  // Sort sets with smart ordering based on search input
  const allSets = useMemo(() => {
    if (!setsResponse?.data?.sets) return [];

    const sets = [...setsResponse.data.sets];

    // If there's a search term, prioritize exact code matches
    if (inputValue) {
      const searchTerm = inputValue.toLowerCase().trim();

      return sets.sort((a, b) => {
        const aCodeMatch = a.code && a.code.toLowerCase() === searchTerm;
        const bCodeMatch = b.code && b.code.toLowerCase() === searchTerm;

        // Exact code matches come first
        if (aCodeMatch && !bCodeMatch) return -1;
        if (!aCodeMatch && bCodeMatch) return 1;

        // Then prioritize main sets (parentSetId === null) over subsets
        const aIsMainSet = a.parentSetId === null;
        const bIsMainSet = b.parentSetId === null;

        if (aIsMainSet && !bIsMainSet) return -1;
        if (!aIsMainSet && bIsMainSet) return 1;

        // Then sort by release date (newest first)
        const dateA = a.releasedAt ? new Date(a.releasedAt).getTime() : 0;
        const dateB = b.releasedAt ? new Date(b.releasedAt).getTime() : 0;
        return dateB - dateA;
      });
    }

    // Default sort: main sets first, then by release date (newest first)
    return sets.sort((a, b) => {
      // Prioritize main sets (parentSetId === null) over subsets
      const aIsMainSet = a.parentSetId === null;
      const bIsMainSet = b.parentSetId === null;

      if (aIsMainSet && !bIsMainSet) return -1;
      if (!aIsMainSet && bIsMainSet) return 1;

      // Then sort by release date (newest first)
      const dateA = a.releasedAt ? new Date(a.releasedAt).getTime() : 0;
      const dateB = b.releasedAt ? new Date(b.releasedAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [setsResponse, inputValue]);

  // Filter options with dynamic limit
  const filterOptions = useMemo(() => {
    return createFilterOptions<Set>({
      limit: resultLimit,
      stringify: (option) => `${option.name} ${option.code || ''}`,
    });
  }, [resultLimit]);

  // Check if there are more results available
  const filteredSets = useMemo(() => {
    if (!inputValue) return allSets;
    const searchTerm = inputValue.toLowerCase();
    return allSets.filter(
      (set) => set.name.toLowerCase().includes(searchTerm) || (set.code && set.code.toLowerCase().includes(searchTerm)),
    );
  }, [allSets, inputValue]);

  const hasMoreResults = filteredSets.length > resultLimit;

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

  // Generate context-aware URL for a set
  const generateSetUrl = useCallback(
    (set: Set): string => {
      const collectionUserId = getUserIdFromPath();

      if (collectionUserId) {
        // If on a collection page, jump to that collection's set
        return getCollectionSetUrl(collectionUserId, set.slug);
      } else if (isAuthenticated && user?.userId) {
        // If logged in but not on a collection page, jump to own collection
        return getCollectionSetUrl(user.userId, set.slug);
      } else {
        // If not logged in and not on a collection page, jump to browse
        return `/browse/sets/${set.slug}`;
      }
    },
    [isAuthenticated, user, getUserIdFromPath],
  );

  const handleToggle = useCallback(() => {
    setOpen((prev) => !prev);
    if (!open) {
      setInputValue('');
      setResultLimit(100);
    }
  }, [open]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setSelectedSet(null);
    setInputValue('');
    setResultLimit(100);
  }, []);

  const handleSetSelect = useCallback(
    (_event: any, value: Set | null) => {
      if (value) {
        const targetUrl = generateSetUrl(value);

        // Signal to browse pages that this is a quick navigation event
        // This triggers browse form state reset while preserving sticky behavior for normal browsing
        sessionStorage.setItem('quickNavReset', 'true');

        router.push(targetUrl);
        handleClose();
      }
    },
    [router, handleClose, generateSetUrl],
  );

  const getOptionLabel = useCallback((option: Set) => {
    return option.code ? `${option.name} (${option.code})` : option.name;
  }, []);

  const handleInputChange = useCallback((_event: any, newValue: string) => {
    setInputValue(newValue);
    setResultLimit(100); // Reset limit when search changes
  }, []);

  const handleShowMore = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Store current scroll position
    const currentScrollTop = listboxRef.current?.scrollTop || 0;

    setResultLimit((prev) => prev + 100);

    // Restore scroll position after React re-renders
    requestAnimationFrame(() => {
      if (listboxRef.current) {
        listboxRef.current.scrollTop = currentScrollTop;
      }
    });
  }, []);

  return (
    <>
      <Tooltip title="Jump to set">
        <IconButton
          ref={anchorRef}
          size="large"
          aria-label="jump to set"
          onClick={handleToggle}
          color="inherit"
          sx={{ mr: 1 }}
        >
          <RocketLaunchIcon />
        </IconButton>
      </Tooltip>

      <Popper open={open} anchorEl={anchorRef.current} placement="bottom-end" style={{ zIndex: 1300 }} disablePortal>
        <Paper elevation={1} sx={{ width: 300, mt: 1.5, border: 1, borderColor: 'divider' }}>
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Jump to Set
            </Typography>
            <Autocomplete
              open
              options={allSets}
              loading={isLoading}
              value={selectedSet}
              inputValue={inputValue}
              onChange={handleSetSelect}
              onInputChange={handleInputChange}
              onClose={handleClose}
              getOptionLabel={getOptionLabel}
              filterOptions={filterOptions}
              disableListWrap
              renderInput={(params) => (
                <TextField
                  {...params}
                  autoFocus
                  placeholder="Type to search sets..."
                  variant="outlined"
                  size="small"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {isLoading ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderOption={(props, option, state) => (
                <SetOption key={option.id} option={option} state={{ ...props, ...state }} generateUrl={generateSetUrl} />
              )}
              noOptionsText={inputValue.length === 0 ? 'Type to search...' : 'No sets found'}
              PaperComponent={(props) => <Paper {...props} elevation={1} sx={{ border: 1, borderColor: 'divider' }} />}
              sx={{
                '& .MuiAutocomplete-listbox': {
                  maxHeight: 400,
                  padding: 0,
                },
                '& .MuiAutocomplete-option': {
                  padding: 0,
                },
              }}
              ListboxComponent={React.forwardRef((props, ref) => {
                // Merge our ref with any ref passed from Autocomplete
                const mergedRef = (node: HTMLUListElement) => {
                  listboxRef.current = node;
                  if (typeof ref === 'function') {
                    ref(node);
                  } else if (ref) {
                    (ref as React.MutableRefObject<HTMLUListElement>).current = node;
                  }
                };

                return (
                  <Box component="ul" {...props} ref={mergedRef}>
                    {props.children}
                    {hasMoreResults && (
                      <Box
                        component="li"
                        sx={{
                          display: 'block',
                          padding: 0,
                        }}
                      >
                        <Button
                          fullWidth
                          onMouseDown={(e) => e.preventDefault()} // Prevent focus loss
                          onClick={handleShowMore}
                          startIcon={<ExpandMoreIcon />}
                          sx={{
                            py: 1,
                            borderTop: 1,
                            borderColor: 'divider',
                            borderRadius: 0,
                            justifyContent: 'center',
                            textTransform: 'none',
                          }}
                        >
                          Show more results
                        </Button>
                      </Box>
                    )}
                  </Box>
                );
              })}
            />
          </Box>
        </Paper>
      </Popper>
    </>
  );
};
