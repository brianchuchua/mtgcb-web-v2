import { mtgcbApi } from '@/api/mtgcbApi';
import { ApiResponse } from '@/api/types/apiTypes';
import { Goal, CreateGoalRequest, GetGoalsResponse, UpdateGoalRequest } from './types';

export const goalsApi = mtgcbApi.injectEndpoints({
  endpoints: (builder) => ({
    createGoal: builder.mutation<ApiResponse<Goal>, CreateGoalRequest>({
      query: (body) => ({
        url: 'goals',
        method: 'POST',
        body,
      }),
      invalidatesTags: (result) => {
        if (result?.success && result?.data?.userId) {
          return [
            'Goals',
            // Invalidate browse caches since new goal affects browse results
            { type: 'Cards', id: `user-${result.data.userId}` },
            { type: 'Sets', id: `user-${result.data.userId}` },
            'Cards',
            'Sets',
          ];
        }
        return ['Goals'];
      },
    }),
    getUserGoals: builder.query<ApiResponse<GetGoalsResponse>, number>({
      query: (userId) => `goals/${userId}`,
      providesTags: (result, error, userId) => [
        { type: 'Goals', id: `USER-${userId}` },
        'Goals',
      ],
    }),
    getGoal: builder.query<ApiResponse<Goal>, { userId: number; goalId: number }>({
      query: ({ userId, goalId }) => `goals/${userId}/${goalId}`,
      providesTags: (result, error, { goalId }) => [
        { type: 'Goals', id: goalId },
      ],
    }),
    deleteGoal: builder.mutation<ApiResponse<{ message: string }>, { userId: number; goalId: number }>({
      query: ({ userId, goalId }) => ({
        url: `goals/${userId}/${goalId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { userId, goalId }) => [
        { type: 'Goals', id: `USER-${userId}` },
        { type: 'Goals', id: goalId },
        'Goals',
        // Invalidate browse caches since goal deletion affects browse results
        { type: 'Cards', id: `user-${userId}` },
        { type: 'Sets', id: `user-${userId}` },
        'Cards',
        'Sets',
      ],
    }),
    updateGoal: builder.mutation<ApiResponse<Goal>, { userId: number; goalId: number; body: UpdateGoalRequest }>({
      query: ({ userId, goalId, body }) => ({
        url: `goals/${userId}/${goalId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { userId, goalId }) => [
        { type: 'Goals', id: `USER-${userId}` },
        { type: 'Goals', id: goalId },
        'Goals',
        // Invalidate browse caches since goal changes affect browse results
        { type: 'Cards', id: `user-${userId}` },
        { type: 'Sets', id: `user-${userId}` },
        'Cards',
        'Sets',
      ],
    }),
  }),
});

export const {
  useCreateGoalMutation,
  useGetUserGoalsQuery,
  useGetGoalQuery,
  useDeleteGoalMutation,
  useUpdateGoalMutation,
} = goalsApi;