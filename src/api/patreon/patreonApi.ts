import { mtgcbApi } from '@/api/mtgcbApi';
import { ApiResponse } from '@/api/types/apiTypes';
import { PatreonDisconnectData, PatreonStatusData, PatreonSupporter } from './types';

export const patreonApi = mtgcbApi.injectEndpoints({
  endpoints: (builder) => ({
    getPatreonStatus: builder.query<ApiResponse<PatreonStatusData>, void>({
      query: () => 'patreon/status',
      providesTags: ['Patreon'],
    }),
    getPatreonSupporters: builder.query<ApiResponse<PatreonSupporter[]>, void>({
      query: () => 'patreon/supporters',
      providesTags: ['PatreonSupporters'],
    }),
    disconnectPatreon: builder.mutation<ApiResponse<PatreonDisconnectData>, void>({
      query: () => ({
        url: 'patreon/disconnect',
        method: 'DELETE',
      }),
      invalidatesTags: ['Patreon', 'Auth'],
    }),
  }),
  overrideExisting: false,
});

export const { useGetPatreonStatusQuery, useGetPatreonSupportersQuery, useDisconnectPatreonMutation } = patreonApi;
