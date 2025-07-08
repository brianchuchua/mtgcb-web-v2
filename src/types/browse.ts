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

export interface RarityFilter {
  include: string[];
  exclude: string[];
}

export interface SetFilter {
  include: string[];
  exclude: string[];
}

export interface SetCategoryFilter {
  include: string[];
  exclude: string[];
}

export interface SetTypeFilter {
  include: string[];
  exclude: string[];
}

export interface CompletionStatusFilter {
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
  | 'loyaltyNumeric'
  | 'convertedManaCost'
  | 'market'
  | 'low'
  | 'average'
  | 'high'
  | 'foil'
  // Collection-specific sort options
  | 'totalValue'
  | 'costToComplete.oneOfEachCard'
  | 'percentageCollected';
export type SortOrderOption = 'asc' | 'desc';
export type ShowGoalsOption = 'all' | 'complete' | 'incomplete';

export interface BrowseSearchParams {
  name?: string;
  code?: string;
  oracleText?: string;
  artist?: string;
  colors?: ColorFilter;
  types?: TypeFilter;
  rarities?: RarityFilter;
  sets?: SetFilter;
  stats?: StatFilters;
  setCategories?: SetCategoryFilter;
  setTypes?: SetTypeFilter;
  oneResultPerCardName?: boolean;
  showSubsets?: boolean;
  includeSubsetsInSets?: boolean;
  sortBy?: SortByOption;
  sortOrder?: SortOrderOption;
  currentPage?: number;
  pageSize?: number;
  viewMode?: 'grid' | 'table';
  completionStatus?: CompletionStatusFilter;
  selectedGoalId?: number | null;
  showGoals?: ShowGoalsOption;
  selectedLocationId?: number | null;
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
