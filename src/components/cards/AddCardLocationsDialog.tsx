import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
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
import { useGetLocationsQuery } from '@/api/locations/locationsApi';
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

  // Fetch user's locations
  const { data: locationsResponse, isLoading: locationsLoading } = useGetLocationsQuery(undefined, {
    skip: !open,
  });

  // Fetch card's current locations
  const { data: cardLocationsResponse, isLoading: cardLocationsLoading } = useGetCardLocationsQuery(cardId, {
    skip: !open,
  });

  const [associateCardLocation] = useAssociateCardLocationMutation();
  const [updateCardLocation] = useUpdateCardLocationMutation();

  const locations = locationsResponse?.data?.locations || [];
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
  const hasValidationError = regExceedsAvailable || foilExceedsAvailable || (!canBeNonFoil && quantityReg > 0) || (!canBeFoil && quantityFoil > 0);

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
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {cardName}
              {setName && (
                <Typography component="span" variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  {' '}— {setName}
                </Typography>
              )}
            </Typography>

            {locations.length === 0 ? (
              <Alert severity="info">No locations found. Please create a location first.</Alert>
            ) : (
              <>
                <FormControl fullWidth>
                  <InputLabel>Location</InputLabel>
                  <Select
                    value={selectedLocationId}
                    label="Location"
                    onChange={(e) => setSelectedLocationId(e.target.value as number | '')}
                  >
                    {locations.map((location) => (
                      <MenuItem key={location.id} value={location.id}>
                        {location.name}
                        {location.description && (
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                            ({location.description})
                          </Typography>
                        )}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

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

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontStyle: 'italic', mt: 0.5, display: 'block' }}
                  >
                    Note: Tracking quantities with card locations is optional.
                  </Typography>
                  <br />
                  <Typography variant="caption" color="text.secondary">
                    Collection totals: {totalQuantityReg} regular, {totalQuantityFoil} foil
                  </Typography>
                  <br />
                  <Typography variant="caption" color="text.secondary">
                    Already assigned: {totalAssignedReg} regular, {totalAssignedFoil} foil
                  </Typography>
                  <br />
                  <Typography variant="caption" color="text.secondary">
                    Available to assign: {availableReg} regular, {availableFoil} foil
                  </Typography>
                </Box>

                {cardLocations.length > 0 && !isUpdating && (
                  <Alert severity="info" icon={false}>
                    <Typography variant="body2" gutterBottom>
                      This card is already in:
                    </Typography>
                    {cardLocations.map((loc) => (
                      <Typography key={loc.locationId} variant="body2">
                        • {loc.locationName}: {loc.quantityReg}R / {loc.quantityFoil}F
                      </Typography>
                    ))}
                  </Alert>
                )}
              </>
            )}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={!selectedLocationId || isLoading || hasValidationError}>
          {isUpdating ? 'Update' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
