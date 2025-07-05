import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const verifyEnvironmentVariables = () => {
  if (!process.env.NEXT_PUBLIC_MTGCB_API_BASE_URL) {
    throw new Error('NEXT_PUBLIC_MTGCB_API_BASE_URL environment variable is not defined');
  }
};
verifyEnvironmentVariables();

export const mtgcbApi = createApi({
  reducerPath: 'mtgcbApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_MTGCB_API_BASE_URL,
    credentials: 'include',
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Auth', 'Cards', 'Sets', 'SetTypes', 'CostToComplete', 'Collection', 'Goals', 'Location'],
  endpoints: () => ({}),
});

export default mtgcbApi;
