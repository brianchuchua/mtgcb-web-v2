import { CardApiParams, CardSearchData, SetApiParams } from './types';
import { mtgcbApi } from '@/api/mtgcbApi';
import { ApiResponse } from '@/api/types/apiTypes';
import { SetsSearchResult } from '@/types/sets';
import { store } from '@/redux/storeProvider';
import { setCompilationState } from '@/redux/slices/compilationSlice';

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
      async onQueryStarted(arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          // Check if compilation is in progress
          if (data?.data?.compilationInProgress) {
            store.dispatch(setCompilationState({
              isCompiling: true,
              message: data.data.message || 'Your collection goal is being updated...',
              goalId: arg.goalId || null,
            }));
          } else if (arg.goalId && store.getState().compilation.isCompiling) {
            // Compilation completed for this goal
            store.dispatch(setCompilationState({
              isCompiling: false,
              message: null,
              goalId: null,
            }));
          }
        } catch (error) {
          // Error handling if needed
        }
      },
    }),

    getSets: builder.query<ApiResponse<SetsSearchResult>, SetApiParams>({
      query: (params) => ({
        url: '/sets/search',
        method: 'POST',
        body: params,
      }),
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
      async onQueryStarted(arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          // Check if compilation is in progress
          if (data?.data?.compilationInProgress) {
            store.dispatch(setCompilationState({
              isCompiling: true,
              message: data.data.message || 'Your collection goal is being updated...',
              goalId: arg.goalId || null,
            }));
          } else if (arg.goalId && store.getState().compilation.isCompiling) {
            // Compilation completed for this goal
            store.dispatch(setCompilationState({
              isCompiling: false,
              message: null,
              goalId: null,
            }));
          }
        } catch (error) {
          // Error handling if needed
        }
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
  usePrefetch, // TODO: Rename -- this can get cards or sets
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
