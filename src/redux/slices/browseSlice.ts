import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { RootState } from '../rootReducer';
import { BrowsePreferences, BrowseSearchParams, BrowseState } from '@/types/browse';

const defaultPreferences: BrowsePreferences = {
  pageSize: 24,
  sortBy: 'releasedAt',
  sortDirection: 'desc',
};

const parseSearchParams = (): BrowseSearchParams => {
  if (typeof window === 'undefined') return {};

  const params = new URLSearchParams(window.location.search);
  const name = params.get('name');
  const oracleText = params.get('oracleText');

  return {
    ...(name ? { name } : {}),
    ...(oracleText ? { oracleText } : {}),
  };
};

const initialState: BrowseState = {
  searchParams: parseSearchParams(),
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
  },
});

export const { setSearchName, setOracleText } = browseSlice.actions;

export const selectSearchParams = (state: RootState) => state.browse.searchParams;
export const selectSearchName = (state: RootState) => state.browse.searchParams.name;
export const selectOracleText = (state: RootState) => state.browse.searchParams.oracleText;

export default browseSlice.reducer;