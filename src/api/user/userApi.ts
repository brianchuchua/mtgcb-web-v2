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
  draftCubeVariant?: 'standard' | 'two-uncommon';
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
        const tags: Array<'Auth' | 'PatreonSupporters' | 'CostToComplete' | { type: 'Sets'; id: string }> = ['Auth'];

        // If updating showAsPatreonSupporter or card selection, also invalidate the supporters list
        if (arg.showAsPatreonSupporter !== undefined || arg.patreonCardId !== undefined || arg.patreonCardColor !== undefined) {
          tags.push('PatreonSupporters');
        }

        // If updating draft cube variant, invalidate cost-to-complete cache and user's sets cache
        if (arg.draftCubeVariant !== undefined && result?.data?.userId) {
          tags.push('CostToComplete');
          tags.push({ type: 'Sets', id: `user-${result.data.userId}` });
        }

        return tags;
      },
    }),
  }),
});

export const { useUpdateUserMutation } = userApi;
