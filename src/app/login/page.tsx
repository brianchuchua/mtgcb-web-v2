'use client';

import { LockOutlined } from '@mui/icons-material';
import { Avatar, Box, FormHelperText, TextField, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { useForm } from 'react-hook-form';
import { LoginData, useLoginMutation } from '@/api/auth/authApi';
import { ApiResponse } from '@/api/types/apiTypes';
import CenteredContainer from '@/components/layout/CenteredContainer';
import { Button } from '@/components/ui/button';
import { Link } from '@/components/ui/link';
import { useAuth } from '@/hooks/useAuth';

interface LoginFormInputs {
  username: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [login] = useLoginMutation();
  const { isAuthenticated, user, isLoading } = useAuth();
  const { executeRecaptcha } = useGoogleReCaptcha();

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
  } = useForm<LoginFormInputs>();

  if (isLoading || (isAuthenticated && user?.userId)) {
    return null;
  }

  const onSubmit = async (data: LoginFormInputs) => {
    try {
      if (!executeRecaptcha) {
        setError('root', {
          type: 'manual',
          message: 'ReCAPTCHA not initialized. Please try again in a moment.',
        });
        return;
      }

      const token = await executeRecaptcha('login');

      const result = await login({
        ...data,
        recaptchaToken: token,
      }).unwrap();

      if (result.success && result.data?.userId) {
        router.push(`/collections/${result.data.userId}`);
      } else if (!result.success) {
        setError('root', {
          type: 'manual',
          message: result.error?.message || 'Login failed unexpectedly. Please try again.',
        });
      }
    } catch (error: any) {
      const errorData = error.data as ApiResponse<LoginData>;
      const message =
        errorData?.error?.message ||
        'There was a problem trying to login. Please try again in a moment.';

      setError('root', {
        type: 'manual',
        message,
      });
    }
  };

  return (
    <CenteredContainer>
      <LoginWrapper>
        <LoginIcon data-testid="login-icon">
          <LockOutlined />
        </LoginIcon>
        <Typography component="h1" variant="h5" data-testid="login-title">
          Log In
        </Typography>
        <LoginForm noValidate onSubmit={handleSubmit(onSubmit)} data-testid="login-form">
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
                'data-testid': 'username-input',
              },
            }}
          />

          <TextField
            {...register('password', { required: 'Password is required' })}
            label="Password"
            variant="outlined"
            margin="normal"
            required
            fullWidth
            autoComplete="current-password"
            type="password"
            error={Boolean(errors.password)}
            helperText={errors.password?.message}
            slotProps={{
              htmlInput: {
                maxLength: 255,
                'data-testid': 'password-input',
              },
            }}
          />

          <Box>
            <FormHelperText error={Boolean(errors.root)} data-testid="form-error">
              {errors.root?.message}
            </FormHelperText>
          </Box>

          <SubmitButtonWrapper>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              isSubmitting={isSubmitting}
              data-testid="submit-button"
            >
              Log In
            </Button>
          </SubmitButtonWrapper>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: 4,
              width: '100%',
              mb: 2,
            }}
          >
            <Link href="/forgot-password" variant="body2" data-testid="forgot-password-link">
              Forgot password?
            </Link>
            <Link href="/forgot-username" variant="body2" data-testid="forgot-username-link">
              Forgot username?
            </Link>
          </Box>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              width: '100%',
              mb: 2,
            }}
          >
            <Button
              href="/signup"
              variant="outlined"
              color="secondary"
              fullWidth
              data-testid="signup-button"
            >
              Don't have an account? Sign Up
            </Button>
          </Box>

          <Typography
            variant="caption"
            color="text.secondary"
            align="center"
            sx={{ mt: 2 }}
            data-testid="recaptcha-text"
          >
            This site is protected by reCAPTCHA and the Google{' '}
            <Link
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="privacy-link"
            >
              Privacy Policy
            </Link>{' '}
            and{' '}
            <Link
              href="https://policies.google.com/terms"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="terms-link"
            >
              Terms of Service
            </Link>{' '}
            apply.
          </Typography>
        </LoginForm>
      </LoginWrapper>
    </CenteredContainer>
  );
}

const LoginWrapper = styled('div')(({ theme }) => ({
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: theme.spacing(3),
}));

const LoginIcon = styled(Avatar)(({ theme }) => ({
  margin: theme.spacing(1),
  backgroundColor: theme.palette.primary.main,
}));

const LoginForm = styled('form')(({ theme }) => ({
  width: '100%',
  marginTop: theme.spacing(1),
}));

const SubmitButtonWrapper = styled('div')(({ theme }) => ({
  margin: theme.spacing(3, 0, 2),
}));
