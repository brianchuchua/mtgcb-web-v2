import { CostToCompleteParams, CostToCompleteResponse, AllSetsResponse } from './types';
import { mtgcbApi } from '@/api/mtgcbApi';
import { ApiResponse } from '@/api/types/apiTypes';

export const setsApi = mtgcbApi.injectEndpoints({
  endpoints: (builder) => ({
    getCostToComplete: builder.query<ApiResponse<CostToCompleteResponse>, CostToCompleteParams>({
      query: (params) => ({
        url: '/sets/cost-to-complete',
        method: 'GET',
        params,
      }),
      serializeQueryArgs: ({ queryArgs }) => {
        if (!queryArgs) return '';

        const { priceType, includeSubsetsInSets, variant } = queryArgs;
        let baseKey = `priceType=${priceType}`;

        if (includeSubsetsInSets !== undefined) {
          baseKey += `,includeSubsetsInSets=${includeSubsetsInSets}`;
        }

        if (variant !== undefined) {
          baseKey += `,variant=${variant}`;
        }

        return baseKey;
      },
      providesTags: ['CostToComplete'],
      keepUnusedDataFor: 300,
    }),
    getAllSets: builder.query<ApiResponse<AllSetsResponse>, void>({
      query: () => ({
        url: '/sets/all',
        method: 'GET',
      }),
      keepUnusedDataFor: 3600, // Cache for 1 hour since sets don't change often
    }),
  }),
  overrideExisting: false,
});

export const { useGetCostToCompleteQuery, useGetAllSetsQuery } = setsApi;
