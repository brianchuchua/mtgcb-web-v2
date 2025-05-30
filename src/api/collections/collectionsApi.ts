import {
  CollectionCardsParams,
  CollectionCardsResponse,
  CollectionSummaryParams,
  CollectionSummaryResponse,
  CollectionUpdateRequest,
  CollectionUpdateResponse,
} from './types';
import { mtgcbApi } from '@/api/mtgcbApi';
import type { RootState } from '@/redux/store';

const collectionsApi = mtgcbApi.injectEndpoints({
  endpoints: (builder) => ({
    getCollectionSummary: builder.query<CollectionSummaryResponse, CollectionSummaryParams>({
      query: (params) => ({
        url: '/collection/summary',
        method: 'POST',
        body: params,
      }),
      // Cache for 5 minutes
      keepUnusedDataFor: 300,
      providesTags: ['Collection'],
    }),
    getCollectionCards: builder.query<CollectionCardsResponse, CollectionCardsParams>({
      query: (params) => ({
        url: '/collection/cards',
        method: 'POST',
        body: params,
      }),
      // Cache for 5 minutes
      keepUnusedDataFor: 300,
      providesTags: ['Collection'],
    }),
    updateCollection: builder.mutation<CollectionUpdateResponse, CollectionUpdateRequest>({
      query: (body) => ({
        url: '/collection/update',
        method: 'POST',
        body,
      }),
      async onQueryStarted(arg, { getState, dispatch, queryFulfilled }) {
        const state = getState() as RootState;
        const userId = state.auth.user?.userId;

        if (!userId || arg.mode !== 'set') {
          // For non-set operations or when no user, just wait for the response
          try {
            const { data } = await queryFulfilled;
            if (data?.success) {
              if (userId) {
                dispatch(
                  mtgcbApi.util.invalidateTags([
                    'Collection',
                    { type: 'Cards', id: `user-${userId}` },
                    { type: 'Sets', id: `user-${userId}` },
                  ]),
                );
              } else {
                dispatch(mtgcbApi.util.invalidateTags(['Collection']));
              }
            }
          } catch {
            // Error is already handled by RTK Query
          }
          return;
        }

        // Optimistically update the cache for 'set' mode
        const patchResults: any[] = [];

        // Update getCards cache entries
        const cardsCache = mtgcbApi.util.selectInvalidatedBy(state, [{ type: 'Cards', id: `user-${userId}` }]);

        // TODO: Type issue mess. Not even sure if this is necessary anymore, need to test.
        for (const { endpointName, originalArgs } of cardsCache) {
          if (endpointName === 'getCards' && originalArgs) {
            const patchResult = dispatch(
              mtgcbApi.util.updateQueryData('getCards', originalArgs, (draft) => {
                if (draft?.data?.cards) {
                  // Update quantities for matching cards
                  for (const updateCard of arg.cards) {
                    const cardIndex = draft.data.cards.findIndex((card: any) => card.id === updateCard.cardId);
                    if (cardIndex !== -1) {
                      draft.data.cards[cardIndex].quantityReg = updateCard.quantityReg;
                      draft.data.cards[cardIndex].quantityFoil = updateCard.quantityFoil;
                    }
                  }
                }
              }),
            );
            patchResults.push(patchResult);
          }
        }

        // Update getCollectionCards cache entries
        const collectionCache = mtgcbApi.util.selectInvalidatedBy(state, ['Collection']);

        for (const { endpointName, originalArgs } of collectionCache) {
          if (endpointName === 'getCollectionCards' && originalArgs) {
            const patchResult = dispatch(
              mtgcbApi.util.updateQueryData('getCollectionCards', originalArgs, (draft) => {
                if (draft?.data?.cards) {
                  // Update quantities for matching cards
                  for (const updateCard of arg.cards) {
                    const cardIndex = draft.data.cards.findIndex((card: any) => card.id === updateCard.cardId);
                    if (cardIndex !== -1) {
                      draft.data.cards[cardIndex].quantityReg = updateCard.quantityReg;
                      draft.data.cards[cardIndex].quantityFoil = updateCard.quantityFoil;
                    }
                  }
                }
              }),
            );
            patchResults.push(patchResult);
          }
        }

        try {
          const { data } = await queryFulfilled;

          if (data?.success) {
            // Invalidate cache to ensure fresh data is fetched
            dispatch(
              mtgcbApi.util.invalidateTags([
                'Collection',
                { type: 'Cards', id: `user-${userId}` },
                { type: 'Sets', id: `user-${userId}` },
              ]),
            );
          }
        } catch (error) {
          // On error, revert all optimistic updates
          patchResults.forEach((patchResult) => patchResult.undo());
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
