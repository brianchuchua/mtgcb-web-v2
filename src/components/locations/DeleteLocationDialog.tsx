import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';

interface DeleteLocationDialogProps {
  open: boolean;
  locationName: string;
  isDeleting?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteLocationDialog({ 
  open, 
  locationName, 
  isDeleting = false, 
  onConfirm, 
  onCancel 
}: DeleteLocationDialogProps) {
  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle>Delete Location</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete "{locationName}"? This will remove any associations between this
          location and your collection items.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={isDeleting}>
          Cancel
        </Button>
        <Button onClick={onConfirm} color="error" variant="contained" disabled={isDeleting}>
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}