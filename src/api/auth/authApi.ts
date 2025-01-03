import { LoginData, LoginRequest, UserData } from '@/api/auth/types';
import { mtgcbApi } from '@/api/mtgcbApi';
import { ApiResponse } from '@/api/types/apiTypes';

export const authApi = mtgcbApi.injectEndpoints({
  endpoints: (builder) => ({
    me: builder.query<ApiResponse<UserData>, void>({
      query: () => 'auth/me',
    }),
    login: builder.mutation<ApiResponse<LoginData>, LoginRequest>({
      query: (credentials) => ({
        url: 'auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
  }),
  overrideExisting: false,
});

export type { LoginData, UserData };
export const { useMeQuery, useLoginMutation } = authApi;
