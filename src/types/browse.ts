export type ColorMatchType = 'exactly' | 'atLeast' | 'atMost';

export interface ColorFilter {
  colors: string[];
  matchType: ColorMatchType;
  includeColorless?: boolean;
}

export interface TypeFilter {
  include: string[];
  exclude: string[];
}

export interface StatCondition {
  attribute: string;
  operator: string;
  value: string;
}

export interface StatFilters {
  [key: string]: string[]; // Maps attribute to array of conditions
}

export type SortByOption =
  | 'name'
  | 'releasedAt'
  | 'collectorNumber'
  | 'mtgcbCollectorNumber'
  | 'rarityNumeric'
  | 'powerNumeric'
  | 'toughnessNumeric'
  | 'loyaltyNumeric';
export type SortOrderOption = 'asc' | 'desc';

export interface BrowseSearchParams {
  name?: string;
  oracleText?: string;
  artist?: string;
  colors?: ColorFilter;
  types?: TypeFilter;
  stats?: StatFilters;
  oneResultPerCardName?: boolean;
  sortBy?: SortByOption;
  sortOrder?: SortOrderOption;
}

export interface BrowsePagination {
  currentPage: number;
  pageSize: number;
  viewMode: 'grid' | 'table';
}

export interface BrowseState {
  searchParams: BrowseSearchParams;
}

export const MTG_COLORS = ['W', 'U', 'B', 'R', 'G'] as const;

export type MtgColor = (typeof MTG_COLORS)[number];
