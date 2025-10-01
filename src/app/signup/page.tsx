'use client';

import { SentimentVerySatisfied } from '@mui/icons-material';
import { Avatar, Box, FormHelperText, TextField, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { useForm } from 'react-hook-form';
import { LoginData, SignUpData, useLoginMutation, useSignUpMutation } from '@/api/auth/authApi';
import { ApiResponse } from '@/api/types/apiTypes';
import CenteredContainer from '@/components/layout/CenteredContainer';
import { Button } from '@/components/ui/button';
import { Link } from '@/components/ui/link';
import { useAuth } from '@/hooks/useAuth';
import { trimFormData } from '@/utils/form/trimFormData';

interface SignUpFormInputs {
  username: string;
  email: string;
  password: string;
  passwordConfirmation: string;
}

export default function SignUpPage() {
  const router = useRouter();
  const [signUp] = useSignUpMutation();
  const [login] = useLoginMutation();
  const { isAuthenticated, user, isLoading } = useAuth();
  const { executeRecaptcha } = useGoogleReCaptcha();

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
    watch,
  } = useForm<SignUpFormInputs>();

  const password = watch('password');

  if (isLoading || (isAuthenticated && user?.userId)) {
    return null;
  }

  const onSubmit = async (data: SignUpFormInputs) => {
    try {
      if (!executeRecaptcha) {
        setError('root', {
          type: 'manual',
          message: 'ReCAPTCHA not initialized. Please try again in a moment.',
        });
        return;
      }

      const token = await executeRecaptcha('signup');
      const trimmedData = trimFormData(data);

      // First attempt signup
      const signupResult = await signUp({
        username: trimmedData.username,
        email: trimmedData.email,
        password: trimmedData.password,
        recaptchaToken: token,
      }).unwrap();

      if (!signupResult.success) {
        setError('root', {
          type: 'manual',
          message: signupResult.error?.message || 'Sign up failed unexpectedly. Please try again.',
        });
        return;
      }

      // If signup succeeds, attempt login
      const loginToken = await executeRecaptcha('login');
      const loginResult = await login({
        username: trimmedData.username,
        password: trimmedData.password,
        recaptchaToken: loginToken,
      }).unwrap();

      if (!loginResult.success) {
        setError('root', {
          type: 'manual',
          message: 'Sign up successful but login failed. Please try logging in manually.',
        });
        router.push('/login');
        return;
      }

      // If both succeed, redirect to home with new user parameter
      if (loginResult.success && loginResult.data?.userId) {
        router.push('/?new=true');
      }
    } catch (error: any) {
      const errorData = error.data as ApiResponse<SignUpData | LoginData>;
      let message = errorData?.error?.message || 'There was a problem trying to sign up. Please try again in a moment.';

      setError('root', {
        type: 'manual',
        message,
      });
    }
  };

  return (
    <CenteredContainer>
      <SignUpWrapper>
        <SignUpIcon data-testid="signup-icon" title="It's free! :D">
          <SentimentVerySatisfied />
        </SignUpIcon>
        <Typography component="h1" variant="h5" data-testid="signup-title">
          Sign Up
        </Typography>
        <SignUpForm noValidate onSubmit={handleSubmit(onSubmit)} data-testid="signup-form">
          <TextField
            {...register('username', { required: 'Username is required' })}
            label="Username"
            type="text"
            variant="outlined"
            margin="normal"
            required
            fullWidth
            autoComplete="username"
            autoFocus
            error={Boolean(errors.username)}
            helperText={errors.username?.message}
            slotProps={{
              htmlInput: {
                maxLength: 255,
                spellCheck: 'false',
                autoCapitalize: 'off',
                autoCorrect: 'off',
                'data-testid': 'username-input',
              },
            }}
          />

          <TextField
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Valid email is required',
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
                spellCheck: 'false',
                autoCapitalize: 'off',
                'data-testid': 'email-input',
              },
            }}
          />

          <TextField
            {...register('password', {
              required: 'Password is required',
              minLength: {
                value: 8,
                message: 'Password must be at least eight characters long',
              },
            })}
            label="Password"
            variant="outlined"
            margin="normal"
            required
            fullWidth
            autoComplete="new-password"
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

          <TextField
            {...register('passwordConfirmation', {
              required: 'Password confirmation is required',
              minLength: {
                value: 8,
                message: 'Password confirmation must be at least eight characters long',
              },
              validate: (value) => value === password || 'Passwords must match',
            })}
            label="Confirm Password"
            variant="outlined"
            margin="normal"
            required
            fullWidth
            autoComplete="new-password"
            type="password"
            error={Boolean(errors.passwordConfirmation)}
            helperText={errors.passwordConfirmation?.message}
            slotProps={{
              htmlInput: {
                maxLength: 255,
                'data-testid': 'password-confirmation-input',
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
              Sign Up
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
              Already have an account? Log In
            </Link>
          </Box>

          <Typography
            variant="caption"
            color="text.secondary"
            align="center"
            sx={{ mt: 2, mb: 1, display: 'block' }}
          >
            By signing up, you agree to our{' '}
            <Link href="/terms-and-privacy" data-testid="terms-privacy-link">
              Terms and Privacy
            </Link>
            .
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
            align="center"
            sx={{ display: 'block' }}
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
        </SignUpForm>
      </SignUpWrapper>
    </CenteredContainer>
  );
}

const SignUpWrapper = styled('div')(({ theme }) => ({
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: theme.spacing(3),
}));

const SignUpIcon = styled(Avatar)(({ theme }) => ({
  margin: theme.spacing(1),
  backgroundColor: theme.palette.primary.main,
}));

const SignUpForm = styled('form')(({ theme }) => ({
  width: '100%',
  marginTop: theme.spacing(1),
}));

const SubmitButtonWrapper = styled('div')(({ theme }) => ({
  margin: theme.spacing(3, 0, 2),
}));
