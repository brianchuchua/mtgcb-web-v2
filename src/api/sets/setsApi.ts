import { CostToCompleteParams, CostToCompleteResponse } from './types';
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

        const { priceType } = queryArgs;
        const baseKey = `priceType=${priceType}`;

        return `${baseKey}`;
      },
      keepUnusedDataFor: 300,
    }),
  }),
  overrideExisting: false,
});

export const { useGetCostToCompleteQuery } = setsApi;
