import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import {
  Box,
  Button,
  Collapse,
  FormControl,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { useMemo, useState } from 'react';
import { useGetLocationHierarchyQuery } from '@/api/locations/locationsApi';
import { LocationHierarchy } from '@/api/locations/types';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1),
  margin: '0 auto',
  marginTop: theme.spacing(0),
  marginBottom: theme.spacing(0),
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`,
  maxWidth: 500,
  [theme.breakpoints.down('sm')]: {
    marginTop: theme.spacing(1),
  },
}));

const QuantityContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  '&:focus-within': {
    '& button': {
      borderColor: theme.palette.primary.main,
    },
  },
}));

const QuantityInput = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-input': {
    padding: '6px 12px',
    textAlign: 'center',
    fontSize: '0.875rem',
    height: '24px',
    boxSizing: 'border-box',
  },
  '& .MuiOutlinedInput-root': {
    height: '36px',
    borderRadius: 0,
    '& fieldset': {
      borderLeft: 'none',
      borderRight: 'none',
      borderColor: theme.palette.divider,
      transition: 'border-color 0.2s',
    },
    '&:hover fieldset': {
      borderColor: theme.palette.divider,
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main,
      borderWidth: 1,
    },
  },
  '& input[type="number"]::-webkit-inner-spin-button, & input[type="number"]::-webkit-outer-spin-button': {
    WebkitAppearance: 'none',
    margin: 0,
  },
  '& input[type="number"]': {
    MozAppearance: 'textfield',
  },
  width: '80px',
}));

const QuantityButton = styled(IconButton)(({ theme }) => ({
  padding: '6px',
  height: '36px',
  width: '36px',
  borderRadius: 0,
  border: `1px solid ${theme.palette.divider}`,
  transition: 'all 0.2s',
  backgroundColor: theme.palette.background.paper,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    borderColor: theme.palette.divider,
  },
  '&.Mui-disabled': {
    borderColor: theme.palette.divider,
  },
  '& .MuiSvgIcon-root': {
    fontSize: '1rem',
  },
}));

const QuantityLeftButton = styled(QuantityButton)(({ theme }) => ({
  borderTopLeftRadius: theme.shape.borderRadius,
  borderBottomLeftRadius: theme.shape.borderRadius,
  borderRight: 'none',
}));

const QuantityRightButton = styled(QuantityButton)(({ theme }) => ({
  borderTopRightRadius: theme.shape.borderRadius,
  borderBottomRightRadius: theme.shape.borderRadius,
  borderLeft: 'none',
}));

export interface MassUpdateLocationFormData {
  mode: 'set' | 'increment' | 'remove';
  locationId?: number;
  quantityReg: number;
  quantityFoil: number;
}

// UI-only type for the form
type FormMode = 'set' | 'change' | 'remove_all';

interface MassUpdateLocationPanelProps {
  isOpen: boolean;
  onSubmit: (data: MassUpdateLocationFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  cardCount: number;
}

const MassUpdateLocationPanel: React.FC<MassUpdateLocationPanelProps> = ({
  isOpen,
  onSubmit,
  onCancel,
  isLoading = false,
  cardCount,
}) => {
  const [uiMode, setUiMode] = useState<FormMode>('set');
  const [formData, setFormData] = useState<MassUpdateLocationFormData>({
    mode: 'set',
    locationId: undefined,
    quantityReg: 0,
    quantityFoil: 0,
  });

  // Fetch available locations
  const { data: locationsResponse, isLoading: isLoadingLocations } = useGetLocationHierarchyQuery();

  // Flatten the location hierarchy for the select dropdown
  const flattenedLocations = useMemo(() => {
    const flatten = (
      locations: LocationHierarchy[],
      parentPath: string = '',
    ): { id: number; name: string; path: string }[] => {
      return locations.flatMap((location) => {
        const currentPath = parentPath ? `${parentPath} > ${location.name}` : location.name;
        return [
          { id: location.id, name: location.name, path: currentPath },
          ...flatten(location.children, currentPath),
        ];
      });
    };
    return flatten(locationsResponse?.data || []);
  }, [locationsResponse?.data]);

  // Reset form when panel is closed
  React.useEffect(() => {
    if (!isOpen) {
      // Reset to default values
      setUiMode('set');
      setFormData({
        mode: 'set',
        locationId: undefined,
        quantityReg: 0,
        quantityFoil: 0,
      });
    }
  }, [isOpen]);

  const handleModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newMode = event.target.value as FormMode;
    setUiMode(newMode);

    // Reset quantities when switching modes
    if (newMode === 'change') {
      setFormData({ ...formData, mode: 'increment', quantityReg: 1, quantityFoil: 0 });
    } else if (newMode === 'remove_all') {
      setFormData({ ...formData, mode: 'remove', quantityReg: 0, quantityFoil: 0 });
    } else {
      // set mode - default to 0 quantities since they're optional
      setFormData({ ...formData, mode: 'set', quantityReg: 0, quantityFoil: 0 });
    }
  };

  const handleLocationChange = (event: any) => {
    setFormData({ ...formData, locationId: event.target.value });
  };

  const handleQuantityChange = (field: 'quantityReg' | 'quantityFoil', value: number) => {
    // For change mode (increment), allow negative values
    if (uiMode === 'change') {
      // Allow any value including negative for decrement
      setFormData({ ...formData, [field]: value });
    } else {
      // For set mode, only allow non-negative
      if (value < 0) {
        return;
      }
      setFormData({ ...formData, [field]: value });
    }
  };

  const getActionDescription = (): string => {
    const { quantityReg, quantityFoil, locationId } = formData;
    const locationName = flattenedLocations.find((loc) => loc.id === locationId)?.path || 'selected location';

    if (uiMode === 'set') {
      if (!locationId) {
        return `Select a location to assign ${cardCount} card${cardCount !== 1 ? 's' : ''}`;
      }
      if (quantityReg === 0 && quantityFoil === 0) {
        return `Will assign ${cardCount} card${cardCount !== 1 ? 's' : ''} to "${locationName}" with no quantity tracking`;
      }
      return `Will assign ${cardCount} card${cardCount !== 1 ? 's' : ''} to "${locationName}" and set quantities to ${quantityReg} regular${quantityFoil > 0 ? `, ${quantityFoil} foil` : ''}`;
    } else if (uiMode === 'change') {
      if (!locationId) {
        return `Select a location to assign ${cardCount} card${cardCount !== 1 ? 's' : ''}`;
      }
      if (quantityReg === 0 && quantityFoil === 0) {
        return `Will assign ${cardCount} card${cardCount !== 1 ? 's' : ''} to "${locationName}" with no quantity changes`;
      }

      const parts: string[] = [];
      if (quantityReg > 0) {
        parts.push(`+${quantityReg} regular`);
      } else if (quantityReg < 0) {
        parts.push(`${quantityReg} regular`);
      }

      if (quantityFoil > 0) {
        parts.push(`+${quantityFoil} foil`);
      } else if (quantityFoil < 0) {
        parts.push(`${quantityFoil} foil`);
      }

      const combinedAction = parts.join(', ');
      return `Will assign ${cardCount} card${cardCount !== 1 ? 's' : ''} to "${locationName}" and adjust by ${combinedAction}`;
    } else {
      // Remove all mode
      return `Will remove ${cardCount} card${cardCount !== 1 ? 's' : ''} from ALL locations`;
    }
  };

  const handleSubmit = () => {
    // Convert UI mode to API format
    const apiFormData: MassUpdateLocationFormData = {
      ...formData,
      mode: uiMode === 'set' ? 'set' : uiMode === 'remove_all' ? 'remove' : 'increment',
      locationId: uiMode === 'remove_all' ? undefined : formData.locationId,
      quantityReg: uiMode === 'remove_all' ? 0 : formData.quantityReg,
      quantityFoil: uiMode === 'remove_all' ? 0 : formData.quantityFoil,
    };
    onSubmit(apiFormData);
  };

  const isValidForm = () => {
    // Remove all mode doesn't need location
    if (uiMode === 'remove_all') {
      return true;
    }
    // Change mode allows negative values
    if (uiMode === 'change') {
      return formData.locationId !== undefined;
    }
    // Set mode needs location and non-negative quantities
    return formData.locationId !== undefined && formData.quantityReg >= 0 && formData.quantityFoil >= 0;
  };

  return (
    <Collapse in={isOpen}>
      <StyledPaper elevation={0}>
        <Typography variant="subtitle1" fontWeight="500" sx={{ textAlign: 'center', mb: 0.5 }}>
          Mass Edit Locations for {cardCount} Card{cardCount !== 1 ? 's' : ''} on this Page
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', display: 'block', mb: 1.5 }}>
          Impacts cards in the current search page with quantity {'>'} 0
        </Typography>

        <Stack spacing={1}>
          {/* Mode Selection - Compact */}
          <FormControl component="fieldset" size="small">
            <RadioGroup row value={uiMode} onChange={handleModeChange} sx={{ justifyContent: 'center' }}>
              <FormControlLabel
                value="set"
                control={<Radio size="small" />}
                label={
                  <Box>
                    <Typography component="span" variant="body2">
                      Assign and set quantity
                    </Typography>
                  </Box>
                }
                sx={{ mr: 2 }}
              />
              <FormControlLabel
                value="change"
                control={<Radio size="small" />}
                label={
                  <Box>
                    <Typography component="span" variant="body2">
                      Assign and edit quantity
                    </Typography>
                  </Box>
                }
                sx={{ mr: 2 }}
              />
              <FormControlLabel
                value="remove_all"
                control={<Radio size="small" />}
                label={
                  <Box>
                    <Typography component="span" variant="body2">
                      Remove from all locations
                    </Typography>
                  </Box>
                }
              />
            </RadioGroup>
          </FormControl>

          {/* Mode explanation */}
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', display: 'block', px: 2 }}>
            {uiMode === 'set' && 'Assigns cards to location and sets exact quantities at that location'}
            {uiMode === 'change' && 'Assigns cards to location and adjusts quantities at that location'}
            {uiMode === 'remove_all' && 'Removes cards from all locations'}
          </Typography>

          {/* Location selector (not shown in remove all mode) */}
          {uiMode !== 'remove_all' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', textAlign: 'center', mb: 0.5 }}
              >
                Select Location
              </Typography>
              <FormControl size="small" sx={{ minWidth: 250 }}>
                <Select
                  value={formData.locationId || ''}
                  onChange={handleLocationChange}
                  displayEmpty
                  disabled={isLoading || isLoadingLocations}
                  sx={{
                    height: '36px',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: (theme) => theme.palette.divider,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: (theme) => theme.palette.divider,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: (theme) => theme.palette.primary.main,
                      borderWidth: 1,
                    },
                  }}
                >
                  <MenuItem value="" disabled>
                    <em>Select a location</em>
                  </MenuItem>
                  {flattenedLocations.map((location) => (
                    <MenuItem key={location.id} value={location.id}>
                      {location.path}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}

          {/* Quantities (not shown in remove all mode) */}
          {uiMode !== 'remove_all' && (
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', textAlign: 'center', mb: 1 }}
              >
                {uiMode === 'set'
                  ? 'Set quantities at that location to (0 = track location only)'
                  : 'Add or subtract quantities at that location'}
              </Typography>
              <Stack direction="row" spacing={1} justifyContent="center">
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', textAlign: 'center', mb: 0.5 }}
                  >
                    Regular{' '}
                    {uiMode === 'change' && formData.quantityReg !== 0
                      ? `(${formData.quantityReg > 0 ? '+' : ''}${formData.quantityReg})`
                      : ''}
                  </Typography>
                  <QuantityContainer>
                    <QuantityLeftButton
                      size="small"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.currentTarget.blur();
                        if (uiMode === 'change') {
                          handleQuantityChange('quantityReg', formData.quantityReg - 1);
                        } else {
                          handleQuantityChange('quantityReg', Math.max(0, formData.quantityReg - 1));
                        }
                      }}
                      disabled={isLoading || (uiMode !== 'change' && formData.quantityReg === 0)}
                      tabIndex={-1}
                      disableFocusRipple
                    >
                      <RemoveIcon />
                    </QuantityLeftButton>
                    <QuantityInput
                      type="number"
                      value={formData.quantityReg}
                      onChange={(e) => handleQuantityChange('quantityReg', parseInt(e.target.value) || 0)}
                      inputProps={{
                        min: uiMode === 'change' ? undefined : 0,
                      }}
                      size="small"
                      disabled={isLoading}
                    />
                    <QuantityRightButton
                      size="small"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.currentTarget.blur();
                        handleQuantityChange('quantityReg', formData.quantityReg + 1);
                      }}
                      disabled={isLoading}
                      tabIndex={-1}
                      disableFocusRipple
                    >
                      <AddIcon />
                    </QuantityRightButton>
                  </QuantityContainer>
                </Box>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', textAlign: 'center', mb: 0.5 }}
                  >
                    Foil{' '}
                    {uiMode === 'change' && formData.quantityFoil !== 0
                      ? `(${formData.quantityFoil > 0 ? '+' : ''}${formData.quantityFoil})`
                      : ''}
                  </Typography>
                  <QuantityContainer>
                    <QuantityLeftButton
                      size="small"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.currentTarget.blur();
                        if (uiMode === 'change') {
                          handleQuantityChange('quantityFoil', formData.quantityFoil - 1);
                        } else {
                          handleQuantityChange('quantityFoil', Math.max(0, formData.quantityFoil - 1));
                        }
                      }}
                      disabled={isLoading || (uiMode !== 'change' && formData.quantityFoil === 0)}
                      tabIndex={-1}
                      disableFocusRipple
                    >
                      <RemoveIcon />
                    </QuantityLeftButton>
                    <QuantityInput
                      type="number"
                      value={formData.quantityFoil}
                      onChange={(e) => handleQuantityChange('quantityFoil', parseInt(e.target.value) || 0)}
                      inputProps={{
                        min: uiMode === 'change' ? undefined : 0,
                      }}
                      size="small"
                      disabled={isLoading}
                    />
                    <QuantityRightButton
                      size="small"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.currentTarget.blur();
                        handleQuantityChange('quantityFoil', formData.quantityFoil + 1);
                      }}
                      disabled={isLoading}
                      tabIndex={-1}
                      disableFocusRipple
                    >
                      <AddIcon />
                    </QuantityRightButton>
                  </QuantityContainer>
                </Box>
              </Stack>
            </Box>
          )}

          {/* Action description */}
          <Box
            sx={{
              mt: 2,
              p: 1.5,
              borderRadius: 1,
              textAlign: 'center',
            }}
          >
            <Typography variant="body2" color="textSecondary" fontWeight="medium" style={{ fontStyle: 'italic' }}>
              {getActionDescription()}
            </Typography>
          </Box>

          {/* Info about remove all mode */}
          {uiMode === 'remove_all' && (
            <Box
              sx={{
                mt: 1,
                p: 1,
                borderRadius: 1,
                border: (theme) => `1px solid ${theme.palette.warning.main}`,
                backgroundColor: (theme) => theme.palette.warning.light + '10',
              }}
            >
              <Typography variant="caption" color="warning.main" sx={{ display: 'block', textAlign: 'center' }}>
                This will remove cards from ALL locations, not just a specific one.
              </Typography>
            </Box>
          )}

          {/* Info about set mode behavior */}
          {uiMode === 'set' && formData.locationId && (
            <Box
              sx={{
                mt: 1,
                p: 1,
                borderRadius: 1,
                border: (theme) => `1px solid ${theme.palette.info.main}`,
                backgroundColor: (theme) => theme.palette.info.light + '10',
              }}
            >
              <Typography variant="caption" color="info.main" sx={{ display: 'block', textAlign: 'center' }}>
                {formData.quantityReg === 0 && formData.quantityFoil === 0
                  ? 'Cards will be assigned to this location for tracking purposes only, without quantity counts'
                  : 'Cards will be assigned to this location. Any existing quantities will be replaced.'}
              </Typography>
            </Box>
          )}

          {/* Info about adjust mode behavior */}
          {uiMode === 'change' && formData.locationId && (
            <Box
              sx={{
                mt: 1,
                p: 1,
                borderRadius: 1,
                border: (theme) => `1px solid ${theme.palette.info.main}`,
                backgroundColor: (theme) => theme.palette.info.light + '10',
              }}
            >
              <Typography variant="caption" color="info.main" sx={{ display: 'block', textAlign: 'center' }}>
                {formData.quantityReg < 0 || formData.quantityFoil < 0
                  ? 'Cards not at this location will be assigned first. If final quantity reaches 0 or below, the card will be removed from the location.'
                  : 'Cards not already at this location will be assigned first, then quantities adjusted.'}
              </Typography>
            </Box>
          )}

          {/* Action buttons */}
          <Stack direction="row" spacing={1} justifyContent="center">
            <Button variant="outlined" size="small" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={handleSubmit}
              disabled={!isValidForm() || isLoading}
            >
              Apply
            </Button>
          </Stack>
        </Stack>
      </StyledPaper>
    </Collapse>
  );
};

export default MassUpdateLocationPanel;
