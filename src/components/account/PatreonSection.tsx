import {
  Alert,
  Autocomplete,
  Box,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Button as MuiButton,
  Switch,
  TextField,
  Typography,
  debounce,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useEffect, useMemo, useState } from 'react';
import { useLazyGetCardsQuery } from '@/api/browse/browseApi';
import { CardModel } from '@/api/browse/types';
import { useDisconnectPatreonMutation, useGetPatreonStatusQuery } from '@/api/patreon/patreonApi';
import { useUpdateUserMutation } from '@/api/user/userApi';
import { CustomCard } from '@/components/patrons/CustomCard';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export const PatreonSection = () => {
  const { user } = useAuth();
  const { data: patreonData, isLoading, error } = useGetPatreonStatusQuery();
  const [disconnectPatreon, { isLoading: isDisconnecting }] = useDisconnectPatreonMutation();
  const [updateUser, { isLoading: isUpdatingSupporterToggle }] = useUpdateUserMutation();
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  // Card selector state (for mythic supporters)
  const [selectedColor, setSelectedColor] = useState<string>(user?.patreonCardColor || 'white');
  const [searchCards, { data: cardsData }] = useLazyGetCardsQuery();
  const [cardSearchInput, setCardSearchInput] = useState('');
  const [debouncedSearchInput, setDebouncedSearchInput] = useState('');
  const [selectedCard, setSelectedCard] = useState<CardModel | null>(null);
  const [cardOptions, setCardOptions] = useState<CardModel[]>([]);
  const [isLoadingInitialCard, setIsLoadingInitialCard] = useState(false);

  // Debounce search input
  const debouncedSetSearchInput = useMemo(() => debounce((value: string) => setDebouncedSearchInput(value), 300), []);

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

  // Search for cards when debounced input changes
  useEffect(() => {
    if (debouncedSearchInput.length >= 2) {
      searchCards({
        name: debouncedSearchInput,
        limit: 50,
        sortBy: 'name',
        sortDirection: 'asc',
      });
    }
  }, [debouncedSearchInput, searchCards]);

  // Update card options when search results arrive
  useEffect(() => {
    if (cardsData?.data?.cards) {
      setCardOptions(cardsData.data.cards);
    }
  }, [cardsData]);

  // Sync selected color when user data loads
  useEffect(() => {
    if (user?.patreonCardColor) {
      setSelectedColor(user.patreonCardColor);
    }
  }, [user?.patreonCardColor]);

  // Load the user's existing card selection on mount
  useEffect(() => {
    if (!user?.patreonCardId || selectedCard || isLoadingInitialCard) {
      return;
    }

    const loadExistingCard = async () => {
      setIsLoadingInitialCard(true);
      try {
        const result = await searchCards({
          id: String(user.patreonCardId),
          limit: 1,
        });

        if (result.data?.data?.cards && result.data.data.cards.length > 0) {
          setSelectedCard(result.data.data.cards[0]);
          setCardSearchInput(result.data.data.cards[0].name);
        }
      } catch (error) {
        console.error('Failed to load existing card selection:', error);
      } finally {
        setIsLoadingInitialCard(false);
      }
    };

    loadExistingCard();
  }, [user?.patreonCardId, searchCards]);

  const handleSaveCustomCard = async () => {
    if (!selectedCard) {
      enqueueSnackbar('Please select a card', { variant: 'warning' });
      return;
    }

    try {
      const result = await updateUser({
        patreonCardId: selectedCard.id,
        patreonCardColor: selectedColor as 'white' | 'blue' | 'black' | 'red' | 'green' | 'gold' | 'colorless',
      }).unwrap();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to save custom card');
      }

      enqueueSnackbar('Custom card saved successfully!', { variant: 'success' });
    } catch (error: any) {
      const message = error.data?.error?.message || 'Failed to save custom card';
      enqueueSnackbar(message, { variant: 'error' });
    }
  };

  const handleDeleteCustomCard = async () => {
    try {
      const result = await updateUser({
        patreonCardId: null,
        patreonCardColor: null,
      }).unwrap();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to delete custom card');
      }

      setSelectedCard(null);
      setCardSearchInput('');
      setSelectedColor('white');
      enqueueSnackbar('Custom card deleted successfully!', { variant: 'success' });
    } catch (error: any) {
      const message = error.data?.error?.message || 'Failed to delete custom card';
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
            Support MTG Collection Builder on Patreon to help keep the site ad-free for everyone!
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              component="a"
              href="https://www.patreon.com/mtgcollectionbuilder"
              target="_blank"
              rel="noopener noreferrer"
            >
              Join Patreon
            </Button>
            <Button variant="outlined" onClick={handleConnectPatreon}>
              Link Existing Account
            </Button>
          </Box>
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

          {/* Never Been a Supporter Message */}
          {!currentTier && !highestTier && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Your Patreon account is linked! Join as a supporter to unlock rewards at specific tiers and help keep MTG
              Collection Builder ad-free for everyone.
            </Alert>
          )}

          {/* Former Patron Message */}
          {!currentTier && highestTier && (
            <Alert severity="info" sx={{ mb: 2 }}>
              You&apos;re a former patron. Thank you for your support!
            </Alert>
          )}

          {/* Supporter Display Toggle - Only show if user has ever been a supporter */}
          {highestTier && (
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
                When enabled, your username will be listed on the supporters page showing the highest tier you&apos;ve
                ever contributed to.
              </Typography>
            </Box>
          )}

          {/* Custom Card Selector (Mythic Supporters Only) */}
          {highestTier?.slug === 'mythic' && (
            <Box sx={{ mt: 3, mb: 2, p: 2, backgroundColor: 'action.hover', borderRadius: 1 }}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                Mythic Supporter Custom Card
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                For ever being a Mythic supporter, you can select a custom card to represent you on the supporters page!
              </Typography>

              {/* Color Selection */}
              <TextField
                select
                fullWidth
                label="Card Frame Color"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                sx={{ mb: 2 }}
              >
                <MenuItem value="white">White</MenuItem>
                <MenuItem value="blue">Blue</MenuItem>
                <MenuItem value="black">Black</MenuItem>
                <MenuItem value="red">Red</MenuItem>
                <MenuItem value="green">Green</MenuItem>
                <MenuItem value="gold">Gold (Multicolor)</MenuItem>
                <MenuItem value="colorless">Colorless</MenuItem>
              </TextField>

              {/* Card Search */}
              <Autocomplete
                fullWidth
                options={cardOptions}
                getOptionLabel={(option) => option.name}
                inputValue={cardSearchInput}
                onInputChange={(event, newInputValue, reason) => {
                  setCardSearchInput(newInputValue);
                  // Only trigger debounced search if the user is typing, not when selecting from dropdown
                  if (reason === 'input') {
                    debouncedSetSearchInput(newInputValue);
                  }
                }}
                onChange={(event, newValue) => {
                  setSelectedCard(newValue);
                }}
                value={selectedCard}
                noOptionsText={cardSearchInput.length < 2 ? 'Start typing to search...' : 'No cards found'}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Card Art"
                    placeholder="Type card name..."
                    helperText="Search for any Magic card by name"
                    InputLabelProps={{ shrink: true }}
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Box>
                      <Typography variant="body2">{option.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.setName}
                      </Typography>
                    </Box>
                  </li>
                )}
                sx={{ mb: 2 }}
              />

              {/* Card Preview */}
              {selectedCard && user && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Preview:
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      p: 2,
                      backgroundColor: 'background.paper',
                      borderRadius: 1,
                    }}
                  >
                    <CustomCard
                      username={user.username}
                      cardId={selectedCard.id}
                      color={selectedColor as 'white' | 'blue' | 'black' | 'red' | 'green' | 'gold' | 'colorless'}
                    />
                  </Box>
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button variant="outlined" onClick={handleSaveCustomCard} disabled={!selectedCard}>
                  Save Custom Card
                </Button>
                {user?.patreonCardId && (
                  <Button variant="outlined" color="error" onClick={handleDeleteCustomCard}>
                    Delete Custom Card
                  </Button>
                )}
              </Box>
            </Box>
          )}

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            {!currentTier && !highestTier && (
              <Button
                variant="contained"
                color="primary"
                component="a"
                href="https://www.patreon.com/mtgcollectionbuilder"
                target="_blank"
                rel="noopener noreferrer"
              >
                Join Patreon
              </Button>
            )}
            <Button variant="outlined" onClick={handleResyncPatreon}>
              Re-sync with Patreon
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={() => setDisconnectDialogOpen(true)}
              disabled={isDisconnecting}
            >
              Disconnect from Patreon
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
