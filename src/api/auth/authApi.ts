import {
  ForgotPasswordRequest,
  ForgotUsernameRequest,
  LoginData,
  LoginRequest,
  ResetPasswordRequest,
  SignUpData,
  SignUpRequest,
  UserData,
  ValidatePasswordResetRequest,
} from '@/api/auth/types';
import { mtgcbApi } from '@/api/mtgcbApi';
import { ApiResponse } from '@/api/types/apiTypes';

// Helper to get the current origin for local API calls
const getLocalApiUrl = (path: string) => {
  // In the browser, use window.location.origin
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${path}`;
  }
  // During SSR, construct from environment or use relative path
  return path;
};

export const authApi = mtgcbApi.injectEndpoints({
  endpoints: (builder) => ({
    me: builder.query<ApiResponse<UserData>, void>({
      query: () => 'auth/me',
      providesTags: ['Auth'],
    }),
    login: builder.mutation<ApiResponse<LoginData>, LoginRequest>({
      query: (credentials) => ({
        url: 'auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['Auth'],
    }),
    signUp: builder.mutation<ApiResponse<SignUpData>, SignUpRequest>({
      query: (data) => ({
        url: getLocalApiUrl('/api/auth/register'),
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Auth'],
    }),
    logout: builder.mutation<ApiResponse<void>, void>({
      query: () => ({
        url: 'auth/logout',
        method: 'POST',
        body: {},
      }),
      invalidatesTags: ['Auth'],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(authApi.util.resetApiState());
        } catch {
          console.error('Logout failed or incomplete');
        }
      },
    }),
    forgotPassword: builder.mutation<ApiResponse<void>, ForgotPasswordRequest>({
      query: (data) => ({
        url: getLocalApiUrl('/api/auth/forgot-password'),
        method: 'POST',
        body: data,
      }),
    }),
    forgotUsername: builder.mutation<ApiResponse<void>, ForgotUsernameRequest>({
      query: (data) => ({
        url: getLocalApiUrl('/api/auth/forgot-username'),
        method: 'POST',
        body: data,
      }),
    }),
    resetPassword: builder.mutation<ApiResponse<void>, Omit<ResetPasswordRequest, 'privateKey'>>({
      query: (data) => ({
        url: getLocalApiUrl('/api/auth/reset-password'),
        method: 'POST',
        body: data,
      }),
    }),
    validatePasswordReset: builder.mutation<ApiResponse<void>, Omit<ValidatePasswordResetRequest, 'privateKey'>>({
      query: (data) => ({
        url: getLocalApiUrl('/api/auth/validate-password-reset'),
        method: 'POST',
        body: data,
      }),
    }),
    deleteAccount: builder.mutation<ApiResponse<{ message: string }>, void>({
      query: () => ({
        url: 'auth/account',
        method: 'DELETE',
      }),
      invalidatesTags: ['Auth'],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          // Reset the entire API state after successful account deletion
          dispatch(authApi.util.resetApiState());
        } catch {
          console.error('Account deletion failed');
        }
      },
    }),
  }),
  overrideExisting: false,
});

export type { LoginData, SignUpData, UserData };
export const {
  useMeQuery,
  useLoginMutation,
  useSignUpMutation,
  useLogoutMutation,
  useForgotPasswordMutation,
  useForgotUsernameMutation,
  useResetPasswordMutation,
  useValidatePasswordResetMutation,
  useDeleteAccountMutation,
} = authApi;
