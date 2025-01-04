'use client';

import { LockOutlined } from '@mui/icons-material';
import { Avatar, Box, FormHelperText, TextField, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { LoginData, useLoginMutation } from '@/api/auth/authApi';
import { ApiResponse } from '@/api/types/apiTypes';
import CenteredContainer from '@/components/layout/CenteredContainer';
import { Button } from '@/components/ui/button';
import { Link } from '@/components/ui/link';
import { useAuth } from '@/hooks/useAuth';

// TODO: Add Captcha
// TODO: Implement account page, guard with withAuth
interface LoginFormInputs {
  username: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [login] = useLoginMutation();
  const { isAuthenticated, user, isLoading } = useAuth();

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
      const result = await login(data).unwrap();

      if (result.success && result.data?.userId) {
        router.push(`/collections/${result.data.userId}`);
      } else if (!result.success) {
        // This would only happen if the API returns a 200 status code with a failure case
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
        <LoginIcon>
          <LockOutlined />
        </LoginIcon>
        <Typography component="h1" variant="h5">
          Log In
        </Typography>
        <LoginForm noValidate onSubmit={handleSubmit(onSubmit)}>
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
              Log In
            </Button>
          </SubmitButtonWrapper>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
            }}
          >
            <Box>
              <Link href="#" variant="body2">
                Forgot password?
                <br />
                (In Progress)
              </Link>
            </Box>
            <Box>
              <Link href="/signup" variant="body2">
                {"Don't have an account? Sign Up"}
              </Link>
            </Box>
          </Box>
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
