import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import {
  BrowseSearchParams,
  BrowseState,
  ColorFilter,
  ColorMatchType,
  CompletionStatusFilter,
  LayoutFilter,
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
import { getCardsPreferences, getSetsPreferences } from './preferences';
import { clearSearchState, loadSearchState } from '@/hooks/useSearchStateSync';
import { parseUrlToState } from '@/features/browse/schema/urlStateAdapters';

// Type for resetSearch options
interface ResetSearchOptions {
  preserveGoal?: boolean;
  preserveLocation?: boolean;
}

/**
 * Get default state structure with user preferences from localStorage
 */
function getDefaultState(): BrowseState {
  const cardsPrefs = getCardsPreferences();
  const setsPrefs = getSetsPreferences();

  return {
    cardsSearchParams: {
      // Default pagination for cards
      currentPage: 1,
      pageSize: 20, // Will be overridden by localStorage in useBrowseStateSync
      viewMode: 'grid', // Will be overridden by DisplaySettingsContext

      // User preferences from localStorage
      sortBy: cardsPrefs.sortBy,
      sortOrder: cardsPrefs.sortOrder,
      // Only set oneResultPerCardName if it's true (undefined otherwise)
      ...(cardsPrefs.oneResultPerCardName ? { oneResultPerCardName: true } : {}),
    },
    setsSearchParams: {
      // Default pagination for sets
      currentPage: 1,
      pageSize: 20, // Will be overridden by localStorage in useBrowseStateSync
      viewMode: 'grid', // Will be overridden by DisplaySettingsContext

      // User preferences from localStorage
      showSubsets: setsPrefs.showSubsets,
      includeSubsetsInSets: setsPrefs.includeSubsetsInSets,
      sortBy: setsPrefs.sortBy,
      sortOrder: setsPrefs.sortOrder,
    },
    viewContentType: 'sets', // Default to sets view
  };
}

/**
 * Initialize Redux state synchronously from URL or sessionStorage
 *
 * Priority hierarchy:
 * 1. URL parameters (highest - for shared links)
 * 2. sessionStorage (active search from F5 refresh)
 * 3. localStorage preferences (sort, pageSize, etc.)
 * 4. Hardcoded defaults
 *
 * This eliminates the "flash of empty state" by having correct values at T0
 */
function getInitialState(): BrowseState {
  // SSR: Return defaults (no window available)
  if (typeof window === 'undefined') {
    return getDefaultState();
  }

  try {
    const defaults = getDefaultState();

    // Check if URL has search parameters (excluding contentType)
    const urlParams = new URLSearchParams(window.location.search);
    const hasUrlSearchParams = Array.from(urlParams.entries())
      .filter(([key]) => key !== 'contentType')
      .length > 0;

    if (hasUrlSearchParams) {
      // URL has params - parse and merge (URL has highest priority)
      console.log('[browseSlice] 🔗 Initializing from URL:', window.location.search);
      const cardsFromUrl = parseUrlToState(urlParams, 'cards');
      const setsFromUrl = parseUrlToState(urlParams, 'sets');

      return {
        ...defaults,
        cardsSearchParams: {
          ...defaults.cardsSearchParams,
          ...cardsFromUrl,
        },
        setsSearchParams: {
          ...defaults.setsSearchParams,
          ...setsFromUrl,
        },
      };
    } else {
      // No URL params - try loading from sessionStorage
      const cardsSession = loadSearchState('cards');
      const setsSession = loadSearchState('sets');

      if (cardsSession || setsSession) {
        console.log('[browseSlice] 💾 Initializing from sessionStorage:', {
          cards: cardsSession?.name || '(no cards search)',
          sets: setsSession?.name || '(no sets search)',
        });
      }

      return {
        ...defaults,
        cardsSearchParams: {
          ...defaults.cardsSearchParams,
          ...(cardsSession || {}),
        },
        setsSearchParams: {
          ...defaults.setsSearchParams,
          ...(setsSession || {}),
        },
      };
    }
  } catch (error) {
    console.warn('[browseSlice] ⚠️  Failed to initialize from URL/sessionStorage:', error);
    return getDefaultState();
  }
}

const initialState = getInitialState();

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
    setLayouts: (state, action: PayloadAction<LayoutFilter>) => {
      // Cards-specific field
      if (action.payload.include.length === 0 && action.payload.exclude.length === 0) {
        delete state.cardsSearchParams.layouts;
      } else {
        state.cardsSearchParams.layouts = action.payload;
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
    setIncludeBadDataOnly: (state, action: PayloadAction<boolean>) => {
      // Cards-specific field
      if (!action.payload) {
        delete state.cardsSearchParams.includeBadDataOnly;
      } else {
        state.cardsSearchParams.includeBadDataOnly = action.payload;
      }
    },
    setIsReserved: (state, action: PayloadAction<boolean | undefined>) => {
      // Cards-specific field
      if (action.payload === undefined) {
        delete state.cardsSearchParams.isReserved;
      } else {
        state.cardsSearchParams.isReserved = action.payload;
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
        pageSize: state.cardsSearchParams.pageSize || 20,
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
        pageSize: state.setsSearchParams.pageSize || 20,
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
      const preserveLocation = action.payload?.preserveLocation || false;

      // Preserve pagination
      const pagination =
        state.viewContentType === 'cards'
          ? {
              currentPage: state.cardsSearchParams.currentPage || 1,
              pageSize: state.cardsSearchParams.pageSize || 20,
              viewMode: state.cardsSearchParams.viewMode || 'grid',
            }
          : {
              currentPage: state.setsSearchParams.currentPage || 1,
              pageSize: state.setsSearchParams.pageSize || 20,
              viewMode: state.setsSearchParams.viewMode || 'grid',
            };

      // Store current goal/location to optionally preserve
      const currentGoalId = state.viewContentType === 'cards'
        ? state.cardsSearchParams.selectedGoalId
        : state.setsSearchParams.selectedGoalId;
      const currentLocationId = state.viewContentType === 'cards'
        ? state.cardsSearchParams.selectedLocationId
        : state.setsSearchParams.selectedLocationId;

      if (state.viewContentType === 'cards') {
        // Get user preferences from localStorage
        const prefs = getCardsPreferences();

        state.cardsSearchParams = {
          currentPage: pagination.currentPage,
          pageSize: pagination.pageSize,
          viewMode: pagination.viewMode,

          // Restore user preferences (NOT hard-coded defaults!)
          sortBy: prefs.sortBy,
          sortOrder: prefs.sortOrder,
          // Only set oneResultPerCardName if it's true (undefined otherwise)
          ...(prefs.oneResultPerCardName ? { oneResultPerCardName: true } : {}),

          // Note: Search fields (name, oracleText, artist, colors, types, etc.)
          // are intentionally NOT set here - they remain undefined (cleared)
        };

        // Preserve goal/location if requested
        if (preserveGoal && currentGoalId !== undefined) {
          state.cardsSearchParams.selectedGoalId = currentGoalId;
        }
        if (preserveLocation && currentLocationId !== undefined) {
          state.cardsSearchParams.selectedLocationId = currentLocationId;
        }
      } else {
        // Get user preferences from localStorage
        const prefs = getSetsPreferences();

        state.setsSearchParams = {
          currentPage: pagination.currentPage,
          pageSize: pagination.pageSize,
          viewMode: pagination.viewMode,

          // Restore user preferences (NOT hard-coded defaults!)
          showSubsets: prefs.showSubsets,
          includeSubsetsInSets: prefs.includeSubsetsInSets,
          sortBy: prefs.sortBy,
          sortOrder: prefs.sortOrder,

          // Note: Search fields (name, code, setCategories, setTypes, etc.)
          // are intentionally NOT set here - they remain undefined (cleared)
        };

        // Preserve goal/location if requested
        if (preserveGoal && currentGoalId !== undefined) {
          state.setsSearchParams.selectedGoalId = currentGoalId;
        }
        if (preserveLocation && currentLocationId !== undefined) {
          state.setsSearchParams.selectedLocationId = currentLocationId;
        }
      }

      // Clear goal/location if not preserving
      if (!preserveGoal) {
        delete state.cardsSearchParams.selectedGoalId;
        delete state.setsSearchParams.selectedGoalId;
      }

      if (!preserveLocation) {
        delete state.cardsSearchParams.selectedLocationId;
        delete state.setsSearchParams.selectedLocationId;
      }

      // Clear sessionStorage search state
      clearSearchState(state.viewContentType);
    },
    resetAllSearches: (state) => {
      // Get user preferences from localStorage
      const cardsPrefs = getCardsPreferences();
      const setsPrefs = getSetsPreferences();

      // Preserve pagination
      const cardsPagination = {
        currentPage: state.cardsSearchParams.currentPage || 1,
        pageSize: state.cardsSearchParams.pageSize || 20,
        viewMode: state.cardsSearchParams.viewMode || 'grid',
      };

      const setsPagination = {
        currentPage: state.setsSearchParams.currentPage || 1,
        pageSize: state.setsSearchParams.pageSize || 20,
        viewMode: state.setsSearchParams.viewMode || 'grid',
      };

      state.cardsSearchParams = {
        ...cardsPagination,
        // Restore user preferences
        sortBy: cardsPrefs.sortBy,
        sortOrder: cardsPrefs.sortOrder,
        ...(cardsPrefs.oneResultPerCardName ? { oneResultPerCardName: true } : {}),
      };

      state.setsSearchParams = {
        ...setsPagination,
        // Restore user preferences
        showSubsets: setsPrefs.showSubsets,
        includeSubsetsInSets: setsPrefs.includeSubsetsInSets,
        sortBy: setsPrefs.sortBy,
        sortOrder: setsPrefs.sortOrder,
      };

      // NOTE: Don't clear sessionStorage here - this action is used for URL changes
      // SessionStorage should only be cleared by explicit user actions (resetSearch button)
      // The empty Redux state will trigger our useSearchStateSessionSync to skip saving,
      // which preserves existing sessionStorage for cross-view restoration
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
    setSelectedLocationId: (state, action: PayloadAction<number | null>) => {
      // Apply to both card and set search params
      if (action.payload === null) {
        delete state.cardsSearchParams.selectedLocationId;
        delete state.setsSearchParams.selectedLocationId;
      } else {
        state.cardsSearchParams.selectedLocationId = action.payload;
        state.setsSearchParams.selectedLocationId = action.payload;
      }
    },
    setIncludeChildLocations: (state, action: PayloadAction<boolean>) => {
      // Apply to both card and set search params
      state.cardsSearchParams.includeChildLocations = action.payload;
      state.setsSearchParams.includeChildLocations = action.payload;
    },
    clearSelectedLocation: (state) => {
      delete state.cardsSearchParams.selectedLocationId;
      delete state.setsSearchParams.selectedLocationId;
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
  setLayouts,
  setRarities,
  setSets,
  setStats,
  setSetCategories,
  setSetTypes,
  setShowSubsets,
  setIncludeSubsetsInSet,
  setCompletionStatus,
  setOneResultPerCardName,
  setIncludeBadDataOnly,
  setIsReserved,
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
  setSelectedLocationId,
  setIncludeChildLocations,
  clearSelectedLocation,
} = browseSlice.actions;

export default browseSlice.reducer;
