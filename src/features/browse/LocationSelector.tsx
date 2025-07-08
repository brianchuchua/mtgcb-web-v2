'use client';

import {
  Box,
  Divider,
  FormControl,
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
import { useDispatch, useSelector } from 'react-redux';
import { useGetLocationsQuery } from '@/api/locations/locationsApi';
import { LocationWithCount } from '@/api/locations/types';
import { selectSelectedLocationId, setSelectedLocationId, resetSearch } from '@/redux/slices/browseSlice';
import { useAuth } from '@/hooks/useAuth';

interface LocationSelectorProps {
  userId: number;
}

const LocationSelector = ({ userId }: LocationSelectorProps) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const selectedLocationId = useSelector(selectSelectedLocationId);
  const { user, isAuthenticated } = useAuth();
  const isOwnCollection = isAuthenticated && user?.userId === userId;

  const { data: locationsResponse, isLoading, error } = useGetLocationsQuery({ includeCardCount: false, limit: 500 });
  const locations = locationsResponse?.data?.locations || [];

  const handleChange = (event: SelectChangeEvent<number | '' | 'create-new-location'>) => {
    const value = event.target.value;
    
    // Ignore the create new location option
    if (value === 'create-new-location') {
      return;
    }
    
    const locationId = value === '' ? null : Number(value);
    
    // Only reset search if the location is actually changing
    if (locationId !== selectedLocationId) {
      // Reset all search filters but preserve the location selection
      dispatch(resetSearch({ preserveLocation: true }));
      
      // Set the new location ID
      dispatch(setSelectedLocationId(locationId));
    }
  };

  const handleEditClick = (locationId: number) => {
    // Navigate to location edit page
    router.push(`/locations/edit/${locationId}`);
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
          const selectedLocation = locations.find(location => location.id === value);
          return selectedLocation?.name || 'All locations';
        }}
      >
        <MenuItem value="">
          <em>All locations</em>
        </MenuItem>
        {locations.map((location) => (
          <MenuItem key={location.id} value={location.id} sx={{ p: 0 }}>
            <Box sx={{ width: '100%', display: 'flex', alignItems: 'center' }}>
              <Box sx={{ flex: 1, minWidth: 0, p: 1.5, pr: 0.5 }}>
                <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {location.name}
                </Typography>
                {location.description && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
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
        ))}
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
  );
};

export default LocationSelector;