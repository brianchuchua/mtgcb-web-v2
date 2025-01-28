export interface BrowsePreferences {
  pageSize: number;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
}

export type ColorMatchType = 'exactly' | 'atLeast' | 'atMost';

export interface ColorFilter {
  colors: string[];
  matchType: ColorMatchType;
  includeColorless?: boolean;
}

export interface BrowseSearchParams {
  name?: string;
  oracleText?: string;
  colors?: ColorFilter;
}

export interface BrowseState {
  searchParams: BrowseSearchParams;
}

export const MTG_COLORS = ['W', 'U', 'B', 'R', 'G'] as const;

export type MtgColor = (typeof MTG_COLORS)[number];
