import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Button,
  IconButton,
  FormControlLabel,
  Switch,
  TextField,
  InputAdornment,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  Lock as LockIcon,
  Link as LinkIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useUpdateUserMutation } from '@/api/user/userApi';
import { useAuth } from '@/hooks/useAuth';

interface ShareCollectionModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  username: string;
  isPrivate: boolean;
  collectionName?: string;
  setSlug?: string;
}

export const ShareCollectionModal = ({
  open,
  onClose,
  userId,
  username,
  isPrivate: initialIsPrivate,
  collectionName,
  setSlug,
}: ShareCollectionModalProps) => {
  const [isPrivate, setIsPrivate] = useState(initialIsPrivate);
  const [isUpdating, setIsUpdating] = useState(false);
  const [includeFilters, setIncludeFilters] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const [updateUser] = useUpdateUserMutation();
  const { user, updateUser: updateAuthUser } = useAuth();
  const isOwnCollection = user?.userId?.toString() === userId;
  const urlInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsPrivate(initialIsPrivate);
    setIncludeFilters(false); // Reset to plain link when modal opens
  }, [initialIsPrivate, open]);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const basePath = setSlug
    ? `${baseUrl}/collections/${userId}/${setSlug}`
    : `${baseUrl}/collections/${userId}`;
  
  // Get current URL with query parameters
  const currentUrlWithParams = typeof window !== 'undefined' ? window.location.href : basePath;
  const hasQueryParams = typeof window !== 'undefined' && window.location.search.length > 0;
  
  const collectionUrl = includeFilters && hasQueryParams ? currentUrlWithParams : basePath;

  const handlePrivacyToggle = async () => {
    if (!isOwnCollection) return;

    const newIsPublic = isPrivate;
    setIsUpdating(true);

    try {
      const result = await updateUser({ isPublic: newIsPublic }).unwrap();

      if (result.success) {
        setIsPrivate(!newIsPublic);
        if (user) {
          updateAuthUser({ ...user, isPublic: newIsPublic });
        }
        enqueueSnackbar(
          newIsPublic ? 'Collection is now public' : 'Collection is now private',
          { variant: 'success' }
        );
      } else {
        throw new Error(result.error?.message);
      }
    } catch (error: any) {
      const message = error.data?.error?.message || 'Failed to update privacy setting';
      enqueueSnackbar(message, { variant: 'error' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(collectionUrl);
        enqueueSnackbar('Link copied!', { variant: 'success' });
      } else {
        // Select the text for manual copying
        if (urlInputRef.current) {
          urlInputRef.current.select();
          enqueueSnackbar('Press Ctrl+C (or Cmd+C) to copy', { variant: 'info' });
        }
      }
    } catch (error) {
      enqueueSnackbar('Please copy the link manually', { variant: 'warning' });
    }
  };

  const handleUrlClick = () => {
    if (urlInputRef.current) {
      urlInputRef.current.select();
    }
  };

  const renderPrivateContent = () => (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <LockIcon sx={{ mr: 1, color: 'warning.main' }} />
        <Typography variant="h6">Collection is Private</Typography>
      </Box>

      {isOwnCollection ? (
        <>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Your collection is currently private. Only you can see it.
            Make it public to share with others.
          </Typography>

          <Alert severity="info" sx={{ mb: 3 }}>
            When public, anyone with the link can view your collection including cards, sets, locations, goals, values and statistics.
          </Alert>

          <FormControlLabel
            control={
              <Switch
                checked={!isPrivate}
                onChange={handlePrivacyToggle}
                disabled={isUpdating}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                Make collection public
                {isUpdating && <CircularProgress size={16} sx={{ ml: 1 }} />}
              </Box>
            }
          />
        </>
      ) : (
        <Typography variant="body1">
          This collection is private. Only {username} can view it.
        </Typography>
      )}
    </>
  );

  const renderPublicContent = () => (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <LinkIcon sx={{ mr: 1, color: 'success.main' }} />
        <Typography variant="h6">Share Your Collection</Typography>
      </Box>

      <Typography variant="body2" sx={{ mb: 2 }}>
        {collectionName
          ? `Anyone with this link can view ${username}'s ${collectionName} collection`
          : `Anyone with this link can view ${username}'s collection`}
      </Typography>

      {hasQueryParams && (
        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={includeFilters}
                onChange={(e) => setIncludeFilters(e.target.checked)}
                size="small"
              />
            }
            label={
              <Box>
                <Typography variant="body2">Include current view</Typography>
                <Typography variant="caption" color="text.secondary">
                  Share with your current filters, search, and settings
                </Typography>
              </Box>
            }
          />
        </Box>
      )}

      <TextField
        fullWidth
        value={collectionUrl}
        inputRef={urlInputRef}
        onFocus={handleUrlClick}
        onClick={handleUrlClick}
        InputProps={{
          readOnly: true,
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={handleCopyLink} edge="end">
                <CopyIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{ mb: 3 }}
        helperText={
          includeFilters && hasQueryParams
            ? "Sharing current view with filters"
            : "Sharing plain collection link"
        }
      />

      {isOwnCollection && (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Privacy Settings
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={!isPrivate}
                onChange={handlePrivacyToggle}
                disabled={isUpdating}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                Collection is public
                {isUpdating && <CircularProgress size={16} sx={{ ml: 1 }} />}
              </Box>
            }
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Turning off will make your collection private
          </Typography>
        </>
      )}
    </>
  );

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
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
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Collection Sharing</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {isPrivate ? renderPrivateContent() : renderPublicContent()}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {isPrivate && isOwnCollection && (
          <Button
            variant="contained"
            onClick={handlePrivacyToggle}
            disabled={isUpdating}
            startIcon={isUpdating ? <CircularProgress size={16} /> : null}
          >
            Make Public & Share
          </Button>
        )}
        {!isPrivate && (
          <Button variant="contained" onClick={handleCopyLink} startIcon={<CopyIcon />}>
            Copy Link
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};