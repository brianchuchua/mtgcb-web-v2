import { CardModel } from '@/api/browse/types';
import { CardLayouts, CardTreatments, CardTypes } from '@/api/cards/types';
import { mtgcbApi } from '@/api/mtgcbApi';

export const browseApi = mtgcbApi.injectEndpoints({
  endpoints: (builder) => ({
    getCardTypes: builder.query<CardTypes, void>({
      query: () => '/cards/types',
      transformResponse: (response: { success: boolean; data: CardTypes }) => response.data,
      keepUnusedDataFor: 3600, // 1 hour
    }),
    getCardLayouts: builder.query<CardLayouts, void>({
      query: () => '/cards/layouts',
      transformResponse: (response: { success: boolean; data: CardLayouts }) => response.data,
      keepUnusedDataFor: 86400, // 24 hours (matching backend cache)
    }),
    getCardTreatments: builder.query<CardTreatments, void>({
      query: () => '/cards/treatments',
      transformResponse: (response: { success: boolean; data: CardTreatments }) => response.data,
      keepUnusedDataFor: 86400, // 24 hours (matching backend cache)
    }),
    // Resolves already-known ids to card data, deprecated printings included. Search hides
    // deprecated cards, so this is the only way to label a saved reference to one (goal
    // include/exclude lists). Never use it to offer cards as new picks.
    getCardsByIds: builder.query<CardModel[], CardsByIdsRequest>({
      query: (body) => ({ url: '/cards/by-ids', method: 'POST', body }),
      transformResponse: (response: { success: boolean; data: { cards: CardModel[] } | null }) =>
        response.data?.cards ?? [],
      keepUnusedDataFor: 300, // 5 minutes
    }),
  }),
  overrideExisting: false,
});

export interface CardsByIdsRequest {
  ids: number[];
}

export const { useGetCardTypesQuery, useGetCardLayoutsQuery, useGetCardTreatmentsQuery, useLazyGetCardsByIdsQuery } =
  browseApi;
