import { mtgcbApi } from '@/api/mtgcbApi';
import { ApiResponse } from '@/api/types/apiTypes';
import type {
  Location,
  CreateLocationRequest,
  UpdateLocationRequest,
  DeleteLocationResponse,
} from './types';

export const locationsApi = mtgcbApi.injectEndpoints({
  endpoints: (builder) => ({
    getLocations: builder.query<ApiResponse<Location[]>, void>({
      query: () => '/locations',
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: 'Location' as const, id })),
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
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Location', id },
        { type: 'Location', id: 'LIST' },
      ],
    }),

    deleteLocation: builder.mutation<ApiResponse<DeleteLocationResponse>, number>({
      query: (id) => ({
        url: `/locations/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Location', id },
        { type: 'Location', id: 'LIST' },
      ],
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