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
  }),
});

export const {
  useGenerateShareLinkMutation,
  useGetShareLinkQuery,
  useRevokeShareLinkMutation,
} = shareLinkApi;