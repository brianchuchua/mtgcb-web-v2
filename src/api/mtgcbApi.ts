import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const mtgcbApi = createApi({
  reducerPath: 'mtgcbApi',
  baseQuery: fetchBaseQuery({ baseUrl: process.env.MTGCB_API_BASE_URL }),
  endpoints: () => ({}), // These are injected by the endpoint definitions
});

export default mtgcbApi;
