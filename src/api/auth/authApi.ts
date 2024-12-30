import { mtgcbApi } from '@/api/mtgcbApi';

export const authApi = mtgcbApi.injectEndpoints({
  endpoints: (builder) => ({
    me: builder.query({
      query: () => 'auth/me',
    }),
  }),
  overrideExisting: false,
});

export const { useMeQuery } = authApi;
