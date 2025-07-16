import { mtgcbApi } from '../mtgcbApi';
import type { ExportFormatsResponse } from './types';

const exportApi = mtgcbApi.injectEndpoints({
  endpoints: (builder) => ({
    getExportFormats: builder.query<ExportFormatsResponse['data'], void>({
      query: () => ({
        url: '/collection/export/formats',
        method: 'GET',
      }),
      transformResponse: (response: ExportFormatsResponse) => response.data,
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetExportFormatsQuery,
} = exportApi;