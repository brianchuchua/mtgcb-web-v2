import { CardApiParams, CardSearchData, SetApiParams } from './types';
import { mtgcbApi } from '@/api/mtgcbApi';
import { ApiResponse } from '@/api/types/apiTypes';
import { Set, SetsSearchResult } from '@/types/sets';
import { filterCollectionParams } from '@/utils/collectionContextFilter';

export const browseApi = mtgcbApi.injectEndpoints({
  endpoints: (builder) => ({
    // TODO: Switch usage of this to getCards
    searchCards: builder.mutation<ApiResponse<CardSearchData>, CardApiParams>({
      query: (body) => {
        // Filter out collection-specific params if userId is not present (safety net)
        const safeBody = filterCollectionParams(body, Boolean(body.userId), 'cards');
        return {
          url: '/cards/search',
          method: 'POST',
          body: trimCardSearchParams(safeBody),
        };
      },
      invalidatesTags: (result) => (result?.success ? ['Cards'] : []),
    }),

    getCards: builder.query<ApiResponse<CardSearchData>, CardApiParams>({
      query: (params) => {
        // Filter out collection-specific params if userId is not present (safety net)
        const safeParams = filterCollectionParams(params, Boolean(params.userId), 'cards');
        return {
          url: '/cards/search',
          method: 'POST',
          body: trimCardSearchParams(safeParams),
        };
      },
      serializeQueryArgs: ({ queryArgs }) => {
        if (!queryArgs) return '';

        const { limit = 20, offset = 0, sortBy, sortDirection = 'asc', ...rest } = queryArgs;
        const paginationKey = `limit=${limit}&offset=${offset}`;
        const sortKey = sortBy ? `&sort=${sortBy}:${sortDirection}` : '';
        const filterKey = JSON.stringify(rest);

        return `${paginationKey}${sortKey}${filterKey}`;
      },
      keepUnusedDataFor: 300, // 5 minutes
      providesTags: (result, error, arg) => {
        const tags: Array<{ type: 'Cards'; id?: string }> = [{ type: 'Cards' }];
        if (arg.userId) {
          tags.push({ type: 'Cards', id: `user-${arg.userId}` });
        }
        return tags;
      },
    }),

    getSets: builder.query<ApiResponse<SetsSearchResult>, SetApiParams>({
      query: (params) => {
        // Filter out collection-specific params if userId is not present (safety net)
        const safeParams = filterCollectionParams(params, Boolean(params.userId), 'sets');
        return {
          url: '/sets/search',
          method: 'POST',
          body: trimSetSearchParams(safeParams),
        };
      },
      serializeQueryArgs: ({ queryArgs }) => {
        if (!queryArgs) return '';

        const { limit = 20, offset = 0, sortBy, sortDirection = 'asc', ...rest } = queryArgs;
        const paginationKey = `limit=${limit}&offset=${offset}`;
        const sortKey = sortBy ? `&sort=${sortBy}:${sortDirection}` : '';
        const filterKey = JSON.stringify(rest);

        return `${paginationKey}${sortKey}${filterKey}`;
      },
      keepUnusedDataFor: 300, // 5 minutes
      providesTags: (result, error, arg) => {
        const tags: Array<{ type: 'Sets'; id?: string }> = [{ type: 'Sets' }];
        if (arg.userId) {
          tags.push({ type: 'Sets', id: `user-${arg.userId}` });
        }
        return tags;
      },
    }),

    getSetTypes: builder.query<ApiResponse<{ label: string; value: string; category: string }[]>, void>({
      query: () => ({
        url: '/sets/types',
        method: 'GET',
      }),
      keepUnusedDataFor: 3600, // 1 hour
      providesTags: ['SetTypes'],
    }),

    getSetsNavigation: builder.query<
      ApiResponse<{
        sets: Array<{
          id: string;
          name: string;
          slug: string;
          releasedAt: string | null;
        }>;
        totalCount: number;
      }>,
      { sortBy?: 'releasedAt' | 'name'; sortDirection?: 'asc' | 'desc' } | undefined
    >({
      query: (params) => ({
        url: '/sets/navigation',
        method: 'GET',
        params: params || {},
      }),
      keepUnusedDataFor: 3600, // 1 hour - aggressive caching since sets rarely change
      providesTags: ['Sets'],
    }),

    getSetById: builder.query<ApiResponse<{ set: Set }>, string>({
      query: (id) => ({
        url: `/sets/${id}`,
        method: 'GET',
      }),
      keepUnusedDataFor: 3600, // 1 hour - aggressive caching since sets rarely change
      providesTags: (result, error, id) => [{ type: 'Sets', id }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useSearchCardsMutation,
  useGetCardsQuery,
  useLazyGetCardsQuery,
  useGetSetsQuery,
  useLazyGetSetsQuery,
  useGetSetTypesQuery,
  useGetSetsNavigationQuery,
  useGetSetByIdQuery,
  usePrefetch, // TODO: Rename -- this can get cards or sets
  endpoints,
} = browseApi;

const trimCardSearchParams = (params: CardApiParams): CardApiParams => ({
  ...params,
  ...(params.name && { name: params.name.trim() }),
  ...(params.oracleText && { oracleText: params.oracleText.trim() }),
  ...(params.artist && { artist: params.artist.trim() }),
});

const trimSetSearchParams = (params: SetApiParams): SetApiParams => ({
  ...params,
  ...(params.name && { name: params.name.trim() }),
  ...(params.code && { code: params.code.trim() }),
});

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
