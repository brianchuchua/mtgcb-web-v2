'use client';

import {
  DeleteForever as DeleteIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  WarningAmber as WarningIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Collapse,
  Container,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDeleteAccountMutation } from '@/api/auth/authApi';
import { useUpdateUserMutation } from '@/api/user/userApi';
import { AccessSummary } from '@/components/account/AccessSummary';
import { DeleteAccountDialog } from '@/components/account/DeleteAccountDialog';
import { ShareLinkManager } from '@/components/account/ShareLinkManager';
import { withAuth } from '@/components/auth/withAuth';
import { CollectionProgressBar } from '@/components/collections/CollectionProgressBar';
import SetIcon from '@/components/sets/SetIcon';
import { Button } from '@/components/ui/button';
import { usePriceType, useProgressBarStyle, useSetIconStyle } from '@/contexts/DisplaySettingsContext';
import { useAuth } from '@/hooks/useAuth';
import { PriceType } from '@/types/pricing';

interface ProfileFormData {
  username: string;
  email: string;
}

interface PasswordFormData {
  password: string;
  confirmPassword: string;
}

function ProfileContent() {
  const { user, isLoading } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const router = useRouter();
  const [updateUser] = useUpdateUserMutation();
  const [deleteAccount, { isLoading: isDeletingAccount }] = useDeleteAccountMutation();
  const [hasProfileChanges, setHasProfileChanges] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDangerZoneOpen, setIsDangerZoneOpen] = useState(false);
  const [priceType, setPriceType] = usePriceType();
  const [progressBarStyle, setProgressBarStyle] = useProgressBarStyle();
  const [setIconStyle, setSetIconStyle] = useSetIconStyle();
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isSubmitting: isProfileSubmitting },
    setError: setProfileError,
    watch: watchProfile,
  } = useForm<ProfileFormData>({
    defaultValues: {
      username: user?.username || '',
      email: user?.email || '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting, isValid: passwordIsValid },
    watch: watchPassword,
    reset: resetPassword,
  } = useForm<PasswordFormData>({
    mode: 'onChange',
  });

  const profileValues = watchProfile();
  const passwordFormValues = watchPassword();

  // Track profile form changes (excluding isPublic since it auto-saves)
  useEffect(() => {
    const hasChanges = profileValues.username !== user?.username || profileValues.email !== user?.email;
    setHasProfileChanges(hasChanges);
  }, [profileValues.username, profileValues.email, user]);

  // Check if password form is valid and matching
  const isPasswordFormValid =
    passwordIsValid &&
    passwordFormValues.password &&
    passwordFormValues.password === passwordFormValues.confirmPassword &&
    passwordFormValues.password.length >= 8;

  const onProfileSubmit = async (data: ProfileFormData) => {
    try {
      const result = await updateUser(data).unwrap();

      if (!result.success) {
        if (result.error?.code === 'USERNAME_TAKEN') {
          setProfileError('username', { message: 'Username is already taken' });
        } else if (result.error?.code === 'EMAIL_TAKEN') {
          setProfileError('email', { message: 'Email is already registered' });
        } else {
          throw new Error(result.error?.message);
        }
        return;
      }

      enqueueSnackbar('Profile updated successfully', { variant: 'success' });
    } catch (error: any) {
      const message = error.data?.error?.message || 'Failed to update profile';
      enqueueSnackbar(message, { variant: 'error' });
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    try {
      const result = await updateUser({
        password: data.password,
      }).unwrap();

      if (!result.success) {
        throw new Error(result.error?.message);
      }

      resetPassword();
      enqueueSnackbar('Password updated successfully', { variant: 'success' });
    } catch (error: any) {
      const message = error.data?.error?.message || 'Failed to update password';
      enqueueSnackbar(message, { variant: 'error' });
    }
  };

  const handlePrivacyToggle = async (isPublic: boolean) => {
    setIsUpdatingPrivacy(true);
    try {
      const result = await updateUser({ isPublic }).unwrap();

      if (!result.success) {
        throw new Error(result.error?.message);
      }

      enqueueSnackbar('Privacy settings updated successfully', { variant: 'success' });
    } catch (error: any) {
      const message = error.data?.error?.message || 'Failed to update privacy settings';
      enqueueSnackbar(message, { variant: 'error' });
    } finally {
      setIsUpdatingPrivacy(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const result = await deleteAccount().unwrap();

      if (result.success) {
        enqueueSnackbar('Your account has been permanently deleted', { variant: 'success' });
        setDeleteDialogOpen(false);
        // Redirect to home page after successful deletion
        router.push('/');
      } else {
        throw new Error(result.error?.message || 'Failed to delete account');
      }
    } catch (error: any) {
      console.error('Error deleting account:', error);
      const message = error.data?.error?.message || 'An error occurred while deleting your account';
      enqueueSnackbar(message, { variant: 'error' });
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <Container maxWidth="md">
      <Typography variant="h4" component="h1" sx={{ mb: 4, textAlign: 'center' }}>
        Account Settings
      </Typography>

      <CardStack>
        <Paper variant="outlined">
          <CardHeader>
            <Typography variant="h6">Profile</Typography>
          </CardHeader>
          <Form onSubmit={handleProfileSubmit(onProfileSubmit)} noValidate>
            <TextField
              {...registerProfile('username', {
                required: 'Username is required',
                maxLength: {
                  value: 255,
                  message: 'Username cannot exceed 255 characters',
                },
              })}
              margin="normal"
              fullWidth
              label="Username"
              autoComplete="username"
              error={!!profileErrors.username}
              helperText={profileErrors.username?.message}
              slotProps={{
                htmlInput: {
                  spellCheck: 'false',
                  autoCapitalize: 'off',
                  autoCorrect: 'off',
                },
              }}
            />

            <TextField
              {...registerProfile('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
                maxLength: {
                  value: 255,
                  message: 'Email cannot exceed 255 characters',
                },
              })}
              margin="normal"
              fullWidth
              label="Email"
              type="email"
              autoComplete="email"
              error={!!profileErrors.email}
              helperText={profileErrors.email?.message}
              slotProps={{
                htmlInput: {
                  spellCheck: 'false',
                  autoCapitalize: 'off',
                },
              }}
            />

            <ButtonWrapper>
              <Button
                type="submit"
                variant="contained"
                isSubmitting={isProfileSubmitting}
                disabled={!hasProfileChanges}
              >
                Update Profile
              </Button>
            </ButtonWrapper>
          </Form>
        </Paper>

        <Paper variant="outlined">
          <CardHeader>
            <Typography variant="h6">Password</Typography>
          </CardHeader>
          <Form onSubmit={handlePasswordSubmit(onPasswordSubmit)} noValidate>
            <TextField
              {...registerPassword('password', {
                required: 'New password is required',
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters long',
                },
                maxLength: {
                  value: 255,
                  message: 'Password cannot exceed 255 characters',
                },
              })}
              margin="normal"
              fullWidth
              label="New Password"
              type="password"
              error={!!passwordErrors.password}
              helperText={passwordErrors.password?.message}
            />

            <TextField
              {...registerPassword('confirmPassword', {
                required: 'Please confirm your new password',
                validate: (value) => value === passwordFormValues.password || 'The passwords do not match',
              })}
              margin="normal"
              fullWidth
              label="Confirm New Password"
              type="password"
              error={!!passwordErrors.confirmPassword}
              helperText={passwordErrors.confirmPassword?.message}
            />

            <ButtonWrapper>
              <Button
                type="submit"
                variant="contained"
                isSubmitting={isPasswordSubmitting}
                disabled={!isPasswordFormValid}
              >
                Update Password
              </Button>
            </ButtonWrapper>
          </Form>
        </Paper>

        <Paper variant="outlined">
          <CardHeader>
            <Typography variant="h6">Privacy & Sharing</Typography>
          </CardHeader>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={user?.isPublic || false}
                    onChange={(e) => handlePrivacyToggle(e.target.checked)}
                    disabled={isUpdatingPrivacy}
                  />
                }
                label="Make my collection public"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mt: 1 }}>
                When enabled, your collection is visible at its public URL that anyone can access.
              </Typography>
            </Box>

            <AccessSummary isPublic={user?.isPublic || false} />

            {!user?.isPublic && <ShareLinkManager />}
          </CardContent>
        </Paper>

        <Paper variant="outlined">
          <CardHeader>
            <Typography variant="h6">Price Settings</Typography>
          </CardHeader>
          <CardContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Choose how prices are displayed throughout the application. This setting is saved on your device.
            </Typography>
            <Select
              value={priceType}
              onChange={(e) => setPriceType(e.target.value as PriceType)}
              fullWidth
              sx={{ maxWidth: 300 }}
            >
              <MenuItem value={PriceType.Market}>Market</MenuItem>
              <MenuItem value={PriceType.Low}>Low</MenuItem>
              <MenuItem value={PriceType.Average}>Average</MenuItem>
              <MenuItem value={PriceType.High}>High</MenuItem>
            </Select>
          </CardContent>
        </Paper>

        <Paper variant="outlined">
          <CardHeader>
            <Typography variant="h6">Progress Bar Style</Typography>
          </CardHeader>
          <CardContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Choose how progress bars appear throughout the site. This setting is saved on your device.
            </Typography>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: { xs: 'stretch', md: 'flex-start' },
                gap: 3,
              }}
            >
              <Box sx={{ minWidth: { xs: '100%', md: 200 } }}>
                <Select
                  value={progressBarStyle}
                  onChange={(e) => setProgressBarStyle(e.target.value as 'mythic' | 'boring' | 'boring-green')}
                  fullWidth
                >
                  <MenuItem value="mythic">Going Mythic</MenuItem>
                  <MenuItem value="boring">Boring</MenuItem>
                  <MenuItem value="boring-green">Boring Green</MenuItem>
                </Select>
                <Box sx={{ mt: 2 }}>
                  {progressBarStyle === 'mythic' && (
                    <Typography variant="body2" color="text.secondary">
                      Progress bars turn mythic orange and animate when full
                    </Typography>
                  )}
                  {progressBarStyle === 'boring' && (
                    <Typography variant="body2" color="text.secondary">
                      Progress bars keep the same theme color always and don't animate
                    </Typography>
                  )}
                  {progressBarStyle === 'boring-green' && (
                    <Typography variant="body2" color="text.secondary">
                      Progress bars use green always instead of the theme color and don't animate
                    </Typography>
                  )}
                </Box>
              </Box>
              <Box
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  mt: { xs: 2, md: 0 },
                }}
              >
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    75% Complete
                  </Typography>
                  <CollectionProgressBar
                    percentage={75}
                    height={20}
                    showLabel={true}
                    maxWidth={300}
                  />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    100% Complete
                  </Typography>
                  <CollectionProgressBar
                    percentage={100}
                    height={20}
                    showLabel={true}
                    maxWidth={300}
                  />
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Paper>

        <Paper variant="outlined">
          <CardHeader>
            <Typography variant="h6">Set Icon Style</Typography>
          </CardHeader>
          <CardContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Choose how set icons change color based on collection progress. This setting is saved on your device.
            </Typography>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: { xs: 'stretch', md: 'flex-start' },
                gap: 3,
              }}
            >
              <Box sx={{ minWidth: { xs: '100%', md: 200 } }}>
                <Select
                  value={setIconStyle}
                  onChange={(e) => setSetIconStyle(e.target.value as 'mythic' | 'boring')}
                  fullWidth
                >
                  <MenuItem value="mythic">Going Mythic</MenuItem>
                  <MenuItem value="boring">Boring</MenuItem>
                </Select>
                <Box sx={{ mt: 2 }}>
                  {setIconStyle === 'mythic' && (
                    <Typography variant="body2" color="text.secondary">
                      Set icons move through rarity colors as progress in a set increases
                    </Typography>
                  )}
                  {setIconStyle === 'boring' && (
                    <Typography variant="body2" color="text.secondary">
                      Set icons stay the default color and never change based on progress
                    </Typography>
                  )}
                </Box>
              </Box>
              <Box
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  mt: { xs: 2, md: 0 },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <SetIcon code="LGN" size="2x" rarity="common" />
                  <Typography variant="body2" color="text.secondary">
                    0-33% Complete (Common)
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <SetIcon code="LGN" size="2x" rarity="uncommon" />
                  <Typography variant="body2" color="text.secondary">
                    34-66% Complete (Uncommon)
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <SetIcon code="LGN" size="2x" rarity="rare" />
                  <Typography variant="body2" color="text.secondary">
                    67-99% Complete (Rare)
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <SetIcon code="LGN" size="2x" rarity="mythic" />
                  <Typography variant="body2" color="text.secondary">
                    100% Complete (Mythic)
                  </Typography>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Paper>

        <Paper variant="outlined">
          <CardHeader>
            <Typography variant="h6">Patreon</Typography>
          </CardHeader>
          <CardContent>
            <Typography>
              This section is in progress. :)
              <br />
              <br />
              Immortal/Reserved List tier patrons will get the ability to customize a card to represent their collection
              in a hall of fame.
            </Typography>
          </CardContent>
        </Paper>

        <Paper variant="outlined">
          <CardHeader
            sx={{
              cursor: 'pointer',
              userSelect: 'none',
              '&:hover': {
                backgroundColor: (theme) => theme.palette.action.hover,
              },
            }}
            onClick={() => setIsDangerZoneOpen(!isDangerZoneOpen)}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <WarningIcon
                  sx={{
                    color: (theme) => theme.palette.error.main,
                    fontSize: 28,
                    mr: 1,
                  }}
                />
                <Typography variant="h6" sx={{ color: 'error.main' }}>
                  Danger Zone - Delete Account
                </Typography>
              </Box>
              <IconButton size="small" sx={{ color: 'error.main' }}>
                {isDangerZoneOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
          </CardHeader>
          <Collapse in={isDangerZoneOpen}>
            <CardContent>
              <Alert severity="error" sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  Permanently delete your account
                </Typography>
                <Typography variant="body2">
                  Once you delete your account, there is no going back. All your data will be permanently removed. This
                  includes your entire collection, locations, goals, and all personal information. Consider{' '}
                  <Link href="/export">exporting your collection</Link> first to create a backup of your data.
                </Typography>
              </Alert>

              <ButtonWrapper>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={isDeletingAccount}
                  sx={{
                    px: 3,
                    py: 1,
                  }}
                >
                  Delete Account
                </Button>
              </ButtonWrapper>
            </CardContent>
          </Collapse>
        </Paper>
      </CardStack>

      <DeleteAccountDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteAccount}
        isLoading={isDeletingAccount}
      />
    </Container>
  );
}

const CardStack = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
});

const CardHeader = styled('div')({
  padding: '24px 24px 16px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
});

const CardContent = styled('div')({
  padding: '24px',
});

const Form = styled('form')({
  width: '100%',
  padding: '24px',
});

const ButtonWrapper = styled('div')({
  display: 'flex',
  justifyContent: 'flex-end',
  marginTop: '24px',
});

export default withAuth(ProfileContent);
