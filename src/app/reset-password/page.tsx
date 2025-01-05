'use client';

import { ErrorOutline, LockOutlined } from '@mui/icons-material';
import { Avatar, Box, FormHelperText, TextField, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useResetPasswordMutation, useValidatePasswordResetMutation } from '@/api/auth/authApi';
import { ApiResponse } from '@/api/types/apiTypes';
import CenteredContainer from '@/components/layout/CenteredContainer';
import { Button } from '@/components/ui/button';
import { Link } from '@/components/ui/link';

interface ResetPasswordFormInputs {
  newPassword: string;
  confirmPassword: string;
}

export default function ResetPasswordPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [validateToken] = useValidatePasswordResetMutation();
  const [resetPassword] = useResetPasswordMutation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    watch,
  } = useForm<ResetPasswordFormInputs>();

  const password = watch('newPassword');

  useEffect(() => {
    const validateResetToken = async () => {
      if (!token) {
        setValidationError('No reset token provided. Please request a new password reset link.');
        setIsTokenValid(false);
        return;
      }

      try {
        const result = await validateToken({ token: token }).unwrap();
        setIsTokenValid(result.success);
        if (!result.success) {
          setValidationError(
            result.error?.message ||
              'This password reset link is invalid or has expired. Please request a new one.',
          );
        }
      } catch (error: any) {
        const errorData = error.data as ApiResponse<void>;
        const message = errorData?.error?.message || 'Error validating reset token';
        setValidationError(message);
        setIsTokenValid(false);
      }
    };

    validateResetToken();
  }, [token, validateToken]);

  const onSubmit = async (data: ResetPasswordFormInputs) => {
    if (!token) {
      return;
    }

    try {
      const result = await resetPassword({
        token: token,
        newPassword: data.newPassword,
      }).unwrap();

      if (result.success) {
        enqueueSnackbar('Your password has been successfully reset! Go ahead and log in.', {
          variant: 'success',
        });
        router.push('/login');
      } else {
        setError('root', {
          type: 'manual',
          message: result.error?.message || 'Failed to reset password. Please try again.',
        });
        enqueueSnackbar(result.error?.message || 'Failed to reset password. Please try again.', {
          variant: 'error',
        });
      }
    } catch (error: any) {
      const errorData = error.data as ApiResponse<void>;
      const message =
        errorData?.error?.message ||
        'There was a problem resetting the password. Please try again in a moment.';

      setError('root', {
        type: 'manual',
        message,
      });
      enqueueSnackbar(message, { variant: 'error' });
    }
  };

  // Don't render anything until we have a definitive answer about the token
  if (isTokenValid === null) {
    return null;
  }

  if (!isTokenValid) {
    return (
      <CenteredContainer>
        <InvalidTokenMessage message={validationError || 'Invalid reset token'} />
      </CenteredContainer>
    );
  }

  return (
    <CenteredContainer>
      <ResetPasswordWrapper>
        <ResetPasswordIcon>
          <LockOutlined />
        </ResetPasswordIcon>
        <Typography component="h1" variant="h5">
          Reset Password
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1, mb: 3 }}>
          Enter your new password below.
        </Typography>
        <ResetPasswordForm noValidate onSubmit={handleSubmit(onSubmit)}>
          <TextField
            {...register('newPassword', {
              required: 'Password is required',
              minLength: {
                value: 8,
                message: 'Password must be at least eight characters long',
              },
            })}
            label="New Password"
            variant="outlined"
            margin="normal"
            required
            fullWidth
            type="password"
            error={Boolean(errors.newPassword)}
            helperText={errors.newPassword?.message}
            slotProps={{
              htmlInput: {
                maxLength: 255,
              },
            }}
          />

          <TextField
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: (value) => value === password || 'Passwords must match',
            })}
            label="Confirm Password"
            variant="outlined"
            margin="normal"
            required
            fullWidth
            type="password"
            error={Boolean(errors.confirmPassword)}
            helperText={errors.confirmPassword?.message}
            slotProps={{
              htmlInput: {
                maxLength: 255,
              },
            }}
          />

          <Box>
            <FormHelperText error={Boolean(errors.root)}>{errors.root?.message}</FormHelperText>
          </Box>

          <SubmitButtonWrapper>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              isSubmitting={isSubmitting}
            >
              Reset Password
            </Button>
          </SubmitButtonWrapper>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              width: '100%',
              mb: 2,
            }}
          >
            <Link href="/login" variant="body2">
              Back to Login
            </Link>
          </Box>
        </ResetPasswordForm>
      </ResetPasswordWrapper>
    </CenteredContainer>
  );
}

const ResetPasswordWrapper = styled('div')(({ theme }) => ({
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: theme.spacing(3),
}));

const TokenErrorWrapper = styled('div')(({ theme }) => ({
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: theme.spacing(3),
}));

const ResetPasswordIcon = styled(Avatar)(({ theme }) => ({
  margin: theme.spacing(1),
  backgroundColor: theme.palette.primary.main,
}));

const TokenErrorIcon = styled(Avatar)(({ theme }) => ({
  margin: theme.spacing(1),
  backgroundColor: theme.palette.error.main,
}));

const ResetPasswordForm = styled('form')(({ theme }) => ({
  width: '100%',
  marginTop: theme.spacing(1),
}));

const SubmitButtonWrapper = styled('div')(({ theme }) => ({
  margin: theme.spacing(3, 0, 2),
}));

const InvalidTokenMessage = ({ message }: { message: string }) => (
  <TokenErrorWrapper>
    <TokenErrorIcon>
      <ErrorOutline />
    </TokenErrorIcon>
    <Typography component="h1" variant="h5" sx={{ mb: 2 }}>
      Invalid Reset Link
    </Typography>
    <Typography color="text.secondary" align="center" sx={{ mb: 3 }}>
      {message}
    </Typography>
    <Button href="/login" variant="contained" color="primary" fullWidth>
      Return to Login
    </Button>
  </TokenErrorWrapper>
);
