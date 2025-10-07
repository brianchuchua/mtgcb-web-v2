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
  showAsPatreonSupporter?: boolean;
  patreonCardId?: string | null;
  patreonCardColor?: 'white' | 'blue' | 'black' | 'red' | 'green' | 'gold' | 'colorless' | null;
}

export const userApi = mtgcbApi.injectEndpoints({
  endpoints: (builder) => ({
    updateUser: builder.mutation<ApiResponse<UpdateUserData>, UpdateUserRequest>({
      query: (data) => ({
        url: '/user',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, arg) => {
        const tags: Array<'Auth' | 'PatreonSupporters'> = ['Auth'];
        // If updating showAsPatreonSupporter or card selection, also invalidate the supporters list
        if (arg.showAsPatreonSupporter !== undefined || arg.patreonCardId !== undefined || arg.patreonCardColor !== undefined) {
          tags.push('PatreonSupporters');
        }
        return tags;
      },
    }),
  }),
});

export const { useUpdateUserMutation } = userApi;
