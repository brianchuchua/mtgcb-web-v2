import {
  Alert,
  Box,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  Switch,
  Button as MuiButton,
  Typography,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import { useDisconnectPatreonMutation, useGetPatreonStatusQuery } from '@/api/patreon/patreonApi';
import { useUpdateUserMutation } from '@/api/user/userApi';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export const PatreonSection = () => {
  const { user } = useAuth();
  const { data: patreonData, isLoading, error } = useGetPatreonStatusQuery();
  const [disconnectPatreon, { isLoading: isDisconnecting }] = useDisconnectPatreonMutation();
  const [updateUser, { isLoading: isUpdatingSupporterToggle }] = useUpdateUserMutation();
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const handleConnectPatreon = () => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_MTGCB_API_BASE_URL;
    window.location.href = `${apiBaseUrl}/patreon/authorize`;
  };

  const handleResyncPatreon = () => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_MTGCB_API_BASE_URL;
    window.location.href = `${apiBaseUrl}/patreon/authorize`;
  };

  const handleDisconnectPatreon = async () => {
    try {
      const result = await disconnectPatreon().unwrap();
      if (result.success) {
        enqueueSnackbar('Patreon account disconnected successfully', { variant: 'success' });
        setDisconnectDialogOpen(false);
      } else {
        throw new Error(result.error?.message || 'Failed to disconnect');
      }
    } catch (error: any) {
      const message = error.data?.error?.message || 'Failed to disconnect Patreon account';
      enqueueSnackbar(message, { variant: 'error' });
    }
  };

  const handleToggleSupporterDisplay = async (showAsSupporter: boolean) => {
    try {
      const result = await updateUser({ showAsPatreonSupporter: showAsSupporter }).unwrap();
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to update setting');
      }
      enqueueSnackbar('Supporter display setting updated successfully', { variant: 'success' });
    } catch (error: any) {
      const message = error.data?.error?.message || 'Failed to update supporter display setting';
      enqueueSnackbar(message, { variant: 'error' });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (error) {
    return <Alert severity="error">Failed to load Patreon status. Please try again later.</Alert>;
  }

  const isLinked = patreonData?.data?.linked || false;
  const currentTier = patreonData?.data?.currentTier;
  const highestTier = patreonData?.data?.highestTier;

  return (
    <Box>
      {!isLinked ? (
        // Not Linked State
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Link your Patreon account to show off your support!
          </Typography>
          <Button variant="contained" onClick={handleConnectPatreon} sx={{ mt: 1 }}>
            Connect with Patreon
          </Button>
        </Box>
      ) : (
        // Linked State
        <Box>
          {/* Current Tier Display */}
          {currentTier && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Current Tier
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <TierBadge badge={currentTier.badge} />
                <Typography variant="body1" fontWeight={500}>
                  {currentTier.name}
                </Typography>
                {currentTier.isActive && (
                  <Typography variant="caption" color="success.main">
                    Active
                  </Typography>
                )}
              </Box>
            </Box>
          )}

          {/* Highest Tier Display */}
          {highestTier && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Highest Tier Ever
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <TierBadge badge={highestTier.badge} />
                <Typography variant="body1" fontWeight={500}>
                  {highestTier.name}
                </Typography>
                {highestTier.isOverride && (
                  <Typography variant="caption" color="primary.main">
                    Granted
                  </Typography>
                )}
              </Box>
            </Box>
          )}

          {/* Former Patron Message */}
          {!currentTier && highestTier && (
            <Alert severity="info" sx={{ mb: 2 }}>
              You&apos;re a former patron. Thank you for your support!
            </Alert>
          )}

          {/* Supporter Display Toggle */}
          <Box sx={{ mt: 3, mb: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={user?.showAsPatreonSupporter || false}
                  onChange={(e) => handleToggleSupporterDisplay(e.target.checked)}
                  disabled={isUpdatingSupporterToggle}
                />
              }
              label="Show me on the supporters page"
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mt: 0.5 }}>
              When enabled, your username will be listed on the supporters page showing the highest tier
              you&apos;ve ever contributed to.
            </Typography>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button variant="outlined" onClick={handleResyncPatreon}>
              Re-sync with Patreon
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={() => setDisconnectDialogOpen(true)}
              disabled={isDisconnecting}
            >
              Disconnect
            </Button>
          </Box>
        </Box>
      )}

      {/* Disconnect Confirmation Dialog */}
      <Dialog open={disconnectDialogOpen} onClose={() => setDisconnectDialogOpen(false)}>
        <DialogTitle>Disconnect Patreon Account?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to disconnect your Patreon account? You can always link it again later.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <MuiButton onClick={() => setDisconnectDialogOpen(false)}>Cancel</MuiButton>
          <MuiButton onClick={handleDisconnectPatreon} color="error" disabled={isDisconnecting}>
            Disconnect
          </MuiButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Tier Badge Component
interface TierBadgeProps {
  badge: 'C' | 'U' | 'R' | 'M';
}

const TierBadge = ({ badge }: TierBadgeProps) => {
  const getBadgeColor = () => {
    switch (badge) {
      case 'C':
        return '#94A3B8'; // Common - gray/blue
      case 'U':
        return '#C0C0C0'; // Uncommon - silver
      case 'R':
        return '#FFD700'; // Rare - gold
      case 'M':
        return '#FF6B35'; // Mythic - orange/red
      default:
        return '#94A3B8';
    }
  };

  return (
    <Box
      sx={{
        width: 24,
        height: 24,
        borderRadius: '50%',
        backgroundColor: getBadgeColor(),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        fontSize: '0.75rem',
        color: '#000',
      }}
    >
      {badge}
    </Box>
  );
};
