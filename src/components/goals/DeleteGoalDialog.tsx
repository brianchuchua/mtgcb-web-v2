import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';

interface DeleteGoalDialogProps {
  open: boolean;
  goalName: string;
  isDeleting?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteGoalDialog({ open, goalName, isDeleting = false, onConfirm, onCancel }: DeleteGoalDialogProps) {
  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle>Delete Goal</DialogTitle>
      <DialogContent>
        <Typography>Are you sure you want to delete "{goalName}"? This action cannot be undone.</Typography>
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