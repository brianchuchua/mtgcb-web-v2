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
  }),
  overrideExisting: false,
});

export const { useGetCardTypesQuery, useGetCardLayoutsQuery, useGetCardTreatmentsQuery } = browseApi;
