import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { appendShareToken, getShareTokenFromWindow } from '@/api/utils/shareTokenUtils';

export const verifyEnvironmentVariables = () => {
  if (!process.env.NEXT_PUBLIC_MTGCB_API_BASE_URL) {
    throw new Error('NEXT_PUBLIC_MTGCB_API_BASE_URL environment variable is not defined');
  }
};
verifyEnvironmentVariables();

export const mtgcbApi = createApi({
  reducerPath: 'mtgcbApi',
  baseQuery: async (args, api, extraOptions) => {
    const shareToken = getShareTokenFromWindow();
    
    // Modify the URL to include share token if present
    let modifiedArgs = args;
    if (typeof args === 'string') {
      modifiedArgs = appendShareToken(args, shareToken);
    } else if (args && typeof args === 'object') {
      modifiedArgs = {
        ...args,
        url: appendShareToken(args.url || '', shareToken),
      };
    }
    
    // Use the default fetchBaseQuery with our modifications
    const baseQuery = fetchBaseQuery({
      baseUrl: process.env.NEXT_PUBLIC_MTGCB_API_BASE_URL,
      credentials: 'include',
      prepareHeaders: (headers) => {
        headers.set('Content-Type', 'application/json');
        return headers;
      },
    });
    
    return baseQuery(modifiedArgs, api, extraOptions);
  },
  tagTypes: ['Auth', 'Cards', 'Sets', 'SetTypes', 'CostToComplete', 'Collection', 'Goals', 'Location', 'ShareLink'],
  endpoints: () => ({}),
});

export default mtgcbApi;
