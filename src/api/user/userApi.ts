import { mtgcbApi } from '@/api/mtgcbApi';
import { ApiResponse } from '@/api/types/apiTypes';

interface UpdateUserData {
  userId: number;
}

interface UpdateUserRequest {
  username?: string;
  email?: string;
  password?: string;
  currentPassword?: string;
  isPublic?: boolean;
}

export const userApi = mtgcbApi.injectEndpoints({
  endpoints: (builder) => ({
    updateUser: builder.mutation<ApiResponse<UpdateUserData>, UpdateUserRequest>({
      query: (data) => ({
        url: '/user',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Auth'],
    }),
  }),
});

export const { useUpdateUserMutation } = userApi;
