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
  Chip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Close as CloseIcon,
  Lock as LockIcon,
  Link as LinkIcon,
  ContentCopy as CopyIcon,
  Share as ShareIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useUpdateUserMutation } from '@/api/user/userApi';
import { 
  useGetShareLinkQuery, 
  useGenerateShareLinkMutation,
  useRevokeShareLinkMutation 
} from '@/api/user/shareLinkApi';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow, parseISO } from '@/utils/shareTokenDateUtils';
import { getAbsoluteShareUrl } from '@/utils/shareLinkUtils';

interface ShareCollectionModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  username: string;
  isPrivate: boolean;
  collectionName?: string;
  setSlug?: string;
}

const EXPIRATION_OPTIONS = [
  { value: 0, label: 'Never expires' },
  { value: 24, label: '1 day' },
  { value: 168, label: '1 week' },
  { value: 720, label: '1 month' },
];

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
  const [expiresInHours, setExpiresInHours] = useState(0);
  const [showShareLinkForm, setShowShareLinkForm] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const [updateUser] = useUpdateUserMutation();
  const { data: shareLinkData, isLoading: isLoadingShareLink } = useGetShareLinkQuery();
  const [generateShareLink, { isLoading: isGeneratingLink }] = useGenerateShareLinkMutation();
  const [revokeShareLink] = useRevokeShareLinkMutation();
  const { user, updateUser: updateAuthUser } = useAuth();
  const isOwnCollection = user?.userId?.toString() === userId;
  const urlInputRef = useRef<HTMLInputElement>(null);
  
  const hasActiveShareLink = shareLinkData?.data?.hasShareLink && 
    (!shareLinkData.data.expiresAt || new Date(shareLinkData.data.expiresAt) > new Date());

  useEffect(() => {
    setIsPrivate(initialIsPrivate);
    setIncludeFilters(false); // Reset to plain link when modal opens
    setShowShareLinkForm(false); // Reset share link form visibility
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

  const handleCopyLink = async (urlToCopy?: string) => {
    const url = urlToCopy || collectionUrl;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
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
  
  const handleGenerateShareLink = async () => {
    try {
      const result = await generateShareLink(
        expiresInHours > 0 ? { expiresInHours } : {}
      ).unwrap();
      
      if (result.success && result.data) {
        enqueueSnackbar('Share link generated successfully!', { variant: 'success' });
        setShowShareLinkForm(false);
        // Auto copy the new link
        if (result.data.shareUrl) {
          const absoluteUrl = getAbsoluteShareUrl(result.data.shareUrl);
          handleCopyLink(absoluteUrl);
        }
      }
    } catch (err) {
      enqueueSnackbar('Failed to generate share link', { variant: 'error' });
    }
  };
  
  const handleRevokeShareLink = async () => {
    try {
      const result = await revokeShareLink().unwrap();
      if (result.success) {
        enqueueSnackbar('Share link revoked', { variant: 'success' });
      }
    } catch (err) {
      enqueueSnackbar('Failed to revoke share link', { variant: 'error' });
    }
  };

  const handleUrlClick = () => {
    if (urlInputRef.current) {
      urlInputRef.current.select();
    }
  };

  const renderPrivateContent = () => {
    // Check if collection has an active share link
    if (hasActiveShareLink && shareLinkData?.data?.shareUrl) {
      return (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <LinkIcon sx={{ mr: 1, color: 'warning.main' }} />
            <Typography variant="h6">Private Collection with Share Link</Typography>
          </Box>
          
          <Typography variant="body2" sx={{ mb: 2 }}>
            Your collection is private, but you have an active share link. 
            Anyone with this link can view your collection.
          </Typography>
          
          {shareLinkData.data.expiresAt && (
            <Chip
              icon={<TimeIcon />}
              label={`Expires ${formatDistanceToNow(parseISO(shareLinkData.data.expiresAt), { addSuffix: true })}`}
              size="small"
              sx={{ mb: 2 }}
            />
          )}
          
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
            value={(() => {
              const baseUrl = getAbsoluteShareUrl(shareLinkData.data.shareUrl);
              if (includeFilters && hasQueryParams) {
                // Remove the share param and the leading ? from the search string
                const filteredParams = window.location.search
                  .replace(/[?&]share=[^&]+/g, '')
                  .replace(/^[?&]/, ''); // Remove leading ? or &
                
                // If there are params left, append them with & since baseUrl already has ?
                return filteredParams ? `${baseUrl}&${filteredParams}` : baseUrl;
              }
              return baseUrl;
            })()}
            inputRef={urlInputRef}
            onFocus={handleUrlClick}
            onClick={handleUrlClick}
            InputProps={{
              readOnly: true,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => {
                    if (shareLinkData.data?.shareUrl) {
                      const baseUrl = getAbsoluteShareUrl(shareLinkData.data.shareUrl);
                      let urlToCopy = baseUrl;
                      
                      if (includeFilters && hasQueryParams) {
                        const filteredParams = window.location.search
                          .replace(/[?&]share=[^&]+/g, '')
                          .replace(/^[?&]/, '');
                        urlToCopy = filteredParams ? `${baseUrl}&${filteredParams}` : baseUrl;
                      }
                      
                      handleCopyLink(urlToCopy);
                    }
                  }} edge="end">
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
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Privacy Options
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={!isPrivate}
                      onChange={handlePrivacyToggle}
                      disabled={isUpdating}
                    />
                  }
                  label="Make collection public (visible at its public URL)"
                />
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={handleRevokeShareLink}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Revoke Share Link
                </Button>
              </Box>
            </>
          )}
        </>
      );
    }
    
    // Default private content (no share link)
    return (
      <>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <LockIcon sx={{ mr: 1, color: 'warning.main' }} />
          <Typography variant="h6">Collection is Private</Typography>
        </Box>

        {isOwnCollection ? (
          <>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Your collection is currently private. Only you can see it.
              Choose how you want to share it:
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Alert severity="info">
                <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 1 }}>
                  Option 1: Make Collection Public
                </Typography>
                <Typography variant="body2">
                  Your collection will be visible at its public URL that anyone can access.
                </Typography>
                <FormControlLabel
                  sx={{ mt: 2 }}
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
              </Alert>
              
              <Alert severity="info">
                <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 1 }}>
                  Option 2: Generate a Private Share Link
                </Typography>
                <Typography variant="body2">
                  Keep your collection private but share it with specific people using a secure link.
                </Typography>
                
                {!showShareLinkForm ? (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<ShareIcon />}
                    onClick={() => setShowShareLinkForm(true)}
                    sx={{ mt: 2 }}
                  >
                    Generate Share Link
                  </Button>
                ) : (
                  <Box sx={{ mt: 2 }}>
                    <FormControl size="small" sx={{ minWidth: 200, mb: 2 }}>
                      <InputLabel>Expiration</InputLabel>
                      <Select
                        value={expiresInHours}
                        onChange={(e) => setExpiresInHours(Number(e.target.value))}
                        label="Expiration"
                      >
                        {EXPIRATION_OPTIONS.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={handleGenerateShareLink}
                        disabled={isGeneratingLink}
                        startIcon={isGeneratingLink ? <CircularProgress size={16} /> : <ShareIcon />}
                      >
                        Generate
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setShowShareLinkForm(false)}
                      >
                        Cancel
                      </Button>
                    </Box>
                  </Box>
                )}
              </Alert>
            </Box>
          </>
        ) : (
          <Typography variant="body1">
            This collection is private. Only {username} can view it.
          </Typography>
        )}
      </>
    );
  };

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
              <IconButton onClick={() => handleCopyLink()} edge="end">
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
        {(hasActiveShareLink || !isPrivate) && (
          <Button 
            variant="contained" 
            onClick={() => {
              if (hasActiveShareLink && isPrivate && shareLinkData?.data?.shareUrl) {
                const baseUrl = getAbsoluteShareUrl(shareLinkData.data.shareUrl);
                let urlToCopy = baseUrl;
                
                if (includeFilters && hasQueryParams) {
                  const filteredParams = window.location.search
                    .replace(/[?&]share=[^&]+/g, '')
                    .replace(/^[?&]/, '');
                  urlToCopy = filteredParams ? `${baseUrl}&${filteredParams}` : baseUrl;
                }
                
                handleCopyLink(urlToCopy);
              } else {
                handleCopyLink();
              }
            }} 
            startIcon={<CopyIcon />}
          >
            Copy Link
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};