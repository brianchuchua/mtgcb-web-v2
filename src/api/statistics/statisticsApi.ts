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
      providesTags: ['Collection'],
    }),
  }),
});

export const { useGetPlatformStatisticsQuery, useGetHomeStatisticsQuery } = statisticsApi;