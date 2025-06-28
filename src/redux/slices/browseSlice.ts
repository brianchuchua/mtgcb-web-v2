import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { RootState } from '../rootReducer';
import {
  BrowseSearchParams,
  BrowseState,
  ColorFilter,
  ColorMatchType,
  CompletionStatusFilter,
  RarityFilter,
  SetCategoryFilter,
  SetFilter,
  SetTypeFilter,
  ShowGoalsOption,
  SortByOption,
  SortOrderOption,
  StatFilters,
  TypeFilter,
} from '@/types/browse';

// Type for resetSearch options
interface ResetSearchOptions {
  preserveGoal?: boolean;
}

// Initialize with default pagination values for both card and set views
const initialState: {
  cardsSearchParams: BrowseSearchParams;
  setsSearchParams: BrowseSearchParams;
  viewContentType: 'cards' | 'sets';
} = {
  cardsSearchParams: {
    // Default pagination for cards
    currentPage: 1,
    pageSize: 24,
    viewMode: 'grid',
    sortBy: 'releasedAt',
    sortOrder: 'asc', // Cards default to ascending (oldest first)
  },
  setsSearchParams: {
    // Default pagination for sets
    currentPage: 1,
    pageSize: 24,
    viewMode: 'grid',
    showSubsets: true,
    includeSubsetsInSets: false,
    sortBy: 'releasedAt',
    sortOrder: 'desc',
  },
  viewContentType: 'sets', // Default to sets view
};

export const browseSlice = createSlice({
  name: 'browse',
  initialState,
  reducers: {
    setSearchName: (state, action: PayloadAction<string>) => {
      // Action applies to current view type
      const searchParams = state.viewContentType === 'cards' ? state.cardsSearchParams : state.setsSearchParams;

      if (action.payload === '') {
        delete searchParams.name;
      } else {
        searchParams.name = action.payload;
      }
    },
    setCardSearchName: (state, action: PayloadAction<string>) => {
      // Explicitly for cards view
      if (action.payload === '') {
        delete state.cardsSearchParams.name;
      } else {
        state.cardsSearchParams.name = action.payload;
      }
    },
    setSetSearchName: (state, action: PayloadAction<string>) => {
      // Explicitly for sets view
      if (action.payload === '') {
        delete state.setsSearchParams.name;
      } else {
        state.setsSearchParams.name = action.payload;
      }
    },
    setSetCode: (state, action: PayloadAction<string>) => {
      // Explicitly for sets view
      if (action.payload === '') {
        delete state.setsSearchParams.code;
      } else {
        state.setsSearchParams.code = action.payload;
      }
    },
    setOracleText: (state, action: PayloadAction<string>) => {
      // Cards-specific field
      if (action.payload === '') {
        delete state.cardsSearchParams.oracleText;
      } else {
        state.cardsSearchParams.oracleText = action.payload;
      }
    },
    setArtist: (state, action: PayloadAction<string>) => {
      // Cards-specific field
      if (action.payload === '') {
        delete state.cardsSearchParams.artist;
      } else {
        state.cardsSearchParams.artist = action.payload;
      }
    },
    setColors: (state, action: PayloadAction<ColorFilter>) => {
      // Cards-specific field
      if (action.payload.colors.length === 0 && !action.payload.includeColorless) {
        delete state.cardsSearchParams.colors;
      } else {
        state.cardsSearchParams.colors = action.payload;
      }
    },
    setTypes: (state, action: PayloadAction<TypeFilter>) => {
      // Cards-specific field
      if (action.payload.include.length === 0 && action.payload.exclude.length === 0) {
        delete state.cardsSearchParams.types;
      } else {
        state.cardsSearchParams.types = action.payload;
      }
    },
    setRarities: (state, action: PayloadAction<RarityFilter>) => {
      // Cards-specific field
      if (action.payload.include.length === 0 && action.payload.exclude.length === 0) {
        delete state.cardsSearchParams.rarities;
      } else {
        state.cardsSearchParams.rarities = action.payload;
      }
    },
    setSets: (state, action: PayloadAction<SetFilter>) => {
      // Cards-specific field
      if (action.payload.include.length === 0 && action.payload.exclude.length === 0) {
        delete state.cardsSearchParams.sets;
      } else {
        state.cardsSearchParams.sets = action.payload;
      }
    },
    setStats: (state, action: PayloadAction<StatFilters>) => {
      const hasConditions = Object.values(action.payload).some((conditions) => conditions.length > 0);

      if (!hasConditions) {
        delete state.cardsSearchParams.stats;
      } else {
        state.cardsSearchParams.stats = action.payload;
      }
    },
    setSetCategories: (state, action: PayloadAction<SetCategoryFilter>) => {
      if (action.payload.include.length === 0 && action.payload.exclude.length === 0) {
        delete state.setsSearchParams.setCategories;
      } else {
        state.setsSearchParams.setCategories = action.payload;
      }
    },
    setSetTypes: (state, action: PayloadAction<SetTypeFilter>) => {
      if (action.payload.include.length === 0 && action.payload.exclude.length === 0) {
        delete state.setsSearchParams.setTypes;
      } else {
        state.setsSearchParams.setTypes = action.payload;
      }
    },
    setShowSubsets: (state, action: PayloadAction<boolean>) => {
      state.setsSearchParams.showSubsets = action.payload;
    },
    setIncludeSubsetsInSet: (state, action: PayloadAction<boolean>) => {
      state.setsSearchParams.includeSubsetsInSets = action.payload;
    },
    setCompletionStatus: (state, action: PayloadAction<CompletionStatusFilter>) => {
      if (action.payload.include.length === 0 && action.payload.exclude.length === 0) {
        delete state.setsSearchParams.completionStatus;
      } else {
        state.setsSearchParams.completionStatus = action.payload;
      }
    },
    setOneResultPerCardName: (state, action: PayloadAction<boolean>) => {
      // Cards-specific field
      if (!action.payload) {
        delete state.cardsSearchParams.oneResultPerCardName;
      } else {
        state.cardsSearchParams.oneResultPerCardName = action.payload;
      }
    },
    setSortBy: (state, action: PayloadAction<SortByOption>) => {
      // Apply to current view type
      const searchParams = state.viewContentType === 'cards' ? state.cardsSearchParams : state.setsSearchParams;
      searchParams.sortBy = action.payload;
    },
    setSortOrder: (state, action: PayloadAction<SortOrderOption>) => {
      // Apply to current view type
      const searchParams = state.viewContentType === 'cards' ? state.cardsSearchParams : state.setsSearchParams;
      searchParams.sortOrder = action.payload;
    },
    // Add new pagination reducers
    setPagination: (
      state,
      action: PayloadAction<{
        currentPage?: number;
        pageSize?: number;
        viewMode?: 'grid' | 'table';
      }>,
    ) => {
      if (state.viewContentType === 'cards') {
        // Create a new reference to trigger re-renders properly
        state.cardsSearchParams = {
          ...state.cardsSearchParams,
          ...(action.payload.currentPage !== undefined ? { currentPage: action.payload.currentPage } : {}),
          ...(action.payload.pageSize !== undefined ? { pageSize: action.payload.pageSize } : {}),
          ...(action.payload.viewMode !== undefined ? { viewMode: action.payload.viewMode } : {}),
        };
      } else {
        // Create a new reference to trigger re-renders properly
        state.setsSearchParams = {
          ...state.setsSearchParams,
          ...(action.payload.currentPage !== undefined ? { currentPage: action.payload.currentPage } : {}),
          ...(action.payload.pageSize !== undefined ? { pageSize: action.payload.pageSize } : {}),
          ...(action.payload.viewMode !== undefined ? { viewMode: action.payload.viewMode } : {}),
        };
      }
    },
    setCardPagination: (
      state,
      action: PayloadAction<{
        currentPage?: number;
        pageSize?: number;
        viewMode?: 'grid' | 'table';
      }>,
    ) => {
      // Create a new reference to trigger re-renders properly
      state.cardsSearchParams = {
        ...state.cardsSearchParams,
        ...(action.payload.currentPage !== undefined ? { currentPage: action.payload.currentPage } : {}),
        ...(action.payload.pageSize !== undefined ? { pageSize: action.payload.pageSize } : {}),
        ...(action.payload.viewMode !== undefined ? { viewMode: action.payload.viewMode } : {}),
      };
    },
    setSetPagination: (
      state,
      action: PayloadAction<{
        currentPage?: number;
        pageSize?: number;
        viewMode?: 'grid' | 'table';
      }>,
    ) => {
      // Create a new reference to trigger re-renders properly
      state.setsSearchParams = {
        ...state.setsSearchParams,
        ...(action.payload.currentPage !== undefined ? { currentPage: action.payload.currentPage } : {}),
        ...(action.payload.pageSize !== undefined ? { pageSize: action.payload.pageSize } : {}),
        ...(action.payload.viewMode !== undefined ? { viewMode: action.payload.viewMode } : {}),
      };
    },
    setCardSearchParams: (state, action: PayloadAction<BrowseSearchParams>) => {
      // Preserve pagination if not provided in the payload
      const pagination = {
        currentPage: state.cardsSearchParams.currentPage || 1,
        pageSize: state.cardsSearchParams.pageSize || 24,
        viewMode: state.cardsSearchParams.viewMode || 'grid',
      };

      // Filter out undefined values from the payload to avoid overriding existing values
      const cleanPayload = Object.entries(action.payload).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as any);
      
      state.cardsSearchParams = {
        ...state.cardsSearchParams, // Preserve existing state
        ...cleanPayload, // Only override with defined values
        // Keep current pagination unless explicitly overridden
        currentPage: action.payload.currentPage !== undefined ? action.payload.currentPage : pagination.currentPage,
        pageSize: action.payload.pageSize !== undefined ? action.payload.pageSize : pagination.pageSize,
        viewMode: action.payload.viewMode !== undefined ? action.payload.viewMode : pagination.viewMode,
      };
    },
    setSetSearchParams: (state, action: PayloadAction<BrowseSearchParams>) => {
      // Preserve pagination if not provided in the payload
      const pagination = {
        currentPage: state.setsSearchParams.currentPage || 1,
        pageSize: state.setsSearchParams.pageSize || 24,
        viewMode: state.setsSearchParams.viewMode || 'grid',
      };

      // Filter out undefined values from the payload to avoid overriding existing values
      const cleanPayload = Object.entries(action.payload).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as any);
      
      state.setsSearchParams = {
        ...state.setsSearchParams, // Preserve existing state
        ...cleanPayload, // Only override with defined values
        // Keep current pagination unless explicitly overridden
        currentPage: action.payload.currentPage !== undefined ? action.payload.currentPage : pagination.currentPage,
        pageSize: action.payload.pageSize !== undefined ? action.payload.pageSize : pagination.pageSize,
        viewMode: action.payload.viewMode !== undefined ? action.payload.viewMode : pagination.viewMode,
      };
    },
    resetSearch: (state, action: PayloadAction<ResetSearchOptions | undefined>) => {
      const preserveGoal = action.payload?.preserveGoal || false;
      
      // Reset the current view type's search params but preserve pagination
      const pagination =
        state.viewContentType === 'cards'
          ? {
              currentPage: state.cardsSearchParams.currentPage || 1,
              pageSize: state.cardsSearchParams.pageSize || 24,
              viewMode: state.cardsSearchParams.viewMode || 'grid',
            }
          : {
              currentPage: state.setsSearchParams.currentPage || 1,
              pageSize: state.setsSearchParams.pageSize || 24,
              viewMode: state.setsSearchParams.viewMode || 'grid',
            };

      // Store current values that might need to be preserved
      const currentGoalId = state.viewContentType === 'cards' 
        ? state.cardsSearchParams.selectedGoalId 
        : state.setsSearchParams.selectedGoalId;
      const currentSortBy = state.setsSearchParams.sortBy;
      const currentSortOrder = state.setsSearchParams.sortOrder;

      if (state.viewContentType === 'cards') {
        state.cardsSearchParams = {
          currentPage: pagination.currentPage,
          pageSize: pagination.pageSize,
          viewMode: pagination.viewMode,
          // Restore default values for cards
          sortBy: preserveGoal && state.cardsSearchParams.sortBy ? state.cardsSearchParams.sortBy : 'releasedAt',
          sortOrder: preserveGoal && state.cardsSearchParams.sortOrder ? state.cardsSearchParams.sortOrder : 'asc',
        };
        // Preserve goal if requested
        if (preserveGoal && currentGoalId !== undefined) {
          state.cardsSearchParams.selectedGoalId = currentGoalId;
        }
      } else {
        state.setsSearchParams = {
          currentPage: pagination.currentPage,
          pageSize: pagination.pageSize,
          viewMode: pagination.viewMode,
          // Restore default values for sets
          showSubsets: true,
          includeSubsetsInSets: false,
          sortBy: preserveGoal && currentSortBy ? currentSortBy : 'releasedAt',
          sortOrder: preserveGoal && currentSortOrder ? currentSortOrder : 'desc',
        };
        // Preserve goal if requested
        if (preserveGoal && currentGoalId !== undefined) {
          state.setsSearchParams.selectedGoalId = currentGoalId;
        }
      }
      
      // Only clear selected goal if not preserving it
      if (!preserveGoal) {
        delete state.cardsSearchParams.selectedGoalId;
        delete state.setsSearchParams.selectedGoalId;
      }
    },
    resetAllSearches: (state) => {
      // Reset both cards and sets search params but preserve pagination
      const cardsPagination = {
        currentPage: state.cardsSearchParams.currentPage || 1,
        pageSize: state.cardsSearchParams.pageSize || 24,
        viewMode: state.cardsSearchParams.viewMode || 'grid',
      };

      const setsPagination = {
        currentPage: state.setsSearchParams.currentPage || 1,
        pageSize: state.setsSearchParams.pageSize || 24,
        viewMode: state.setsSearchParams.viewMode || 'grid',
      };

      state.cardsSearchParams = {
        currentPage: cardsPagination.currentPage,
        pageSize: cardsPagination.pageSize,
        viewMode: cardsPagination.viewMode,
        // Restore default values for cards
        sortBy: 'releasedAt',
        sortOrder: 'asc',
      };

      state.setsSearchParams = {
        currentPage: setsPagination.currentPage,
        pageSize: setsPagination.pageSize,
        viewMode: setsPagination.viewMode,
        // Restore default values for sets
        showSubsets: true,
        includeSubsetsInSets: false,
        sortBy: 'releasedAt',
        sortOrder: 'desc',
      };
    },
    setViewContentType: (state, action: PayloadAction<'cards' | 'sets'>) => {
      // Skip action if it would reapply the same value
      if (state.viewContentType === action.payload) {
        return;
      }

      // Ensure it's a valid value
      if (action.payload !== 'cards' && action.payload !== 'sets') {
        state.viewContentType = 'cards';
      } else {
        state.viewContentType = action.payload;
      }
    },
    setSelectedGoalId: (state, action: PayloadAction<number | null>) => {
      // Apply to both card and set search params
      if (action.payload === null) {
        delete state.cardsSearchParams.selectedGoalId;
        delete state.setsSearchParams.selectedGoalId;
      } else {
        state.cardsSearchParams.selectedGoalId = action.payload;
        state.setsSearchParams.selectedGoalId = action.payload;
      }
    },
    clearSelectedGoal: (state) => {
      delete state.cardsSearchParams.selectedGoalId;
      delete state.setsSearchParams.selectedGoalId;
      // Also clear showGoals when clearing goal
      delete state.cardsSearchParams.showGoals;
      delete state.setsSearchParams.showGoals;
    },
    setShowGoals: (state, action: PayloadAction<ShowGoalsOption>) => {
      // Apply to both card and set search params
      if (action.payload === 'all') {
        delete state.cardsSearchParams.showGoals;
        delete state.setsSearchParams.showGoals;
      } else {
        state.cardsSearchParams.showGoals = action.payload;
        state.setsSearchParams.showGoals = action.payload;
      }
    },
  },
});

export const {
  setSearchName,
  setCardSearchName,
  setSetSearchName,
  setSetCode,
  setOracleText,
  setArtist,
  setColors,
  setTypes,
  setRarities,
  setSets,
  setStats,
  setSetCategories,
  setSetTypes,
  setShowSubsets,
  setIncludeSubsetsInSet,
  setCompletionStatus,
  setOneResultPerCardName,
  setSortBy,
  setSortOrder,
  setPagination,
  setCardPagination,
  setSetPagination,
  setCardSearchParams,
  setSetSearchParams,
  resetSearch,
  resetAllSearches,
  setViewContentType,
  setSelectedGoalId,
  clearSelectedGoal,
  setShowGoals,
} = browseSlice.actions;

// Generic/shared selectors that respect current content type
export const selectSearchParams = (state: RootState) =>
  state.browse.viewContentType === 'cards' ? state.browse.cardsSearchParams : state.browse.setsSearchParams;

export const selectSearchName = (state: RootState) =>
  state.browse.viewContentType === 'cards' ? state.browse.cardsSearchParams.name : state.browse.setsSearchParams.name;

export const selectSortBy = (state: RootState) =>
  state.browse.viewContentType === 'cards'
    ? state.browse.cardsSearchParams.sortBy
    : state.browse.setsSearchParams.sortBy;

export const selectSortOrder = (state: RootState) =>
  state.browse.viewContentType === 'cards'
    ? state.browse.cardsSearchParams.sortOrder
    : state.browse.setsSearchParams.sortOrder;

// Add pagination selectors
export const selectCurrentPage = (state: RootState) =>
  state.browse.viewContentType === 'cards'
    ? state.browse.cardsSearchParams.currentPage || 1
    : state.browse.setsSearchParams.currentPage || 1;

export const selectPageSize = (state: RootState) =>
  state.browse.viewContentType === 'cards'
    ? state.browse.cardsSearchParams.pageSize || 24
    : state.browse.setsSearchParams.pageSize || 24;

// Card-specific selectors
export const selectCardSearchParams = (state: RootState) => state.browse.cardsSearchParams;
export const selectCardSearchName = (state: RootState) => state.browse.cardsSearchParams.name;
export const selectOracleText = (state: RootState) => state.browse.cardsSearchParams.oracleText;
export const selectArtist = (state: RootState) => state.browse.cardsSearchParams.artist;
export const selectColors = (state: RootState) => state.browse.cardsSearchParams.colors;
export const selectTypes = (state: RootState) => state.browse.cardsSearchParams.types;
export const selectRarities = (state: RootState) => state.browse.cardsSearchParams.rarities;
export const selectSets = (state: RootState) => state.browse.cardsSearchParams.sets;
export const selectStats = (state: RootState) => state.browse.cardsSearchParams.stats;
export const selectOneResultPerCardName = (state: RootState) => state.browse.cardsSearchParams.oneResultPerCardName;
export const selectCardSortBy = (state: RootState) => state.browse.cardsSearchParams.sortBy;
export const selectCardSortOrder = (state: RootState) => state.browse.cardsSearchParams.sortOrder;
export const selectCardCurrentPage = (state: RootState) => state.browse.cardsSearchParams.currentPage || 1;
export const selectCardPageSize = (state: RootState) => state.browse.cardsSearchParams.pageSize || 24;

// Set-specific selectors
export const selectSetSearchParams = (state: RootState) => state.browse.setsSearchParams;
export const selectSetSearchName = (state: RootState) => state.browse.setsSearchParams.name;
export const selectSetCode = (state: RootState) => state.browse.setsSearchParams.code;
export const selectSetSortBy = (state: RootState) => state.browse.setsSearchParams.sortBy;
export const selectSetSortOrder = (state: RootState) => state.browse.setsSearchParams.sortOrder;
export const selectSetCurrentPage = (state: RootState) => state.browse.setsSearchParams.currentPage || 1;
export const selectSetPageSize = (state: RootState) => state.browse.setsSearchParams.pageSize || 24;
export const selectSetCategories = (state: RootState) => state.browse.setsSearchParams.setCategories;
export const selectSetTypes = (state: RootState) => state.browse.setsSearchParams.setTypes;
export const selectShowSubsets = (state: RootState) => state.browse.setsSearchParams.showSubsets !== false;
export const selectIncludeSubsetsInSets = (state: RootState) => !!state.browse.setsSearchParams.includeSubsetsInSets;
export const selectCompletionStatus = (state: RootState) => state.browse.setsSearchParams.completionStatus;

// Content type selector
export const selectViewContentType = (state: RootState) => state.browse.viewContentType;

// Goal selector
export const selectSelectedGoalId = (state: RootState) => 
  state.browse.viewContentType === 'cards' 
    ? state.browse.cardsSearchParams.selectedGoalId 
    : state.browse.setsSearchParams.selectedGoalId;

// Show goals selector
export const selectShowGoals = (state: RootState): ShowGoalsOption => 
  state.browse.viewContentType === 'cards' 
    ? state.browse.cardsSearchParams.showGoals || 'all'
    : state.browse.setsSearchParams.showGoals || 'all';

export default browseSlice.reducer;
