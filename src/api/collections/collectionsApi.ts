import {
  CollectionCardsParams,
  CollectionCardsResponse,
  CollectionMassUpdateRequest,
  CollectionMassUpdateResponse,
  CollectionSummaryParams,
  CollectionSummaryResponse,
  CollectionUpdateRequest,
  CollectionUpdateResponse,
} from './types';
import {
  AssociateCardLocationRequest,
  UpdateCardLocationRequest,
  RemoveCardLocationRequest,
  CardLocationAssociation,
  CardLocationsResponse,
  LocationCardsResponse,
} from './collectionLocationsTypes';
import { mtgcbApi } from '@/api/mtgcbApi';
import { ApiResponse } from '@/api/types/apiTypes';
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
                    { type: 'Goals', id: `user-${userId}` },
                    'Goals',
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
        for (const cacheEntry of cardsCache as any[]) {
          const { endpointName, originalArgs } = cacheEntry;
          if (endpointName === 'getCards' && originalArgs) {
            const patchResult = (dispatch as any)(
              (mtgcbApi.util as any).updateQueryData('getCards', originalArgs, (draft: any) => {
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

        for (const cacheEntry of collectionCache as any[]) {
          const { endpointName, originalArgs } = cacheEntry;
          if (endpointName === 'getCollectionCards' && originalArgs) {
            const patchResult = (dispatch as any)(
              (mtgcbApi.util as any).updateQueryData('getCollectionCards', originalArgs, (draft: any) => {
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
                { type: 'Goals', id: `user-${userId}` },
                'Goals',
              ]),
            );
          }
        } catch (error) {
          // On error, revert all optimistic updates
          patchResults.forEach((patchResult) => patchResult.undo());
        }
      },
    }),
    massUpdateCollection: builder.mutation<CollectionMassUpdateResponse, CollectionMassUpdateRequest>({
      query: (body) => ({
        url: '/collection/mass-update',
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
              dispatch(
                mtgcbApi.util.invalidateTags([
                  'Collection',
                  { type: 'Cards', id: `user-${userId}` },
                  { type: 'Sets', id: `user-${userId}` },
                  { type: 'Goals', id: `user-${userId}` },
                  'Goals',
                ]),
              );
            } else {
              dispatch(mtgcbApi.util.invalidateTags(['Collection']));
            }
          }
        } catch {
          // Error is already handled by RTK Query
        }
      },
    }),
    
    // Collection-Location endpoints
    associateCardLocation: builder.mutation<ApiResponse<CardLocationAssociation>, AssociateCardLocationRequest>({
      query: (body) => ({
        url: '/collection/locations',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        'Collection',
        'Location',
        { type: 'Cards', id: arg.cardId },
      ],
    }),
    
    updateCardLocation: builder.mutation<ApiResponse<CardLocationAssociation>, UpdateCardLocationRequest>({
      query: (body) => ({
        url: '/collection/locations',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        'Collection',
        'Location',
        { type: 'Cards', id: arg.cardId },
      ],
    }),
    
    removeCardLocation: builder.mutation<ApiResponse<{ success: true }>, RemoveCardLocationRequest>({
      query: (body) => ({
        url: '/collection/locations',
        method: 'DELETE',
        body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        'Collection',
        'Location',
        { type: 'Cards', id: arg.cardId },
      ],
    }),
    
    getCardLocations: builder.query<ApiResponse<CardLocationsResponse>, number>({
      query: (cardId) => `/collection/cards/${cardId}/locations`,
      providesTags: (_result, _error, cardId) => [{ type: 'Cards', id: cardId }],
    }),
    
    getLocationCards: builder.query<ApiResponse<LocationCardsResponse>, { locationId: number; sortBy?: string; sortOrder?: string }>({
      query: ({ locationId, sortBy, sortOrder }) => ({
        url: `/locations/${locationId}/cards`,
        params: {
          ...(sortBy && { sortBy }),
          ...(sortOrder && { sortOrder }),
        },
      }),
      providesTags: (_result, _error, { locationId }) => [{ type: 'Location', id: locationId }],
    }),
  }),
});

export const {
  useGetCollectionSummaryQuery,
  useGetCollectionCardsQuery,
  useLazyGetCollectionCardsQuery,
  useUpdateCollectionMutation,
  useMassUpdateCollectionMutation,
  useAssociateCardLocationMutation,
  useUpdateCardLocationMutation,
  useRemoveCardLocationMutation,
  useGetCardLocationsQuery,
  useLazyGetCardLocationsQuery,
  useGetLocationCardsQuery,
} = collectionsApi;
export const { endpoints: collectionsEndpoints } = collectionsApi;
