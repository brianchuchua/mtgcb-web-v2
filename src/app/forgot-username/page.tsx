'use client';

import { PersonOutline } from '@mui/icons-material';
import { Avatar, Box, FormHelperText, TextField, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';
import { useEffect } from 'react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { useForm } from 'react-hook-form';
import { useForgotUsernameMutation } from '@/api/auth/authApi';
import { ApiResponse } from '@/api/types/apiTypes';
import CenteredContainer from '@/components/layout/CenteredContainer';
import { Button } from '@/components/ui/button';
import { Link } from '@/components/ui/link';
import { useAuth } from '@/hooks/useAuth';

interface ForgotUsernameFormInputs {
  email: string;
}

export default function ForgotUsernamePage() {
  const { enqueueSnackbar } = useSnackbar();
  const [forgotUsername] = useForgotUsernameMutation();
  const { isAuthenticated, user, isLoading } = useAuth();
  const { executeRecaptcha } = useGoogleReCaptcha();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.userId) {
      router.push('/');
    }
  }, [isAuthenticated, user, router, isLoading]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset,
  } = useForm<ForgotUsernameFormInputs>();

  if (isLoading || (isAuthenticated && user?.userId)) {
    return null;
  }

  const onSubmit = async (data: ForgotUsernameFormInputs) => {
    try {
      if (!executeRecaptcha) {
        setError('root', {
          type: 'manual',
          message: 'ReCAPTCHA not initialized. Please try again in a moment.',
        });
        return;
      }

      const token = await executeRecaptcha('forgotUsername');

      const result = await forgotUsername({
        email: data.email,
        recaptchaToken: token,
      }).unwrap();

      if (result.success) {
        enqueueSnackbar('Username sent to your email if a matching account exists.', {
          variant: 'success',
        });
        reset(); // Clear the form
      } else {
        setError('root', {
          type: 'manual',
          message: result.error?.message || 'Username recovery request failed. Please try again.',
        });
        enqueueSnackbar(result.error?.message || 'Username recovery request failed. Please try again.', {
          variant: 'error',
        });
      }
    } catch (error: any) {
      const errorData = error.data as ApiResponse<void>;
      const message =
        errorData?.error?.message || 'There was a problem requesting username recovery. Please try again in a moment.';

      setError('root', {
        type: 'manual',
        message,
      });
      enqueueSnackbar(message, { variant: 'error' });
    }
  };

  return (
    <CenteredContainer>
      <ForgotUsernameWrapper>
        <ForgotUsernameIcon data-testid="forgot-username-icon">
          <PersonOutline />
        </ForgotUsernameIcon>
        <Typography component="h1" variant="h5" data-testid="forgot-username-title">
          Forgot Username
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1, mb: 3 }} data-testid="forgot-username-description">
          Enter your email address and we'll send you your username.
        </Typography>
        <ForgotUsernameForm noValidate onSubmit={handleSubmit(onSubmit)} data-testid="forgot-username-form">
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
            autoFocus
            error={Boolean(errors.email)}
            helperText={errors.email?.message}
            slotProps={{
              htmlInput: {
                maxLength: 255,
                'data-testid': 'email-input',
              },
            }}
          />

          <Box>
            <FormHelperText error={Boolean(errors.root)} data-testid="form-error">{errors.root?.message}</FormHelperText>
          </Box>

          <SubmitButtonWrapper>
            <Button type="submit" fullWidth variant="contained" color="primary" isSubmitting={isSubmitting} data-testid="submit-button">
              Recover Username
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
            <Link href="/login" variant="body2" data-testid="login-link">
              Back to Login
            </Link>
          </Box>

          <Typography variant="caption" color="text.secondary" align="center" sx={{ mt: 2 }} data-testid="recaptcha-text">
            This site is protected by reCAPTCHA and the Google{' '}
            <Link href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" data-testid="privacy-link">
              Privacy Policy
            </Link>{' '}
            and{' '}
            <Link href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" data-testid="terms-link">
              Terms of Service
            </Link>{' '}
            apply.
          </Typography>
        </ForgotUsernameForm>
      </ForgotUsernameWrapper>
    </CenteredContainer>
  );
}

const ForgotUsernameWrapper = styled('div')(({ theme }) => ({
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: theme.spacing(3),
}));

const ForgotUsernameIcon = styled(Avatar)(({ theme }) => ({
  margin: theme.spacing(1),
  backgroundColor: theme.palette.primary.main,
}));

const ForgotUsernameForm = styled('form')(({ theme }) => ({
  width: '100%',
  marginTop: theme.spacing(1),
}));

const SubmitButtonWrapper = styled('div')(({ theme }) => ({
  margin: theme.spacing(3, 0, 2),
}));
