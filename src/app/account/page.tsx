'use client';

import { Alert, Box, Container, FormControlLabel, Paper, Switch, TextField, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { WarningAmber as WarningIcon, DeleteForever as DeleteIcon } from '@mui/icons-material';
import Link from 'next/link';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useUpdateUserMutation } from '@/api/user/userApi';
import { useDeleteAccountMutation } from '@/api/auth/authApi';
import { withAuth } from '@/components/auth/withAuth';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { DeleteAccountDialog } from '@/components/account/DeleteAccountDialog';

interface ProfileFormData {
  username: string;
  email: string;
  isPublic: boolean;
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
      isPublic: user?.isPublic ?? false,
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

  // Track profile form changes
  useEffect(() => {
    const hasChanges =
      profileValues.username !== user?.username ||
      profileValues.email !== user?.email ||
      profileValues.isPublic !== user?.isPublic;
    setHasProfileChanges(hasChanges);
  }, [profileValues, user]);

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
              error={!!profileErrors.username}
              helperText={profileErrors.username?.message}
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
              error={!!profileErrors.email}
              helperText={profileErrors.email?.message}
            />

            <FormControlLabel
              sx={{ mt: 2, mb: 1 }}
              control={<Switch {...registerProfile('isPublic')} checked={profileValues.isPublic || false} />}
              label="Make my collection public"
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
              When enabled, other users can view your collection data including cards, sets, locations, goals, values
              and statistics.
            </Typography>

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
          <CardHeader>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <WarningIcon 
                sx={{ 
                  color: (theme) => theme.palette.error.main,
                  fontSize: 28,
                  mr: 1
                }} 
              />
              <Typography variant="h6" sx={{ color: 'error.main' }}>
                Danger Zone - Delete Account
              </Typography>
            </Box>
          </CardHeader>
          <CardContent>
            <Alert severity="error" sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                Permanently delete your account
              </Typography>
              <Typography variant="body2">
                Once you delete your account, there is no going back. All your data will be permanently removed.
                This includes your entire collection, locations, goals, and all personal information.
                Consider <Link href="/export">exporting your collection</Link> first to create a backup of your data.
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
