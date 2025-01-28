import { CardTypes } from '@/api/cards/types';
import { mtgcbApi } from '@/api/mtgcbApi';

export const browseApi = mtgcbApi.injectEndpoints({
  endpoints: (builder) => ({
    getCardTypes: builder.query<CardTypes, void>({
      query: () => '/cards/types',
      transformResponse: (response: { success: boolean; data: CardTypes }) => response.data,
    }),
  }),
  overrideExisting: false,
});

export const { useGetCardTypesQuery } = browseApi;
