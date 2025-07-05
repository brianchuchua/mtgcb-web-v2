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
  TextField,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import { CardLocation } from '@/api/collections/collectionLocationsTypes';
import {
  useGetCardLocationsQuery,
  useRemoveCardLocationMutation,
  useUpdateCardLocationMutation,
} from '@/api/collections/collectionsApi';

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
}

interface EditLocationDialogProps {
  open: boolean;
  onClose: () => void;
  location: CardLocation;
  cardId: number;
  cardName: string;
  setName?: string;
}

function EditLocationDialog({ open, onClose, location, cardId, cardName, setName }: EditLocationDialogProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [quantityReg, setQuantityReg] = useState(location.quantityReg.toString());
  const [quantityFoil, setQuantityFoil] = useState(location.quantityFoil.toString());
  const [updateCardLocation, { isLoading }] = useUpdateCardLocationMutation();

  const handleSave = async () => {
    const regQty = parseInt(quantityReg) || 0;
    const foilQty = parseInt(quantityFoil) || 0;

    if (regQty < 0 || foilQty < 0) {
      enqueueSnackbar('Quantities cannot be negative', { variant: 'error' });
      return;
    }

    if (regQty === 0 && foilQty === 0) {
      enqueueSnackbar('At least one quantity must be greater than 0', { variant: 'error' });
      return;
    }

    try {
      await updateCardLocation({
        cardId,
        locationId: location.locationId,
        quantityReg: regQty,
        quantityFoil: foilQty,
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
          <TextField
            fullWidth
            type="number"
            label="Regular Quantity"
            value={quantityReg}
            onChange={(e) => setQuantityReg(e.target.value)}
            inputProps={{ min: 0 }}
          />
          <TextField
            fullWidth
            type="number"
            label="Foil Quantity"
            value={quantityFoil}
            onChange={(e) => setQuantityFoil(e.target.value)}
            inputProps={{ min: 0 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            Note: Tracking quantities with card locations is optional.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={isLoading}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function CardLocationPills({ cardId, cardName, setName }: CardLocationPillsProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [editingLocation, setEditingLocation] = useState<CardLocation | null>(null);
  const [deletingLocation, setDeletingLocation] = useState<CardLocation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { data: locationsResponse, isLoading } = useGetCardLocationsQuery(cardId);
  const [removeCardLocation] = useRemoveCardLocationMutation();

  const locations = locationsResponse?.data?.locations || [];

  if (isLoading || locations.length === 0) {
    return null;
  }

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
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1, justifyContent: 'center' }}>
        {locations.map((location) => (
          <Chip
            key={location.locationId}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <span>{location.locationName}</span>
                <Typography variant="caption" component="span" sx={{ opacity: 0.8 }}>
                  {location.quantityReg > 0 && `${location.quantityReg}R`}
                  {location.quantityReg > 0 && location.quantityFoil > 0 && '/'}
                  {location.quantityFoil > 0 && `${location.quantityFoil}F`}
                </Typography>
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
      </Box>

      {editingLocation && (
        <EditLocationDialog
          open={Boolean(editingLocation)}
          onClose={() => setEditingLocation(null)}
          location={editingLocation}
          cardId={cardId}
          cardName={cardName}
          setName={setName}
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
