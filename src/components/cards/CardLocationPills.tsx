import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useSnackbar } from 'notistack';
import { useState, useEffect } from 'react';
import { CardLocation } from '@/api/collections/collectionLocationsTypes';
import {
  useRemoveCardLocationMutation,
  useUpdateCardLocationMutation,
} from '@/api/collections/collectionsApi';
import { DualQuantitySelector } from '@/components/shared/QuantitySelector';

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  padding: theme.spacing(2),
}));

const ConfirmationBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.action.hover,
  marginBottom: theme.spacing(2),
}));

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

function EditLocationDialog({ open, onClose, location, cardId, cardName, setName, totalQuantityReg, totalQuantityFoil, canBeFoil = true, canBeNonFoil = true, allLocations }: EditLocationDialogProps) {
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
  const totalAssignedOthersReg = allLocations.reduce((sum, loc) => 
    loc.locationId === location.locationId ? sum : sum + loc.quantityReg, 0
  );
  const totalAssignedOthersFoil = allLocations.reduce((sum, loc) => 
    loc.locationId === location.locationId ? sum : sum + loc.quantityFoil, 0
  );

  // Calculate maximum that can be assigned to this location
  const maxAssignableReg = totalQuantityReg - totalAssignedOthersReg;
  const maxAssignableFoil = totalQuantityFoil - totalAssignedOthersFoil;

  // Validate quantities don't exceed maximum assignable
  const regExceedsAvailable = quantityReg > maxAssignableReg;
  const foilExceedsAvailable = quantityFoil > maxAssignableFoil;
  const hasValidationError = regExceedsAvailable || foilExceedsAvailable || (!canBeNonFoil && quantityReg > 0) || (!canBeFoil && quantityFoil > 0);

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
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ elevation: 0 }}>
      <DialogTitle>Edit Location Quantities</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {cardName}
            {setName && (
              <Typography component="span" variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                {' '}— {setName}
              </Typography>
            )}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            at {location.locationName}
          </Typography>
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
          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            Note: Tracking quantities with card locations is optional.
          </Typography>
          <Box>
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

export default function CardLocationPills({ cardId, cardName, setName, totalQuantityReg, totalQuantityFoil, canBeFoil = true, canBeNonFoil = true, locations: propLocations, align = 'center', onAddLocation }: CardLocationPillsProps) {
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
    .map(loc => ({
      locationId: loc.locationId,
      locationName: loc.locationName,
      description: loc.description,
      quantityReg: loc.quantityReg,
      quantityFoil: loc.quantityFoil
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
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: align === 'left' ? 'flex-start' : 'center' }}>
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
        )}
      </Box>

      {editingLocation && (
        <EditLocationDialog
          open={Boolean(editingLocation)}
          onClose={() => setEditingLocation(null)}
          location={locations.find(loc => loc.locationId === editingLocation.locationId) || editingLocation}
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
        maxWidth="xs"
        fullWidth
        PaperProps={{
          elevation: 0,
          sx: {
            borderRadius: 2,
            border: (theme) => `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        <DialogTitle
          sx={{
            textAlign: 'center',
            pb: 1,
            fontSize: '1rem',
            fontWeight: 500,
          }}
        >
          Remove Card from Location
        </DialogTitle>
        
        <StyledDialogContent>
          <ConfirmationBox>
            <Typography
              variant="body2"
              color="textSecondary"
              fontWeight="medium"
              sx={{ textAlign: 'center', fontStyle: 'italic' }}
            >
              Remove {cardName}
              {setName && (
                <Typography component="span" variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>
                  {' '}— {setName}
                </Typography>
              )}
              {' '}from {deletingLocation?.locationName}?
            </Typography>
          </ConfirmationBox>
          
          {deletingLocation && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: 'block',
                textAlign: 'center',
                mb: 1,
              }}
            >
              Currently tracking: {deletingLocation.quantityReg} regular, {deletingLocation.quantityFoil} foil
            </Typography>
          )}
          
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: 'block',
              textAlign: 'center',
              mt: 1,
            }}
          >
            This action cannot be undone.
          </Typography>
        </StyledDialogContent>
        
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button variant="outlined" size="small" onClick={handleCancelRemove} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmRemove}
            variant="contained"
            color="error"
            size="small"
            disabled={isDeleting}
          >
            {isDeleting ? 'Removing...' : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
