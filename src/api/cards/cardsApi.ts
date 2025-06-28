import { CardTypes } from '@/api/cards/types';
import { mtgcbApi } from '@/api/mtgcbApi';

export const browseApi = mtgcbApi.injectEndpoints({
  endpoints: (builder) => ({
    getCardTypes: builder.query<CardTypes, void>({
      query: () => '/cards/types',
      transformResponse: (response: { success: boolean; data: CardTypes }) => response.data,
      keepUnusedDataFor: 3600, // 1 hour
    }),
  }),
  overrideExisting: false,
});

export const { useGetCardTypesQuery } = browseApi;
