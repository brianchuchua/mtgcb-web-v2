'use client';

import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
  useMediaQuery,
  Alert,
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  Delete as DeleteIcon,
  Link as LinkIcon,
  Refresh as RefreshIcon,
  Share as ShareIcon,
  AccessTime as TimeIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  useGenerateShareLinkMutation,
  useGetShareLinkQuery,
  useRevokeShareLinkMutation,
} from '@/api/user/shareLinkApi';
import { useSnackbar } from 'notistack';
import { formatDistanceToNow, parseISO } from '@/utils/shareTokenDateUtils';
import { getAbsoluteShareUrl } from '@/utils/shareLinkUtils';

const EXPIRATION_OPTIONS = [
  { value: 0, label: 'Never expires' },
  { value: 24, label: '1 day' },
  { value: 168, label: '1 week' },
  { value: 720, label: '1 month' },
  { value: 2160, label: '3 months' },
  { value: 8760, label: '1 year' },
];

export const ShareLinkManager = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { enqueueSnackbar } = useSnackbar();
  
  const [expiresInHours, setExpiresInHours] = useState(0);
  const [regenerateDialogOpen, setRegenerateDialogOpen] = useState(false);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data, isLoading, error } = useGetShareLinkQuery();
  const [generateShareLink, { isLoading: isGenerating }] = useGenerateShareLinkMutation();
  const [revokeShareLink, { isLoading: isRevoking }] = useRevokeShareLinkMutation();

  const shareData = data?.data;
  const hasShareLink = shareData?.hasShareLink || false;
  const isExpired = shareData?.expiresAt ? new Date(shareData.expiresAt) < new Date() : false;

  const handleCopyLink = async () => {
    if (!shareData?.shareUrl) return;

    const absoluteUrl = getAbsoluteShareUrl(shareData.shareUrl);
    
    try {
      await navigator.clipboard.writeText(absoluteUrl);
      setCopied(true);
      enqueueSnackbar('Share link copied to clipboard!', { variant: 'success' });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = absoluteUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      enqueueSnackbar('Share link copied to clipboard!', { variant: 'success' });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleGenerateLink = async () => {
    try {
      const result = await generateShareLink(
        expiresInHours > 0 ? { expiresInHours } : {}
      ).unwrap();
      
      if (result.success && result.data) {
        enqueueSnackbar('Share link generated successfully!', { variant: 'success' });
        // Auto copy the new link
        if (result.data.shareUrl) {
          const absoluteUrl = getAbsoluteShareUrl(result.data.shareUrl);
          try {
            await navigator.clipboard.writeText(absoluteUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            // Fallback handled in handleCopyLink if needed
          }
        }
      }
    } catch (err) {
      enqueueSnackbar('Failed to generate share link', { variant: 'error' });
    }
  };

  const handleRegenerateLink = async () => {
    setRegenerateDialogOpen(false);
    try {
      const result = await generateShareLink(
        expiresInHours > 0 ? { expiresInHours } : {}
      ).unwrap();
      
      if (result.success) {
        enqueueSnackbar('Share link regenerated successfully!', { variant: 'success' });
      }
    } catch (err) {
      enqueueSnackbar('Failed to regenerate share link', { variant: 'error' });
    }
  };

  const handleRevokeLink = async () => {
    setRevokeDialogOpen(false);
    try {
      const result = await revokeShareLink().unwrap();
      
      if (result.success) {
        enqueueSnackbar('Share link revoked successfully', { variant: 'success' });
      }
    } catch (err) {
      enqueueSnackbar('Failed to revoke share link', { variant: 'error' });
    }
  };

  const formatExpirationDate = (dateString: string) => {
    const date = parseISO(dateString);
    const now = new Date();
    
    if (date < now) {
      return 'Expired';
    }
    
    const distance = formatDistanceToNow(date, { addSuffix: true });
    return `Expires ${distance}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Skeleton variant="text" width="60%" height={32} />
            <Skeleton variant="rectangular" height={56} />
            <Skeleton variant="rectangular" height={48} />
          </Stack>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">
            Failed to load share link status. Please try again later.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent>
          <Stack spacing={3}>
            <Box>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinkIcon />
                Private Share Links
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Generate a secure link to share your private collection with others. 
                Anyone with the link can view your collection without logging in.
              </Typography>
            </Box>

            {hasShareLink && !isExpired ? (
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    icon={<CheckIcon />}
                    label="Active"
                    color="success"
                    size="small"
                  />
                  {shareData?.createdAt && (
                    <Typography variant="caption" color="text.secondary">
                      Created {formatDistanceToNow(parseISO(shareData.createdAt), { addSuffix: true })}
                    </Typography>
                  )}
                  {shareData?.expiresAt && (
                    <Chip
                      icon={<TimeIcon />}
                      label={formatExpirationDate(shareData.expiresAt)}
                      color={isExpired ? 'error' : 'default'}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>

                <TextField
                  fullWidth
                  value={shareData?.shareUrl ? getAbsoluteShareUrl(shareData.shareUrl) : ''}
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <InputAdornment position="end">
                        <Tooltip title={copied ? 'Copied!' : 'Copy link'}>
                          <IconButton onClick={handleCopyLink} edge="end">
                            {copied ? <CheckIcon color="success" /> : <CopyIcon />}
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ 
                    '& .MuiInputBase-input': { 
                      fontSize: isMobile ? '0.875rem' : '1rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }
                  }}
                />

                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={() => setRegenerateDialogOpen(true)}
                    disabled={isGenerating}
                    size={isMobile ? 'small' : 'medium'}
                  >
                    Regenerate
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => setRevokeDialogOpen(true)}
                    disabled={isRevoking}
                    size={isMobile ? 'small' : 'medium'}
                  >
                    Revoke
                  </Button>
                </Stack>
              </Stack>
            ) : hasShareLink && isExpired ? (
              <Stack spacing={2}>
                <Alert severity="warning" icon={<WarningIcon />}>
                  Your share link has expired. Generate a new one to share your collection.
                </Alert>
                <Box>
                  <FormControl fullWidth sx={{ mb: 2 }}>
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
                  <Button
                    variant="contained"
                    startIcon={isGenerating ? <CircularProgress size={20} /> : <ShareIcon />}
                    onClick={handleGenerateLink}
                    disabled={isGenerating}
                    fullWidth={isMobile}
                  >
                    Generate New Share Link
                  </Button>
                </Box>
              </Stack>
            ) : (
              <Stack spacing={2}>
                <Alert severity="info">
                  No active share link. Generate one to share your private collection.
                </Alert>
                <Box>
                  <FormControl fullWidth sx={{ mb: 2 }}>
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
                  <Button
                    variant="contained"
                    startIcon={isGenerating ? <CircularProgress size={20} /> : <ShareIcon />}
                    onClick={handleGenerateLink}
                    disabled={isGenerating}
                    fullWidth={isMobile}
                  >
                    Generate Share Link
                  </Button>
                </Box>
              </Stack>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Dialog
        open={regenerateDialogOpen}
        onClose={() => setRegenerateDialogOpen(false)}
      >
        <DialogTitle>Regenerate Share Link?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will invalidate your current share link. Anyone using the old link will lose access to your collection.
          </DialogContentText>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>New Expiration</InputLabel>
            <Select
              value={expiresInHours}
              onChange={(e) => setExpiresInHours(Number(e.target.value))}
              label="New Expiration"
            >
              {EXPIRATION_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRegenerateDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleRegenerateLink} 
            color="primary" 
            variant="contained"
            disabled={isGenerating}
            startIcon={isGenerating && <CircularProgress size={20} />}
          >
            Regenerate
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={revokeDialogOpen}
        onClose={() => setRevokeDialogOpen(false)}
      >
        <DialogTitle>Revoke Share Link?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will immediately disable the share link. Anyone using it will lose access to your collection.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRevokeDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleRevokeLink} 
            color="error" 
            variant="contained"
            disabled={isRevoking}
            startIcon={isRevoking && <CircularProgress size={20} />}
          >
            Revoke
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};