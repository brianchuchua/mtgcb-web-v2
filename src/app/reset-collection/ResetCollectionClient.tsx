'use client';

import { useState } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper,
  Typography,
  styled,
  useTheme,
} from '@mui/material';
import { WarningAmber as WarningIcon, DeleteForever as DeleteIcon } from '@mui/icons-material';
import { useNukeCollectionMutation } from '@/api/collections/collectionsApi';
import { useSnackbar } from 'notistack';
import { useAuth } from '@/hooks/useAuth';

const InfoBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.action.hover,
  marginBottom: theme.spacing(2),
  marginTop: theme.spacing(2),
}));

export const ResetCollectionClient = () => {
  const router = useRouter();
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [nukeCollection, { isLoading }] = useNukeCollectionMutation();

  const handleReset = async () => {
    try {
      const result = await nukeCollection().unwrap();
      
      if (result.success && result.data) {
        enqueueSnackbar(`Successfully deleted ${result.data.deletedCount} collection entries`, { variant: 'success' });
        setConfirmDialogOpen(false);
        if (user?.userId) {
          router.push(`/collections/${user.userId}`);
        } else {
          router.push('/');
        }
      } else {
        enqueueSnackbar('Failed to reset collection', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error resetting collection:', error);
      enqueueSnackbar('An error occurred while resetting the collection', { variant: 'error' });
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Reset Collection
      </Typography>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <WarningIcon 
            sx={{ 
              color: theme.palette.warning.main, 
              fontSize: 48,
              mr: 2 
            }} 
          />
          <Typography variant="h5" component="h2" sx={{ fontWeight: 500 }}>
            Danger Zone
          </Typography>
        </Box>

        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
            This action cannot be undone!
          </Typography>
          <Typography variant="body2">
            Resetting your collection will permanently delete all cards, including both regular and foil quantities, 
            as well as any associated location data. If you haven't already,{' '}
            <NextLink href="/export">create an MTG CB export backup</NextLink> of your collection first.
          </Typography>
        </Alert>

        <InfoBox>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
            What will be deleted:
          </Typography>
          <Typography variant="body2" component="div">
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>All regular card quantities in your collection</li>
              <li>All foil card quantities in your collection</li>
              <li>All card location associations</li>
              <li>All collection-related data</li>
            </ul>
          </Typography>
        </InfoBox>

        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Button
            variant="contained"
            color="error"
            size="large"
            startIcon={<DeleteIcon />}
            onClick={() => setConfirmDialogOpen(true)}
            disabled={isLoading}
            sx={{
              px: 4,
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 500,
            }}
          >
            Reset My Collection
          </Button>
        </Box>
      </Paper>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
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
          Confirm Collection Reset
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action cannot be reversed. If you haven't already,{' '}
            <NextLink href="/export">create an MTG CB export backup</NextLink> of your collection first.
          </Alert>

          <InfoBox>
            <Typography variant="body2" gutterBottom>
              <strong>Action:</strong> Permanently delete all cards from your collection
            </Typography>
            <Typography variant="body2">
              <strong>Impact:</strong> All card quantities, foil quantities, and location data will be lost forever
            </Typography>
          </InfoBox>

          <DialogContentText sx={{ fontWeight: 500, mt: 2 }}>
            Are you absolutely sure you want to reset your entire collection?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button variant="outlined" onClick={() => setConfirmDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleReset} 
            disabled={isLoading}
          >
            Yes, Reset My Collection
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};