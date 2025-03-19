import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { RootState } from '../rootReducer';
import {
  BrowseSearchParams,
  BrowseState,
  ColorFilter,
  ColorMatchType,
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
    setSearchParams: (state, action: PayloadAction<BrowseSearchParams>) => {
      state.searchParams = action.payload;
    },
  },
});

export const { setSearchName, setOracleText, setColors, setTypes, setStats, setSearchParams } =
  browseSlice.actions;

export const selectSearchParams = (state: RootState) => state.browse.searchParams;
export const selectSearchName = (state: RootState) => state.browse.searchParams.name;
export const selectOracleText = (state: RootState) => state.browse.searchParams.oracleText;
export const selectColors = (state: RootState) => state.browse.searchParams.colors;
export const selectTypes = (state: RootState) => state.browse.searchParams.types;
export const selectStats = (state: RootState) => state.browse.searchParams.stats;

export default browseSlice.reducer;
