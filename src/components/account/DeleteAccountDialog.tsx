import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import Link from 'next/link';
import { useState } from 'react';

interface DeleteAccountDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

const InfoBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.action.hover,
  marginBottom: theme.spacing(2),
}));

const CONFIRMATION_TEXT = 'delete my account';

export const DeleteAccountDialog: React.FC<DeleteAccountDialogProps> = ({
  open,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  const [confirmationInput, setConfirmationInput] = useState('');
  
  const isConfirmationValid = confirmationInput.toLowerCase() === CONFIRMATION_TEXT;

  const handleClose = () => {
    setConfirmationInput('');
    onClose();
  };

  const handleConfirm = () => {
    if (isConfirmationValid) {
      onConfirm();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
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
          pb: 1,
          fontSize: '1.25rem',
          fontWeight: 500,
        }}
      >
        Delete Account
      </DialogTitle>
      <DialogContent>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            This action is permanent and cannot be undone!
          </Typography>
          <Typography variant="body2">
            All your data will be permanently deleted, including your collection, 
            locations, goals, and all personal information. We strongly recommend{' '}
            <Link href="/export">exporting your collection</Link> first to create a backup.
          </Typography>
        </Alert>

        <InfoBox>
          <Typography variant="body2" gutterBottom sx={{ fontWeight: 500 }}>
            What will be deleted:
          </Typography>
          <Typography variant="body2" component="div">
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>Your entire card collection and quantities</li>
              <li>All collection locations and organization</li>
              <li>Collection goals and progress</li>
              <li>Account information and preferences</li>
              <li>All personal data associated with your account</li>
            </ul>
          </Typography>
        </InfoBox>

        <DialogContentText sx={{ mb: 2, fontWeight: 500 }}>
          To confirm, please type <strong>{CONFIRMATION_TEXT}</strong> below:
        </DialogContentText>

        <TextField
          autoFocus
          fullWidth
          value={confirmationInput}
          onChange={(e) => setConfirmationInput(e.target.value)}
          placeholder={CONFIRMATION_TEXT}
          disabled={isLoading}
          error={confirmationInput !== '' && !isConfirmationValid}
          helperText={
            confirmationInput !== '' && !isConfirmationValid
              ? 'Text does not match'
              : ''
          }
          sx={{ mb: 2 }}
        />
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
        <Button 
          variant="outlined" 
          onClick={handleClose}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleConfirm}
          disabled={!isConfirmationValid || isLoading}
        >
          {isLoading ? 'Deleting...' : 'Delete My Account'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};