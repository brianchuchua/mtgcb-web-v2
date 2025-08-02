import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import { CardLocation } from '@/api/collections/collectionLocationsTypes';
import { useRemoveCardLocationMutation, useUpdateCardLocationMutation } from '@/api/collections/collectionsApi';
import { DualQuantitySelector } from '@/components/shared/QuantitySelector';

interface CardLocationPillsProps {
  cardId: number;
  cardName: string;
  setName?: string;
  totalQuantityReg: number;
  totalQuantityFoil: number;
  canBeFoil?: boolean;
  canBeNonFoil?: boolean;
  locations?: {
    locationId: number;
    locationName: string;
    description: string | null;
    quantityReg: number;
    quantityFoil: number;
  }[];
  align?: 'left' | 'center';
  onAddLocation?: (event: React.MouseEvent) => void;
}

interface EditLocationDialogProps {
  open: boolean;
  onClose: () => void;
  location: CardLocation;
  cardId: number;
  cardName: string;
  setName?: string;
  totalQuantityReg: number;
  totalQuantityFoil: number;
  canBeFoil?: boolean;
  canBeNonFoil?: boolean;
  allLocations: CardLocation[];
}

function EditLocationDialog({
  open,
  onClose,
  location,
  cardId,
  cardName,
  setName,
  totalQuantityReg,
  totalQuantityFoil,
  canBeFoil = true,
  canBeNonFoil = true,
  allLocations,
}: EditLocationDialogProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [quantityReg, setQuantityReg] = useState(location.quantityReg);
  const [quantityFoil, setQuantityFoil] = useState(location.quantityFoil);
  const [updateCardLocation, { isLoading }] = useUpdateCardLocationMutation();

  // Update state when location prop changes
  useEffect(() => {
    setQuantityReg(location.quantityReg);
    setQuantityFoil(location.quantityFoil);
  }, [location.quantityReg, location.quantityFoil]);

  // Calculate totals already assigned across ALL locations
  const totalAssignedReg = allLocations.reduce((sum, loc) => sum + loc.quantityReg, 0);
  const totalAssignedFoil = allLocations.reduce((sum, loc) => sum + loc.quantityFoil, 0);

  // Calculate available quantities (unassigned cards)
  const availableReg = totalQuantityReg - totalAssignedReg;
  const availableFoil = totalQuantityFoil - totalAssignedFoil;

  // Calculate totals assigned to OTHER locations (excluding current) for validation
  const totalAssignedOthersReg = allLocations.reduce(
    (sum, loc) => (loc.locationId === location.locationId ? sum : sum + loc.quantityReg),
    0,
  );
  const totalAssignedOthersFoil = allLocations.reduce(
    (sum, loc) => (loc.locationId === location.locationId ? sum : sum + loc.quantityFoil),
    0,
  );

  // Calculate maximum that can be assigned to this location
  const maxAssignableReg = totalQuantityReg - totalAssignedOthersReg;
  const maxAssignableFoil = totalQuantityFoil - totalAssignedOthersFoil;

  // Validate quantities don't exceed maximum assignable
  const regExceedsAvailable = quantityReg > maxAssignableReg;
  const foilExceedsAvailable = quantityFoil > maxAssignableFoil;
  const hasValidationError =
    regExceedsAvailable ||
    foilExceedsAvailable ||
    (!canBeNonFoil && quantityReg > 0) ||
    (!canBeFoil && quantityFoil > 0);

  const handleSave = async () => {
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
      await updateCardLocation({
        cardId,
        locationId: location.locationId,
        quantityReg: quantityReg,
        quantityFoil: quantityFoil,
      }).unwrap();
      enqueueSnackbar('Location quantities updated', { variant: 'success' });
      onClose();
    } catch (error: any) {
      const message = error?.data?.error?.message || 'Failed to update location';
      enqueueSnackbar(message, { variant: 'error' });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ elevation: 0 }}>
      <DialogTitle>Edit Location Quantities</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 0 }}>
          {/* Action and Selectors */}
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Edit quantities for{' '}
              <Typography component="span" variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
                {cardName}
                {setName && ` (${setName})`}
              </Typography>{' '}
              in{' '}
              <Typography component="span" variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
                {location.locationName}
              </Typography>
            </Typography>
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
              maxRegular={maxAssignableReg}
              maxFoil={maxAssignableFoil}
              regularError={regExceedsAvailable}
              foilError={foilExceedsAvailable}
              regularHelperText={regExceedsAvailable ? `Maximum available: ${maxAssignableReg}` : undefined}
              foilHelperText={foilExceedsAvailable ? `Maximum available: ${maxAssignableFoil}` : undefined}
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
                    Quantities assigned:
                  </Typography>
                  <Typography variant="body2">
                    {totalAssignedReg} regular
                    {totalAssignedFoil > 0 && `, ${totalAssignedFoil} foil`}
                  </Typography>
                </Box>

                {/* Current Locations */}
                {allLocations.length > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      Located in:
                    </Typography>
                    <Stack spacing={0.25}>
                      {allLocations.map((loc) => (
                        <Typography
                          key={loc.locationId}
                          variant="body2"
                          sx={{ fontWeight: loc.locationId === location.locationId ? 600 : 400 }}
                        >
                          • {loc.locationName}
                          {(loc.quantityReg > 0 || loc.quantityFoil > 0) && ': '}
                          {loc.quantityReg > 0 && `${loc.quantityReg} regular`}
                          {loc.quantityReg > 0 && loc.quantityFoil > 0 && ', '}
                          {loc.quantityFoil > 0 && `${loc.quantityFoil} foil`}
                          {loc.locationId === location.locationId && ' (editing)'}
                        </Typography>
                      ))}
                    </Stack>
                  </Box>
                )}

                {/* Available to Assign */}
                {(maxAssignableReg > quantityReg || maxAssignableFoil > quantityFoil) && (
                  <Box sx={{ pt: 0.5, borderTop: 1, borderColor: 'divider' }}>
                    <Typography variant="caption" color="success.main" sx={{ fontWeight: 500 }}>
                      Can assign up to: {maxAssignableReg} regular
                      {maxAssignableFoil > 0 && `, ${maxAssignableFoil} foil`}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={isLoading || hasValidationError}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function CardLocationPills({
  cardId,
  cardName,
  setName,
  totalQuantityReg,
  totalQuantityFoil,
  canBeFoil = true,
  canBeNonFoil = true,
  locations: propLocations,
  align = 'center',
  onAddLocation,
}: CardLocationPillsProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [editingLocation, setEditingLocation] = useState<CardLocation | null>(null);
  const [deletingLocation, setDeletingLocation] = useState<CardLocation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [removeCardLocation] = useRemoveCardLocationMutation();

  // Only use locations from props - no API calls
  if (!propLocations || propLocations.length === 0) {
    return null;
  }

  // Transform locations to CardLocation type and sort alphabetically - this will re-run when propLocations changes
  const locations: CardLocation[] = propLocations
    .map((loc) => ({
      locationId: loc.locationId,
      locationName: loc.locationName,
      description: loc.description,
      quantityReg: loc.quantityReg,
      quantityFoil: loc.quantityFoil,
    }))
    .sort((a, b) => a.locationName.localeCompare(b.locationName));

  const handleRemoveClick = (location: CardLocation, event: React.MouseEvent) => {
    event.stopPropagation();
    setDeletingLocation(location);
  };

  const handleConfirmRemove = async () => {
    if (!deletingLocation) return;

    setIsDeleting(true);
    try {
      await removeCardLocation({
        cardId,
        locationId: deletingLocation.locationId,
      }).unwrap();
      enqueueSnackbar('Card removed from location', { variant: 'success' });
      setDeletingLocation(null);
    } catch (error: any) {
      const message = error?.data?.error?.message || 'Failed to remove location';
      enqueueSnackbar(message, { variant: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelRemove = () => {
    setDeletingLocation(null);
  };

  const handleChipClick = (location: CardLocation) => {
    setEditingLocation(location);
  };

  return (
    <>
      <Box
        sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: align === 'left' ? 'flex-start' : 'center' }}
      >
        {locations.map((location) => (
          <Chip
            key={location.locationId}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <span>{location.locationName}</span>
                <span style={{ opacity: 0.7, fontSize: '0.875em' }}>
                  {location.quantityReg > 0 && `${location.quantityReg}R`}
                  {location.quantityReg > 0 && location.quantityFoil > 0 && '/'}
                  {location.quantityFoil > 0 && `${location.quantityFoil}F`}
                </span>
              </Box>
            }
            size="small"
            onClick={() => handleChipClick(location)}
            onDelete={(e) => handleRemoveClick(location, e as any)}
            deleteIcon={
              <IconButton size="small" sx={{ padding: 0, ml: 0.5 }}>
                <CloseIcon sx={{ fontSize: 16 }} />
              </IconButton>
            }
            sx={{
              cursor: 'pointer',
              '& .MuiChip-deleteIcon': {
                color: 'text.secondary',
                '&:hover': {
                  color: 'error.main',
                },
              },
            }}
          />
        ))}
        {onAddLocation && (
          <Tooltip title="Add card location(s)" placement="top">
            <Chip
              label="+"
              onClick={onAddLocation}
              size="small"
              sx={{
                cursor: 'pointer',
                color: 'text.secondary',
                borderColor: 'divider',
                '&:hover': {
                  backgroundColor: 'action.hover',
                  borderColor: 'text.secondary',
                },
              }}
              variant="outlined"
            />
          </Tooltip>
        )}
      </Box>

      {editingLocation && (
        <EditLocationDialog
          open={Boolean(editingLocation)}
          onClose={() => setEditingLocation(null)}
          location={locations.find((loc) => loc.locationId === editingLocation.locationId) || editingLocation}
          cardId={cardId}
          cardName={cardName}
          setName={setName}
          totalQuantityReg={totalQuantityReg}
          totalQuantityFoil={totalQuantityFoil}
          canBeFoil={canBeFoil}
          canBeNonFoil={canBeNonFoil}
          allLocations={locations}
        />
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={Boolean(deletingLocation)}
        onClose={handleCancelRemove}
        maxWidth="sm"
        fullWidth
        PaperProps={{ elevation: 0 }}
      >
        <DialogTitle>Remove Card from Location</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 0 }}>
            {/* Action */}
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Remove{' '}
                <Typography component="span" variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
                  {cardName}
                  {setName && ` (${setName})`}
                </Typography>{' '}
                from{' '}
                <Typography component="span" variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
                  {deletingLocation?.locationName}
                </Typography>
                ?
              </Typography>
            </Box>

            {/* Current Status */}
            {deletingLocation && (
              <Card variant="outlined" sx={{ bgcolor: 'background.default' }}>
                <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                  <Stack spacing={1}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        Currently tracking at this location:
                      </Typography>
                      <Typography variant="body2">
                        {deletingLocation.quantityReg} regular
                        {deletingLocation.quantityFoil > 0 && `, ${deletingLocation.quantityFoil} foil`}
                      </Typography>
                    </Box>
                    <Box sx={{ pt: 0.5, borderTop: 1, borderColor: 'divider' }}>
                      <Typography variant="caption" color="warning.main" sx={{ fontWeight: 500 }}>
                        This action cannot be undone
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelRemove} disabled={isDeleting}>
            Cancel
          </Button>
          <Button onClick={handleConfirmRemove} variant="contained" color="error" disabled={isDeleting}>
            {isDeleting ? 'Removing...' : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
