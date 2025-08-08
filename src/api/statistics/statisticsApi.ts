import { mtgcbApi } from '@/api/mtgcbApi';
import { PlatformStatisticsResponse } from './types';

export const statisticsApi = mtgcbApi.injectEndpoints({
  endpoints: (builder) => ({
    getPlatformStatistics: builder.query<PlatformStatisticsResponse, void>({
      query: () => ({
        url: '/statistics/platform',
        method: 'GET',
      }),
    }),
  }),
});

export const { useGetPlatformStatisticsQuery } = statisticsApi;