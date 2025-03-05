import { ApiResponse } from '@/api/types/apiTypes';
import { mtgcbApi } from '@/api/mtgcbApi';
import { CardApiParams, CardSearchData } from './types';

export const browseApi = mtgcbApi.injectEndpoints({
  endpoints: (builder) => ({
    searchCards: builder.mutation<ApiResponse<CardSearchData>, CardApiParams>({
      query: (body) => ({
        url: '/cards/search',
        method: 'POST',
        body,
      }),
      invalidatesTags: (result) => result?.success ? ['Cards'] : [],
    }),
  }),
  overrideExisting: false,
});

export const { useSearchCardsMutation } = browseApi;