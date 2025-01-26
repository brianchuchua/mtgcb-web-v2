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
        url: `${process.env.NEXT_PUBLIC_LOCAL_API_BASE_URL}/api/auth/register`,
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
        url: `${process.env.NEXT_PUBLIC_LOCAL_API_BASE_URL}/api/auth/forgot-password`,
        method: 'POST',
        body: data,
      }),
    }),
    forgotUsername: builder.mutation<ApiResponse<void>, ForgotUsernameRequest>({
      query: (data) => ({
        url: `${process.env.NEXT_PUBLIC_LOCAL_API_BASE_URL}/api/auth/forgot-username`,
        method: 'POST',
        body: data,
      }),
    }),
    resetPassword: builder.mutation<ApiResponse<void>, Omit<ResetPasswordRequest, 'privateKey'>>({
      query: (data) => ({
        url: `${process.env.NEXT_PUBLIC_LOCAL_API_BASE_URL}/api/auth/reset-password`,
        method: 'POST',
        body: data,
      }),
    }),
    validatePasswordReset: builder.mutation<
      ApiResponse<void>,
      Omit<ValidatePasswordResetRequest, 'privateKey'>
    >({
      query: (data) => ({
        url: `${process.env.NEXT_PUBLIC_LOCAL_API_BASE_URL}/api/auth/validate-password-reset`,
        method: 'POST',
        body: data,
      }),
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
} = authApi;
