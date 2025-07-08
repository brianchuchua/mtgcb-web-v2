import { mtgcbApi } from '@/api/mtgcbApi';
import { ApiResponse } from '@/api/types/apiTypes';
import { RootState } from '@/redux/rootReducer';
import type {
  Location,
  LocationWithCount,
  LocationsResponse,
  CreateLocationRequest,
  UpdateLocationRequest,
  DeleteLocationResponse,
} from './types';

interface GetLocationsParams {
  includeCardCount?: boolean;
  limit?: number;
  offset?: number;
}

export const locationsApi = mtgcbApi.injectEndpoints({
  endpoints: (builder) => ({
    getLocations: builder.query<ApiResponse<LocationsResponse>, GetLocationsParams | void>({
      query: (params) => ({
        url: '/locations',
        params: params || {},
      }),
      providesTags: (result) =>
        result?.data?.locations
          ? [
              ...result.data.locations.map(({ id }) => ({ type: 'Location' as const, id })),
              { type: 'Location', id: 'LIST' },
            ]
          : [{ type: 'Location', id: 'LIST' }],
    }),

    getLocation: builder.query<ApiResponse<Location>, number>({
      query: (id) => `/locations/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Location', id }],
    }),

    createLocation: builder.mutation<ApiResponse<Location>, CreateLocationRequest>({
      query: (data) => ({
        url: '/locations',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Location', id: 'LIST' }],
    }),

    updateLocation: builder.mutation<ApiResponse<Location>, { id: number; data: UpdateLocationRequest }>({
      query: ({ id, data }) => ({
        url: `/locations/${id}`,
        method: 'PATCH',
        body: data,
      }),
      async onQueryStarted({ id }, { getState, dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data?.success) {
            const state = getState() as RootState;
            const userId = state.auth.user?.userId;
            const tags: any[] = [
              { type: 'Location', id },
              { type: 'Location', id: 'LIST' },
            ];
            // Also invalidate cards cache to update location names
            if (userId) {
              tags.push({ type: 'Cards', id: `user-${userId}` });
            }
            dispatch(mtgcbApi.util.invalidateTags(tags));
          }
        } catch {
          // Error is already handled by RTK Query
        }
      },
    }),

    deleteLocation: builder.mutation<ApiResponse<DeleteLocationResponse>, number>({
      query: (id) => ({
        url: `/locations/${id}`,
        method: 'DELETE',
      }),
      async onQueryStarted(id, { getState, dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data?.success) {
            const state = getState() as RootState;
            const userId = state.auth.user?.userId;
            const tags: any[] = [
              { type: 'Location', id },
              { type: 'Location', id: 'LIST' },
            ];
            // Also invalidate cards cache to remove deleted location from cards
            if (userId) {
              tags.push({ type: 'Cards', id: `user-${userId}` });
            }
            dispatch(mtgcbApi.util.invalidateTags(tags));
          }
        } catch {
          // Error is already handled by RTK Query
        }
      },
    }),
  }),
});

export const {
  useGetLocationsQuery,
  useGetLocationQuery,
  useCreateLocationMutation,
  useUpdateLocationMutation,
  useDeleteLocationMutation,
} = locationsApi;