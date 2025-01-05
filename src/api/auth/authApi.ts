import { LoginData, LoginRequest, SignUpData, SignUpRequest, UserData } from '@/api/auth/types';
import { mtgcbApi } from '@/api/mtgcbApi';
import { ApiResponse } from '@/api/types/apiTypes';

export const authApi = mtgcbApi.injectEndpoints({
  endpoints: (builder) => ({
    me: builder.query<ApiResponse<UserData>, void>({
      query: () => 'auth/me', // TODO: Grok how often this is called and reduce if necessary, should just be onload and login stuff
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
  }),
  overrideExisting: false,
});

export type { LoginData, SignUpData, UserData };
export const { useMeQuery, useLoginMutation, useSignUpMutation, useLogoutMutation } = authApi;