import { RootState } from '../../rootReducer';
import { ShowGoalsOption } from '@/types/browse';

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
    ? state.browse.cardsSearchParams.pageSize || 20
    : state.browse.setsSearchParams.pageSize || 20;

// Card-specific selectors
export const selectCardSearchParams = (state: RootState) => state.browse.cardsSearchParams;
export const selectCardSearchName = (state: RootState) => state.browse.cardsSearchParams.name;
export const selectOracleText = (state: RootState) => state.browse.cardsSearchParams.oracleText;
export const selectArtist = (state: RootState) => state.browse.cardsSearchParams.artist;
export const selectColors = (state: RootState) => state.browse.cardsSearchParams.colors;
export const selectTypes = (state: RootState) => state.browse.cardsSearchParams.types;
export const selectLayouts = (state: RootState) => state.browse.cardsSearchParams.layouts;
export const selectRarities = (state: RootState) => state.browse.cardsSearchParams.rarities;
export const selectSets = (state: RootState) => state.browse.cardsSearchParams.sets;
export const selectStats = (state: RootState) => state.browse.cardsSearchParams.stats;
export const selectOneResultPerCardName = (state: RootState) => state.browse.cardsSearchParams.oneResultPerCardName;
export const selectIncludeBadDataOnly = (state: RootState) => state.browse.cardsSearchParams.includeBadDataOnly;
export const selectIsReserved = (state: RootState) => state.browse.cardsSearchParams.isReserved;
export const selectCardSortBy = (state: RootState) => state.browse.cardsSearchParams.sortBy;
export const selectCardSortOrder = (state: RootState) => state.browse.cardsSearchParams.sortOrder;
export const selectCardCurrentPage = (state: RootState) => state.browse.cardsSearchParams.currentPage || 1;
export const selectCardPageSize = (state: RootState) => state.browse.cardsSearchParams.pageSize || 20;

// Set-specific selectors
export const selectSetSearchParams = (state: RootState) => state.browse.setsSearchParams;
export const selectSetSearchName = (state: RootState) => state.browse.setsSearchParams.name;
export const selectSetCode = (state: RootState) => state.browse.setsSearchParams.code;
export const selectSetSortBy = (state: RootState) => state.browse.setsSearchParams.sortBy;
export const selectSetSortOrder = (state: RootState) => state.browse.setsSearchParams.sortOrder;
export const selectSetCurrentPage = (state: RootState) => state.browse.setsSearchParams.currentPage || 1;
export const selectSetPageSize = (state: RootState) => state.browse.setsSearchParams.pageSize || 20;
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

// Location selector
export const selectSelectedLocationId = (state: RootState) =>
  state.browse.viewContentType === 'cards'
    ? state.browse.cardsSearchParams.selectedLocationId
    : state.browse.setsSearchParams.selectedLocationId;

export const selectIncludeChildLocations = (state: RootState) =>
  state.browse.viewContentType === 'cards'
    ? state.browse.cardsSearchParams.includeChildLocations ?? false
    : state.browse.setsSearchParams.includeChildLocations ?? false;
