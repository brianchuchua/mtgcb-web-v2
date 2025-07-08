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
  TextField,
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

interface AddCardLocationsDialogProps {
  open: boolean;
  onClose: () => void;
  cardId: number;
  cardName: string;
  setName?: string;
  totalQuantityReg: number;
  totalQuantityFoil: number;
}

export default function AddCardLocationsDialog({
  open,
  onClose,
  cardId,
  cardName,
  setName,
  totalQuantityReg,
  totalQuantityFoil,
}: AddCardLocationsDialogProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [selectedLocationId, setSelectedLocationId] = useState<number | ''>('');
  const [quantityReg, setQuantityReg] = useState<string>('0');
  const [quantityFoil, setQuantityFoil] = useState<string>('0');
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
      setQuantityReg(existingLocation.quantityReg.toString());
      setQuantityFoil(existingLocation.quantityFoil.toString());
      setIsUpdating(true);
    } else {
      setQuantityReg('0');
      setQuantityFoil('0');
      setIsUpdating(false);
    }
  }, [existingLocation]);

  // Calculate available quantities (owned - already assigned to other locations)
  const currentLocationReg = existingLocation?.quantityReg || 0;
  const currentLocationFoil = existingLocation?.quantityFoil || 0;
  const availableReg = totalQuantityReg - totalAssignedReg + currentLocationReg;
  const availableFoil = totalQuantityFoil - totalAssignedFoil + currentLocationFoil;

  // Validate quantities don't exceed available
  const regQtyNum = parseInt(quantityReg) || 0;
  const foilQtyNum = parseInt(quantityFoil) || 0;
  const regExceedsAvailable = regQtyNum > availableReg;
  const foilExceedsAvailable = foilQtyNum > availableFoil;
  const hasValidationError = regExceedsAvailable || foilExceedsAvailable;

  const handleSave = async () => {
    if (!selectedLocationId) {
      enqueueSnackbar('Please select a location', { variant: 'error' });
      return;
    }

    const regQty = parseInt(quantityReg) || 0;
    const foilQty = parseInt(quantityFoil) || 0;

    if (regQty === 0 && foilQty === 0) {
      enqueueSnackbar('Please enter at least one quantity', { variant: 'error' });
      return;
    }

    if (regQty < 0 || foilQty < 0) {
      enqueueSnackbar('Quantities cannot be negative', { variant: 'error' });
      return;
    }

    if (regExceedsAvailable || foilExceedsAvailable) {
      enqueueSnackbar('Quantities cannot exceed available amounts', { variant: 'error' });
      return;
    }

    try {
      if (isUpdating) {
        await updateCardLocation({
          cardId,
          locationId: selectedLocationId as number,
          quantityReg: regQty,
          quantityFoil: foilQty,
        }).unwrap();
        enqueueSnackbar('Location quantities updated successfully', { variant: 'success' });
      } else {
        await associateCardLocation({
          cardId,
          locationId: selectedLocationId as number,
          quantityReg: regQty,
          quantityFoil: foilQty,
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
    setQuantityReg('0');
    setQuantityFoil('0');
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

                <Stack direction="row" spacing={2}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Regular Quantity"
                    value={quantityReg}
                    onChange={(e) => setQuantityReg(e.target.value)}
                    inputProps={{ min: 0 }}
                    error={regExceedsAvailable}
                    helperText={regExceedsAvailable ? `Maximum available: ${availableReg}` : ''}
                  />
                  <TextField
                    fullWidth
                    type="number"
                    label="Foil Quantity"
                    value={quantityFoil}
                    onChange={(e) => setQuantityFoil(e.target.value)}
                    inputProps={{ min: 0 }}
                    error={foilExceedsAvailable}
                    helperText={foilExceedsAvailable ? `Maximum available: ${availableFoil}` : ''}
                  />
                </Stack>

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
