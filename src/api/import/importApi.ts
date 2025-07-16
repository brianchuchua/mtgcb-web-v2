import { mtgcbApi } from '../mtgcbApi';
import type { RootState } from '@/redux/store';
import type { 
  ImportFormatsResponse, 
  ImportCollectionParams, 
  ImportCollectionQuery,
  ImportCollectionResponse 
} from './types';

const importApi = mtgcbApi.injectEndpoints({
  endpoints: (builder) => ({
    getImportFormats: builder.query<ImportFormatsResponse['data'], void>({
      query: () => ({
        url: '/collection/import/formats',
        method: 'GET',
      }),
      transformResponse: (response: ImportFormatsResponse) => response.data,
    }),
    importCollection: builder.mutation<ImportCollectionResponse, ImportCollectionParams & { query?: ImportCollectionQuery }>({
      query: ({ csvData, filename, query }) => {
        const queryParams = new URLSearchParams();
        
        if (query?.format) queryParams.append('format', query.format);
        if (query?.dryRun !== undefined) queryParams.append('dryRun', query.dryRun.toString());
        if (query?.updateMode) queryParams.append('updateMode', query.updateMode);

        const queryString = queryParams.toString();
        
        return {
          url: `/collection/import${queryString ? '?' + queryString : ''}`,
          method: 'POST',
          body: { csvData, filename },
        };
      },
      async onQueryStarted(arg, { getState, dispatch, queryFulfilled }) {
        try {
          const { data: result } = await queryFulfilled;
          // Only invalidate if the import was successful (fully or partially)
          if (result?.success || result?.data?.partialSuccess) {
            const state = getState() as RootState;
            const userId = state.auth?.user?.userId;
            
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
  }),
  overrideExisting: false,
});

export const {
  useGetImportFormatsQuery,
  useImportCollectionMutation,
} = importApi;