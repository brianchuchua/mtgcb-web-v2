import { CardApiParams, CardSearchData, SetApiParams } from './types';
import { mtgcbApi } from '@/api/mtgcbApi';
import { ApiResponse } from '@/api/types/apiTypes';
import { SetsSearchResult } from '@/types/sets';

export const browseApi = mtgcbApi.injectEndpoints({
  endpoints: (builder) => ({
    // TODO: Switch usage of this to getCards
    searchCards: builder.mutation<ApiResponse<CardSearchData>, CardApiParams>({
      query: (body) => ({
        url: '/cards/search',
        method: 'POST',
        body,
      }),
      invalidatesTags: (result) => (result?.success ? ['Cards'] : []),
    }),

    getCards: builder.query<ApiResponse<CardSearchData>, CardApiParams>({
      query: (params) => ({
        url: '/cards/search',
        method: 'POST',
        body: params,
      }),
      serializeQueryArgs: ({ queryArgs }) => {
        if (!queryArgs) return '';

        const { limit = 24, offset = 0, sortBy, sortDirection = 'asc', ...rest } = queryArgs;
        const paginationKey = `limit=${limit}&offset=${offset}`;
        const sortKey = sortBy ? `&sort=${sortBy}:${sortDirection}` : '';
        const filterKey = JSON.stringify(rest);

        return `${paginationKey}${sortKey}${filterKey}`;
      },
      keepUnusedDataFor: 300, // 5 minutes
      providesTags: ['Cards'],
    }),

    getSets: builder.query<ApiResponse<SetsSearchResult>, SetApiParams>({
      query: (params) => ({
        url: '/sets/search',
        method: 'POST',
        body: params,
      }),
      serializeQueryArgs: ({ queryArgs }) => {
        if (!queryArgs) return '';

        const { limit = 24, offset = 0, sortBy, sortDirection = 'asc', ...rest } = queryArgs;
        const paginationKey = `limit=${limit}&offset=${offset}`;
        const sortKey = sortBy ? `&sort=${sortBy}:${sortDirection}` : '';
        const filterKey = JSON.stringify(rest);

        return `${paginationKey}${sortKey}${filterKey}`;
      },
      keepUnusedDataFor: 300, // 5 minutes
      providesTags: ['Sets'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useSearchCardsMutation,
  useGetCardsQuery,
  useGetSetsQuery,
  usePrefetch: useGetCardsPrefetch,
  endpoints,
} = browseApi;

/**
 * Utility to get the next page API params based on current params
 * @param currentParams Current API params
 * @param currentPage Current page number (1-based)
 * @param pageSize Items per page
 */
export const getNextPageParams = (
  currentParams: CardApiParams | SetApiParams,
  currentPage: number,
  pageSize: number,
): CardApiParams | SetApiParams => {
  return {
    ...currentParams,
    offset: currentPage * pageSize, // Calculate next page offset
  };
};
