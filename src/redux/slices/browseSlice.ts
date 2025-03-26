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
const initialState: BrowseState = {
  searchParams: {},
};

export const browseSlice = createSlice({
  name: 'browse',
  initialState,
  reducers: {
    setSearchName: (state, action: PayloadAction<string>) => {
      if (action.payload === '') {
        delete state.searchParams.name;
      } else {
        state.searchParams.name = action.payload;
      }
    },
    setOracleText: (state, action: PayloadAction<string>) => {
      if (action.payload === '') {
        delete state.searchParams.oracleText;
      } else {
        state.searchParams.oracleText = action.payload;
      }
    },
    setArtist: (state, action: PayloadAction<string>) => {
      if (action.payload === '') {
        delete state.searchParams.artist;
      } else {
        state.searchParams.artist = action.payload;
      }
    },
    setColors: (state, action: PayloadAction<ColorFilter>) => {
      if (action.payload.colors.length === 0 && !action.payload.includeColorless) {
        delete state.searchParams.colors;
      } else {
        state.searchParams.colors = action.payload;
      }
    },
    setTypes: (state, action: PayloadAction<TypeFilter>) => {
      if (action.payload.include.length === 0 && action.payload.exclude.length === 0) {
        delete state.searchParams.types;
      } else {
        state.searchParams.types = action.payload;
      }
    },
    setRarities: (state, action: PayloadAction<RarityFilter>) => {
      if (action.payload.include.length === 0 && action.payload.exclude.length === 0) {
        delete state.searchParams.rarities;
      } else {
        state.searchParams.rarities = action.payload;
      }
    },
    setSets: (state, action: PayloadAction<SetFilter>) => {
      if (action.payload.include.length === 0 && action.payload.exclude.length === 0) {
        delete state.searchParams.sets;
      } else {
        state.searchParams.sets = action.payload;
      }
    },
    setStats: (state, action: PayloadAction<StatFilters>) => {
      const hasConditions = Object.values(action.payload).some(
        (conditions) => conditions.length > 0,
      );

      if (!hasConditions) {
        delete state.searchParams.stats;
      } else {
        state.searchParams.stats = action.payload;
      }
    },
    setOneResultPerCardName: (state, action: PayloadAction<boolean>) => {
      if (!action.payload) {
        delete state.searchParams.oneResultPerCardName;
      } else {
        state.searchParams.oneResultPerCardName = action.payload;
      }
    },
    setSortBy: (state, action: PayloadAction<SortByOption>) => {
      state.searchParams.sortBy = action.payload;
    },
    setSortOrder: (state, action: PayloadAction<SortOrderOption>) => {
      state.searchParams.sortOrder = action.payload;
    },
    setSearchParams: (state, action: PayloadAction<BrowseSearchParams>) => {
      state.searchParams = action.payload;
    },
    resetSearch: (state) => {
      state.searchParams = {};
    },
  },
});

export const {
  setSearchName,
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
  setSearchParams,
  resetSearch,
} = browseSlice.actions;

export const selectSearchParams = (state: RootState) => state.browse.searchParams;
export const selectSearchName = (state: RootState) => state.browse.searchParams.name;
export const selectOracleText = (state: RootState) => state.browse.searchParams.oracleText;
export const selectArtist = (state: RootState) => state.browse.searchParams.artist;
export const selectColors = (state: RootState) => state.browse.searchParams.colors;
export const selectTypes = (state: RootState) => state.browse.searchParams.types;
export const selectRarities = (state: RootState) => state.browse.searchParams.rarities;
export const selectSets = (state: RootState) => state.browse.searchParams.sets;
export const selectStats = (state: RootState) => state.browse.searchParams.stats;
export const selectOneResultPerCardName = (state: RootState) =>
  state.browse.searchParams.oneResultPerCardName;
export const selectSortBy = (state: RootState) => state.browse.searchParams.sortBy;
export const selectSortOrder = (state: RootState) => state.browse.searchParams.sortOrder;

export default browseSlice.reducer;
