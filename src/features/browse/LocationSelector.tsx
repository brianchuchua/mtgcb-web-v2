'use client';

import {
  Box,
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  Link,
  MenuItem,
  Select,
  SelectChangeEvent,
  Skeleton,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useRouter } from 'next/navigation';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useGetLocationHierarchyQuery } from '@/api/locations/locationsApi';
import { LocationHierarchy } from '@/api/locations/types';
import { 
  selectSelectedLocationId, 
  setSelectedLocationId, 
  resetSearch,
  selectIncludeChildLocations,
  setIncludeChildLocations 
} from '@/redux/slices/browseSlice';
import { useAuth } from '@/hooks/useAuth';

interface LocationSelectorProps {
  userId: number;
}

const LocationSelector = ({ userId }: LocationSelectorProps) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const selectedLocationId = useSelector(selectSelectedLocationId);
  const includeChildLocations = useSelector(selectIncludeChildLocations);
  const { user, isAuthenticated } = useAuth();
  const isOwnCollection = isAuthenticated && user?.userId === userId;

  const { data: locationsResponse, isLoading, error } = useGetLocationHierarchyQuery();
  const locations = locationsResponse?.data || [];

  const handleChange = (event: SelectChangeEvent<number | '' | 'create-new-location'>) => {
    const value = event.target.value;
    
    // Ignore the create new location option
    if (value === 'create-new-location') {
      return;
    }
    
    const locationId = value === '' ? null : Number(value);
    
    // Only reset search if the location is actually changing
    if (locationId !== selectedLocationId) {
      // Reset all search filters but preserve both goal and location selections
      dispatch(resetSearch({ preserveGoal: true, preserveLocation: true }));
      
      // Set the new location ID
      dispatch(setSelectedLocationId(locationId));
    }
  };

  const handleEditClick = (locationId: number) => {
    // Navigate to location edit page
    router.push(`/locations/edit/${locationId}`);
  };

  const handleIncludeChildLocationsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setIncludeChildLocations(event.target.checked));
  };

  // Helper function to find a location by ID in the hierarchy
  const findLocationInHierarchy = (locations: LocationHierarchy[], id: number): LocationHierarchy | null => {
    for (const location of locations) {
      if (location.id === id) return location;
      const found = findLocationInHierarchy(location.children, id);
      if (found) return found;
    }
    return null;
  };

  // Helper function to render location options with indentation
  const renderLocationOptions = (locations: LocationHierarchy[], depth = 0): React.ReactNode[] => {
    const options: React.ReactNode[] = [];
    
    for (const location of locations) {
      const indent = '\u00A0\u00A0'.repeat(depth * 2); // Non-breaking spaces
      const prefix = depth > 0 ? '└ ' : '';
      
      options.push(
        <MenuItem key={location.id} value={location.id} sx={{ p: 0 }}>
          <Box sx={{ width: '100%', display: 'flex', alignItems: 'center' }}>
            <Box sx={{ flex: 1, minWidth: 0, p: 1.5, pr: 0.5 }}>
              <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {indent}{prefix}{location.name}
              </Typography>
              {location.description && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', pl: depth * 2 }}
                >
                  {location.description}
                </Typography>
              )}
            </Box>
            {isOwnCollection && (
              <Box sx={{ px: 1.5, py: 1.5 }}>
                <Link
                  component="button"
                  variant="caption"
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleEditClick(location.id);
                  }}
                  onMouseDown={(e: React.MouseEvent) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  sx={{
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Edit
                </Link>
              </Box>
            )}
          </Box>
        </MenuItem>
      );
      
      if (location.children.length > 0) {
        options.push(...renderLocationOptions(location.children, depth + 1));
      }
    }
    
    return options;
  };

  if (isLoading) {
    return (
      <FormControl fullWidth margin="dense">
        <Skeleton variant="rectangular" height={40} />
      </FormControl>
    );
  }

  if (error || !locationsResponse?.success) {
    return null; // Silently fail if locations can't be loaded
  }

  if (locations.length === 0) {
    return null; // Don't show selector if no locations
  }

  return (
    <Box>
      <FormControl fullWidth margin="dense">
        <InputLabel id="location-selector-label" shrink>Location</InputLabel>
        <Select
          labelId="location-selector-label"
          value={selectedLocationId || ''}
          onChange={handleChange}
          label="Location"
          displayEmpty
          renderValue={(value: number | '' | 'create-new-location') => {
            if (!value || value === 'create-new-location') {
              return 'All locations';
            }
            const selectedLocation = findLocationInHierarchy(locations, value);
            return selectedLocation?.name || 'All locations';
          }}
        >
        <MenuItem value="">
          <em>All locations</em>
        </MenuItem>
        {renderLocationOptions(locations)}
        {isOwnCollection && <Divider />}
        {isOwnCollection && (
          <MenuItem
            value="create-new-location"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              router.push('/locations/create');
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            sx={{ p: 1.5 }}
            disableRipple
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AddIcon fontSize="small" />
              <Typography variant="body2">Create new location</Typography>
            </Box>
          </MenuItem>
        )}
      </Select>
    </FormControl>
    {selectedLocationId && (
      <FormControlLabel
        control={
          <Checkbox
            checked={includeChildLocations}
            onChange={handleIncludeChildLocationsChange}
            size="small"
          />
        }
        label={
          <Typography variant="body2" color="text.secondary">
            Include child locations
          </Typography>
        }
        sx={{ mt: 0.5, ml: 0.5 }}
      />
    )}
    </Box>
  );
};

export default LocationSelector;