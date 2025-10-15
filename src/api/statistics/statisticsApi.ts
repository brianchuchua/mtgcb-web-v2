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
      keepUnusedDataFor: 3600, // Cache for 1 hour when unmounted
      providesTags: ['Statistics'],
    }),
  }),
});

export const { useGetPlatformStatisticsQuery, useGetHomeStatisticsQuery } = statisticsApi;