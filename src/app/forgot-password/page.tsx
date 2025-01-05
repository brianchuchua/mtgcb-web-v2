'use client';

import { LockOutlined } from '@mui/icons-material';
import { Avatar, Box, FormHelperText, TextField, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';
import { useEffect } from 'react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { useForm } from 'react-hook-form';
import { useForgotPasswordMutation } from '@/api/auth/authApi';
import { ApiResponse } from '@/api/types/apiTypes';
import CenteredContainer from '@/components/layout/CenteredContainer';
import { Button } from '@/components/ui/button';
import { Link } from '@/components/ui/link';
import { useAuth } from '@/hooks/useAuth';

interface ForgotPasswordFormInputs {
  username: string;
  email: string;
}

export default function ForgotPasswordPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [forgotPassword] = useForgotPasswordMutation();
  const { isAuthenticated, user, isLoading } = useAuth();
  const { executeRecaptcha } = useGoogleReCaptcha();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.userId) {
      router.push(`/collections/${user.userId}`);
    }
  }, [isAuthenticated, user, router, isLoading]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset,
  } = useForm<ForgotPasswordFormInputs>();

  if (isLoading || (isAuthenticated && user?.userId)) {
    return null;
  }

  const onSubmit = async (data: ForgotPasswordFormInputs) => {
    try {
      if (!executeRecaptcha) {
        setError('root', {
          type: 'manual',
          message: 'ReCAPTCHA not initialized. Please try again in a moment.',
        });
        return;
      }

      const token = await executeRecaptcha('forgotPassword');

      const result = await forgotPassword({
        username: data.username,
        email: data.email,
        recaptchaToken: token,
      }).unwrap();

      if (result.success) {
        enqueueSnackbar('Reset instructions sent to your email if a matching account exists.', {
          variant: 'success',
        });
        reset(); // Clear the form
      } else {
        setError('root', {
          type: 'manual',
          message: result.error?.message || 'Password reset request failed. Please try again.',
        });
        enqueueSnackbar(
          result.error?.message || 'Password reset request failed. Please try again.',
          {
            variant: 'error',
          },
        );
      }
    } catch (error: any) {
      const errorData = error.data as ApiResponse<void>;
      const message =
        errorData?.error?.message ||
        'There was a problem requesting a password reset. Please try again in a moment.';

      setError('root', {
        type: 'manual',
        message,
      });
      enqueueSnackbar(message, { variant: 'error' });
    }
  };

  return (
    <CenteredContainer>
      <ForgotPasswordWrapper>
        <ForgotPasswordIcon>
          <LockOutlined />
        </ForgotPasswordIcon>
        <Typography component="h1" variant="h5">
          Forgot Password
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1, mb: 3 }}>
          Enter your username and email address and we'll send you instructions to reset your
          password.
        </Typography>
        <ForgotPasswordForm noValidate onSubmit={handleSubmit(onSubmit)}>
          <TextField
            {...register('username', { required: 'Username is required' })}
            label="Username"
            type="text"
            variant="outlined"
            margin="normal"
            required
            fullWidth
            autoComplete="nickname"
            autoFocus
            error={Boolean(errors.username)}
            helperText={errors.username?.message}
            slotProps={{
              htmlInput: {
                maxLength: 255,
              },
            }}
          />

          <TextField
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address',
              },
            })}
            label="Email"
            type="email"
            variant="outlined"
            margin="normal"
            required
            fullWidth
            autoComplete="email"
            error={Boolean(errors.email)}
            helperText={errors.email?.message}
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
              Send Reset Instructions
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

          <Typography variant="caption" color="text.secondary" align="center" sx={{ mt: 2 }}>
            This site is protected by reCAPTCHA and the Google{' '}
            <Link
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy Policy
            </Link>{' '}
            and{' '}
            <Link
              href="https://policies.google.com/terms"
              target="_blank"
              rel="noopener noreferrer"
            >
              Terms of Service
            </Link>{' '}
            apply.
          </Typography>
        </ForgotPasswordForm>
      </ForgotPasswordWrapper>
    </CenteredContainer>
  );
}

const ForgotPasswordWrapper = styled('div')(({ theme }) => ({
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: theme.spacing(3),
}));

const ForgotPasswordIcon = styled(Avatar)(({ theme }) => ({
  margin: theme.spacing(1),
  backgroundColor: theme.palette.primary.main,
}));

const ForgotPasswordForm = styled('form')(({ theme }) => ({
  width: '100%',
  marginTop: theme.spacing(1),
}));

const SubmitButtonWrapper = styled('div')(({ theme }) => ({
  margin: theme.spacing(3, 0, 2),
}));
