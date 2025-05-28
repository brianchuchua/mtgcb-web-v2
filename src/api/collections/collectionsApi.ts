import { mtgcbApi } from '@/api/mtgcbApi';
import type { RootState } from '@/redux/store';
import {
  CollectionSummaryParams,
  CollectionSummaryResponse,
  CollectionCardsParams,
  CollectionCardsResponse,
  CollectionUpdateRequest,
  CollectionUpdateResponse,
} from './types';

const collectionsApi = mtgcbApi.injectEndpoints({
  endpoints: (builder) => ({
    getCollectionSummary: builder.query<
      CollectionSummaryResponse,
      CollectionSummaryParams
    >({
      query: (params) => ({
        url: '/collection/summary',
        method: 'POST',
        body: params,
      }),
      // Cache for 5 minutes
      keepUnusedDataFor: 300,
      providesTags: ['Collection'],
    }),
    getCollectionCards: builder.query<
      CollectionCardsResponse,
      CollectionCardsParams
    >({
      query: (params) => ({
        url: '/collection/cards',
        method: 'POST',
        body: params,
      }),
      // Cache for 5 minutes
      keepUnusedDataFor: 300,
      providesTags: ['Collection'],
    }),
    updateCollection: builder.mutation<
      CollectionUpdateResponse,
      CollectionUpdateRequest
    >({
      query: (body) => ({
        url: '/collection/update',
        method: 'POST',
        body,
      }),
      async onQueryStarted(arg, { getState, dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data?.success) {
            const state = getState() as RootState;
            const userId = state.auth.user?.userId;
            
            if (userId) {
              // Invalidate user-specific cached data
              dispatch(
                mtgcbApi.util.invalidateTags([
                  'Collection',
                  { type: 'Cards', id: `user-${userId}` },
                  { type: 'Sets', id: `user-${userId}` },
                ])
              );
            } else {
              // Fallback: just invalidate collection if no userId
              dispatch(mtgcbApi.util.invalidateTags(['Collection']));
            }
          }
        } catch {
          // Error is already handled by RTK Query
        }
      },
    }),
  }),
});

export const { 
  useGetCollectionSummaryQuery,
  useGetCollectionCardsQuery,
  useLazyGetCollectionCardsQuery,
  useUpdateCollectionMutation,
} = collectionsApi;
export const { endpoints: collectionsEndpoints } = collectionsApi;