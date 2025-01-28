import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { RootState } from '../rootReducer';
import { BrowsePreferences, BrowseSearchParams, BrowseState, ColorFilter, ColorMatchType } from '@/types/browse';

const defaultPreferences: BrowsePreferences = {
  pageSize: 24,
  sortBy: 'releasedAt',
  sortDirection: 'desc',
};

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
    // Add an action to set the entire search params state at once
    setSearchParams: (state, action: PayloadAction<BrowseSearchParams>) => {
      state.searchParams = action.payload;
    },
  },
});

export const { setSearchName, setOracleText, setColors, setSearchParams } = browseSlice.actions;

export const selectSearchParams = (state: RootState) => state.browse.searchParams;
export const selectSearchName = (state: RootState) => state.browse.searchParams.name;
export const selectOracleText = (state: RootState) => state.browse.searchParams.oracleText;
export const selectColors = (state: RootState) => state.browse.searchParams.colors;

export default browseSlice.reducer;