import { LoginData, LoginRequest, UserData } from '@/api/auth/types';
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

export type { LoginData, UserData };
export const { useMeQuery, useLoginMutation, useLogoutMutation } = authApi;
