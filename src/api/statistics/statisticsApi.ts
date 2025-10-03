import { mtgcbApi } from '@/api/mtgcbApi';
import { HomeStatisticsResponse, PlatformStatisticsResponse, PriceType } from './types';

export const statisticsApi = mtgcbApi.injectEndpoints({
  endpoints: (builder) => ({
    getPlatformStatistics: builder.query<PlatformStatisticsResponse, void>({
      query: () => ({
        url: '/statistics/platform',
        method: 'GET',
      }),
    }),
    getHomeStatistics: builder.query<HomeStatisticsResponse, { priceType: PriceType }>({
      query: ({ priceType }) => ({
        url: '/home/statistics',
        method: 'GET',
        params: { priceType },
      }),
      // Note: This endpoint is computationally heavy, so we cache for 1 hour
      // and don't invalidate on collection changes. Users can manually refresh
      // the page to get updated statistics after making collection changes.
      keepUnusedDataFor: 3600, // 1 hour
      providesTags: ['Statistics'],
    }),
  }),
});

export const { useGetPlatformStatisticsQuery, useGetHomeStatisticsQuery } = statisticsApi;