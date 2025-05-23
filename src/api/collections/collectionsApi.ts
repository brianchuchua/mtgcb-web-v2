import { mtgcbApi } from '@/api/mtgcbApi';
import {
  CollectionSummaryParams,
  CollectionSummaryResponse,
  CollectionCardsParams,
  CollectionCardsResponse,
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
    }),
  }),
});

export const { 
  useGetCollectionSummaryQuery,
  useGetCollectionCardsQuery,
  useLazyGetCollectionCardsQuery,
} = collectionsApi;
export const { endpoints: collectionsEndpoints } = collectionsApi;