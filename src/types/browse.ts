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

export interface LayoutFilter {
  include: string[];
  exclude: string[];
}

export interface RarityFilter {
  include: string[];
  exclude: string[];
}

export interface BorderColorFilter {
  include: string[];
  exclude: string[];
}

export interface FrameEffectFilter {
  include: string[];
  exclude: string[];
}

export interface FrameStyleFilter {
  include: string[];
  exclude: string[];
}

/**
 * Release date window, both bounds optional and inclusive. Each bound is a
 * `YYYY`, `YYYY-MM` or `YYYY-MM-DD` string; the API widens a partial bound to
 * cover the whole year or month, so `{ from: '2019' }` means "from the start of
 * 2019" and `{ to: '2019' }` means "up to the end of 2019".
 */
export interface ReleaseDateFilter {
  from?: string;
  to?: string;
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

export interface FormatLegalityFilter {
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
  | 'type'
  | 'artist'
  | 'powerNumeric'
  | 'toughnessNumeric'
  | 'loyaltyNumeric'
  | 'convertedManaCost'
  | 'market'
  | 'low'
  | 'average'
  | 'high'
  | 'foil'
  // Set-specific sort options
  | 'category'
  | 'isDraftable'
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
  layouts?: LayoutFilter;
  borderColors?: BorderColorFilter;
  frameStyles?: FrameStyleFilter;
  frameEffects?: FrameEffectFilter;
  releaseDate?: ReleaseDateFilter;
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
  formatsLegal?: FormatLegalityFilter;
  /**
   * When true, the Format Legality filter uses `formatRelevantIn` (legal + restricted + banned)
   * instead of `legalIn` (legal + restricted). Lets users include banned cards in format-based
   * filtering — useful for "collect every card printed for Modern" rather than "cards currently
   * playable in Modern". Also flips the search-summary phrasing ("printed for X" vs "playable in X").
   */
  formatsLegalIncludeBanned?: boolean;
  selectedGoalId?: number | null;
  showGoals?: ShowGoalsOption;
  selectedLocationId?: number | null;
  includeChildLocations?: boolean;
  includeBadDataOnly?: boolean;
  isReserved?: boolean;
  /**
   * Tri-state full-art filter. `undefined` leaves full-art status unfiltered,
   * `true` keeps only full-art printings, `false` excludes them.
   */
  isFullArt?: boolean;
}

export interface BrowsePagination {
  currentPage: number;
  pageSize: number;
  viewMode: 'grid' | 'table';
}

export interface BrowseState {
  cardsSearchParams: BrowseSearchParams;
  setsSearchParams: BrowseSearchParams;
  viewContentType: 'cards' | 'sets';
}

export const MTG_COLORS = ['W', 'U', 'B', 'R', 'G'] as const;

export type MtgColor = (typeof MTG_COLORS)[number];
