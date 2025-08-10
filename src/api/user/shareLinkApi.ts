import { mtgcbApi } from '@/api/mtgcbApi';
import { ApiResponse } from '@/api/types/apiTypes';

export interface ShareLinkData {
  shareUrl: string;
  token: string;
  createdAt: string;
  expiresAt: string | null;
}

export interface ShareLinkStatus {
  hasShareLink: boolean;
  shareUrl?: string;
  createdAt?: string;
  expiresAt?: string | null;
}

export interface GenerateShareLinkRequest {
  expiresInHours?: number;
}

export interface RevokeShareLinkResponse {
  message: string;
}

export interface ShareLinkValidation {
  isValid: boolean;
  userId?: string;
  username?: string;
  expiresAt?: string | null;
}

export const shareLinkApi = mtgcbApi.injectEndpoints({
  endpoints: (builder) => ({
    generateShareLink: builder.mutation<ApiResponse<ShareLinkData>, GenerateShareLinkRequest>({
      query: (data) => ({
        url: '/user/share-link',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['ShareLink'],
    }),
    getShareLink: builder.query<ApiResponse<ShareLinkStatus>, void>({
      query: () => '/user/share-link',
      providesTags: ['ShareLink'],
    }),
    revokeShareLink: builder.mutation<ApiResponse<RevokeShareLinkResponse>, void>({
      query: () => ({
        url: '/user/share-link',
        method: 'DELETE',
      }),
      invalidatesTags: ['ShareLink'],
    }),
    resolveShareToken: builder.mutation<ShareLinkValidation, { shareToken: string }>({
      query: ({ shareToken }) => ({
        url: '/users/resolve-share-token',
        method: 'POST',
        body: { shareToken },
      }),
      transformResponse: (response: ApiResponse<ShareLinkValidation>) => {
        if (response.success && response.data) {
          return response.data;
        }
        return {
          isValid: false,
        };
      },
    }),
  }),
});

export const {
  useGenerateShareLinkMutation,
  useGetShareLinkQuery,
  useRevokeShareLinkMutation,
  useResolveShareTokenMutation,
} = shareLinkApi;