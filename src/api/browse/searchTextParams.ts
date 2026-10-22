import { CardApiParams, SetApiParams } from './types';

// The API does a plain "contains" match, so stray spaces change results:
// "Lightning  Bolt" (two spaces, easy to type on a phone) finds nothing.
export const normalizeSearchText = (value: string): string => value.replace(/\s+/g, ' ').trim();

export const normalizeCardSearchParams = (params: CardApiParams): CardApiParams => ({
  ...params,
  ...(params.name && { name: normalizeSearchText(params.name) }),
  ...(params.oracleText && { oracleText: normalizeSearchText(params.oracleText) }),
  ...(params.artist && { artist: normalizeSearchText(params.artist) }),
});

export const normalizeSetSearchParams = (params: SetApiParams): SetApiParams => ({
  ...params,
  ...(params.name && { name: normalizeSearchText(params.name) }),
  ...(params.code && { code: normalizeSearchText(params.code) }),
});
