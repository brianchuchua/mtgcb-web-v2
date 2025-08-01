import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import InventoryIcon from '@mui/icons-material/Inventory';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import { CardLocation } from '@/api/collections/collectionLocationsTypes';
import {
  useAssociateCardLocationMutation,
  useGetCardLocationsQuery,
  useUpdateCardLocationMutation,
} from '@/api/collections/collectionsApi';
import { useGetLocationsQuery, useGetLocationHierarchyQuery } from '@/api/locations/locationsApi';
import { LocationHierarchy } from '@/api/locations/types';
import { DualQuantitySelector } from '@/components/shared/QuantitySelector';

interface AddCardLocationsDialogProps {
  open: boolean;
  onClose: () => void;
  cardId: number;
  cardName: string;
  setName?: string;
  totalQuantityReg: number;
  totalQuantityFoil: number;
  canBeFoil?: boolean;
  canBeNonFoil?: boolean;
}

export default function AddCardLocationsDialog({
  open,
  onClose,
  cardId,
  cardName,
  setName,
  totalQuantityReg,
  totalQuantityFoil,
  canBeFoil = true,
  canBeNonFoil = true,
}: AddCardLocationsDialogProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [selectedLocationId, setSelectedLocationId] = useState<number | ''>('');
  const [quantityReg, setQuantityReg] = useState<number>(0);
  const [quantityFoil, setQuantityFoil] = useState<number>(0);
  const [isUpdating, setIsUpdating] = useState(false);

  // Helper function to render location options with indentation
  const renderLocationOptions = (locs: LocationHierarchy[], depth = 0): JSX.Element[] => {
    const options: JSX.Element[] = [];
    
    for (const loc of locs) {
      const indent = '\u00A0\u00A0'.repeat(depth * 2); // Non-breaking spaces
      const prefix = depth > 0 ? '└ ' : '';
      
      options.push(
        <MenuItem key={loc.id} value={loc.id}>
          {indent}{prefix}{loc.name}
          {loc.description && (
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              ({loc.description})
            </Typography>
          )}
        </MenuItem>
      );
      
      if (loc.children.length > 0) {
        options.push(...renderLocationOptions(loc.children, depth + 1));
      }
    }
    
    return options;
  };

  // Fetch user's locations hierarchy
  const { data: locationsResponse, isLoading: locationsLoading } = useGetLocationHierarchyQuery(undefined, {
    skip: !open,
  });

  // Fetch card's current locations
  const { data: cardLocationsResponse, isLoading: cardLocationsLoading } = useGetCardLocationsQuery(cardId, {
    skip: !open,
  });

  const [associateCardLocation] = useAssociateCardLocationMutation();
  const [updateCardLocation] = useUpdateCardLocationMutation();

  const locations = locationsResponse?.data || [];
  const cardLocations = cardLocationsResponse?.data?.locations || [];

  // Calculate totals already assigned
  const totalAssignedReg = cardLocations.reduce((sum, loc) => sum + loc.quantityReg, 0);
  const totalAssignedFoil = cardLocations.reduce((sum, loc) => sum + loc.quantityFoil, 0);

  // Check if selected location already has this card
  const existingLocation = cardLocations.find((loc) => loc.locationId === selectedLocationId);

  useEffect(() => {
    if (existingLocation) {
      setQuantityReg(existingLocation.quantityReg);
      setQuantityFoil(existingLocation.quantityFoil);
      setIsUpdating(true);
    } else {
      setQuantityReg(0);
      setQuantityFoil(0);
      setIsUpdating(false);
    }
  }, [existingLocation]);

  // Calculate available quantities (owned - already assigned to other locations)
  const currentLocationReg = existingLocation?.quantityReg || 0;
  const currentLocationFoil = existingLocation?.quantityFoil || 0;
  const availableReg = totalQuantityReg - totalAssignedReg + currentLocationReg;
  const availableFoil = totalQuantityFoil - totalAssignedFoil + currentLocationFoil;

  // Validate quantities don't exceed available
  const regExceedsAvailable = quantityReg > availableReg;
  const foilExceedsAvailable = quantityFoil > availableFoil;
  const hasValidationError =
    regExceedsAvailable ||
    foilExceedsAvailable ||
    (!canBeNonFoil && quantityReg > 0) ||
    (!canBeFoil && quantityFoil > 0);

  const handleSave = async () => {
    if (!selectedLocationId) {
      enqueueSnackbar('Please select a location', { variant: 'error' });
      return;
    }

    if (quantityReg < 0 || quantityFoil < 0) {
      enqueueSnackbar('Quantities cannot be negative', { variant: 'error' });
      return;
    }

    if (regExceedsAvailable || foilExceedsAvailable) {
      enqueueSnackbar('Quantities cannot exceed available amounts', { variant: 'error' });
      return;
    }

    if (!canBeNonFoil && quantityReg > 0) {
      enqueueSnackbar('This card cannot be non-foil', { variant: 'error' });
      return;
    }

    if (!canBeFoil && quantityFoil > 0) {
      enqueueSnackbar('This card cannot be foil', { variant: 'error' });
      return;
    }

    try {
      if (isUpdating) {
        await updateCardLocation({
          cardId,
          locationId: selectedLocationId as number,
          quantityReg: quantityReg,
          quantityFoil: quantityFoil,
        }).unwrap();
        enqueueSnackbar('Location quantities updated successfully', { variant: 'success' });
      } else {
        await associateCardLocation({
          cardId,
          locationId: selectedLocationId as number,
          quantityReg: quantityReg,
          quantityFoil: quantityFoil,
        }).unwrap();
        enqueueSnackbar('Card added to location successfully', { variant: 'success' });
      }
      handleClose();
    } catch (error: any) {
      const message = error?.data?.error?.message || 'Failed to save location';
      enqueueSnackbar(message, { variant: 'error' });
    }
  };

  const handleClose = () => {
    setSelectedLocationId('');
    setQuantityReg(0);
    setQuantityFoil(0);
    setIsUpdating(false);
    onClose();
  };

  const isLoading = locationsLoading || cardLocationsLoading;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ elevation: 0 }}>
      <DialogTitle>{isUpdating ? 'Update Card Location' : 'Add Card to Location'}</DialogTitle>
      <DialogContent>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={2} sx={{ mt: 0 }}>
            {locations.length === 0 ? (
              <Alert severity="info">No locations found. Please create a location first.</Alert>
            ) : (
              <>
                {/* Action and Selectors */}
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Add{' '}
                    <Typography component="span" variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
                      {cardName}
                      {setName && ` (${setName})`}
                    </Typography>
                    {' '}to:
                  </Typography>

                  <FormControl fullWidth sx={{ mt: 1 }}>
                    <InputLabel>Select Location</InputLabel>
                    <Select
                      value={selectedLocationId}
                      label="Select Location"
                      onChange={(e) => setSelectedLocationId(e.target.value as number | '')}
                    >
                      {renderLocationOptions(locations)}
                    </Select>
                  </FormControl>
                </Box>

                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Quantities (optional)
                    </Typography>
                    <Tooltip title="You can track card locations without specifying quantities. Leave these fields at 0 if you only want to track which location has the card.">
                      <IconButton size="small" sx={{ ml: 0.5 }}>
                        <InfoOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <DualQuantitySelector
                    regularValue={quantityReg}
                    foilValue={quantityFoil}
                    onRegularChange={setQuantityReg}
                    onFoilChange={setQuantityFoil}
                    canBeNonFoil={canBeNonFoil}
                    canBeFoil={canBeFoil}
                    maxRegular={availableReg}
                    maxFoil={availableFoil}
                    regularError={regExceedsAvailable}
                    foilError={foilExceedsAvailable}
                    regularHelperText={regExceedsAvailable ? `Maximum available: ${availableReg}` : undefined}
                    foilHelperText={foilExceedsAvailable ? `Maximum available: ${availableFoil}` : undefined}
                    size="medium"
                    orientation="horizontal"
                  />
                </Box>

                {/* Collection Status */}
                <Card variant="outlined" sx={{ bgcolor: 'background.default' }}>
                  <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                    <Stack spacing={1.5}>
                      {/* Ownership Summary */}
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                          You own:
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Typography variant="body2">
                            {totalQuantityReg} regular
                            {totalQuantityFoil > 0 && `, ${totalQuantityFoil} foil`}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Assignment Status */}
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                          Assigned to locations:
                        </Typography>
                        <Typography variant="body2">
                          {totalAssignedReg} regular
                          {totalAssignedFoil > 0 && `, ${totalAssignedFoil} foil`}
                          {totalAssignedReg === 0 && totalAssignedFoil === 0 && ' (none)'}
                        </Typography>
                      </Box>

                      {/* Current Locations */}
                      {cardLocations.length > 0 && (
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            Located in:
                          </Typography>
                          <Stack spacing={0.25}>
                            {cardLocations.map((loc) => (
                              <Typography key={loc.locationId} variant="body2">
                                • {loc.locationName}: {loc.quantityReg} regular
                                {loc.quantityFoil > 0 && `, ${loc.quantityFoil} foil`}
                              </Typography>
                            ))}
                          </Stack>
                        </Box>
                      )}

                      {/* Available to Assign */}
                      {(availableReg > 0 || availableFoil > 0) && (
                        <Box sx={{ pt: 0.5, borderTop: 1, borderColor: 'divider' }}>
                          <Typography variant="caption" color="success.main" sx={{ fontWeight: 500 }}>
                            Can assign up to: {availableReg} regular
                            {availableFoil > 0 && `, ${availableFoil} foil`}
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </>
            )}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!selectedLocationId || isLoading || hasValidationError}
        >
          {isUpdating ? 'Update' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
