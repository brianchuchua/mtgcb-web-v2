import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { RootState } from '../rootReducer';
import {
  BrowseSearchParams,
  BrowseState,
  ColorFilter,
  ColorMatchType,
  RarityFilter,
  SetFilter,
  SortByOption,
  SortOrderOption,
  StatFilters,
  TypeFilter,
} from '@/types/browse';

// Initialize with empty state - let the useInitializeBrowseFromUrl handle population
const initialState: {
  cardsSearchParams: BrowseSearchParams;
  setsSearchParams: BrowseSearchParams;
  viewContentType: 'cards' | 'sets';
} = {
  cardsSearchParams: {},
  setsSearchParams: {},
  viewContentType: 'cards', // Default to cards view
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
      // Cards-specific field
      const hasConditions = Object.values(action.payload).some(
        (conditions) => conditions.length > 0,
      );

      if (!hasConditions) {
        delete state.cardsSearchParams.stats;
      } else {
        state.cardsSearchParams.stats = action.payload;
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
    setCardSearchParams: (state, action: PayloadAction<BrowseSearchParams>) => {
      state.cardsSearchParams = action.payload;
    },
    setSetSearchParams: (state, action: PayloadAction<BrowseSearchParams>) => {
      state.setsSearchParams = action.payload;
    },
    resetSearch: (state) => {
      // Reset the current view type's search params
      if (state.viewContentType === 'cards') {
        state.cardsSearchParams = {};
      } else {
        state.setsSearchParams = {};
      }
    },
    resetAllSearches: (state) => {
      // Reset both cards and sets search params
      state.cardsSearchParams = {};
      state.setsSearchParams = {};
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
  },
});

export const {
  setSearchName,
  setCardSearchName,
  setSetSearchName,
  setOracleText,
  setArtist,
  setColors,
  setTypes,
  setRarities,
  setSets,
  setStats,
  setOneResultPerCardName,
  setSortBy,
  setSortOrder,
  setCardSearchParams,
  setSetSearchParams,
  resetSearch,
  resetAllSearches,
  setViewContentType,
} = browseSlice.actions;

// Generic/shared selectors that respect current content type
export const selectSearchParams = (state: RootState) => 
  state.browse.viewContentType === 'cards' ? state.browse.cardsSearchParams : state.browse.setsSearchParams;

export const selectSearchName = (state: RootState) => 
  state.browse.viewContentType === 'cards' ? state.browse.cardsSearchParams.name : state.browse.setsSearchParams.name;

export const selectSortBy = (state: RootState) => 
  state.browse.viewContentType === 'cards' ? state.browse.cardsSearchParams.sortBy : state.browse.setsSearchParams.sortBy;

export const selectSortOrder = (state: RootState) => 
  state.browse.viewContentType === 'cards' ? state.browse.cardsSearchParams.sortOrder : state.browse.setsSearchParams.sortOrder;

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

// Set-specific selectors
export const selectSetSearchParams = (state: RootState) => state.browse.setsSearchParams;
export const selectSetSearchName = (state: RootState) => state.browse.setsSearchParams.name;
export const selectSetSortBy = (state: RootState) => state.browse.setsSearchParams.sortBy;
export const selectSetSortOrder = (state: RootState) => state.browse.setsSearchParams.sortOrder;

// Content type selector
export const selectViewContentType = (state: RootState) => state.browse.viewContentType;

export default browseSlice.reducer;
