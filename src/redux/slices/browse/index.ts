/**
 * Browse state management - Entry point
 *
 * This index file re-exports everything from the browse module for backward compatibility.
 * Existing imports from '@/redux/slices/browseSlice' will continue to work.
 */

// Export the reducer as default
export { default } from './browseSlice';

// Re-export all actions from browseSlice
export {
  browseSlice,
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
} from './browseSlice';

// Re-export all selectors
export {
  selectSearchParams,
  selectSearchName,
  selectSortBy,
  selectSortOrder,
  selectCurrentPage,
  selectPageSize,
  selectCardSearchParams,
  selectCardSearchName,
  selectOracleText,
  selectArtist,
  selectColors,
  selectTypes,
  selectLayouts,
  selectRarities,
  selectSets,
  selectStats,
  selectOneResultPerCardName,
  selectIncludeBadDataOnly,
  selectIsReserved,
  selectCardSortBy,
  selectCardSortOrder,
  selectCardCurrentPage,
  selectCardPageSize,
  selectSetSearchParams,
  selectSetSearchName,
  selectSetCode,
  selectSetSortBy,
  selectSetSortOrder,
  selectSetCurrentPage,
  selectSetPageSize,
  selectSetCategories,
  selectSetTypes,
  selectShowSubsets,
  selectIncludeSubsetsInSets,
  selectCompletionStatus,
  selectViewContentType,
  selectSelectedGoalId,
  selectShowGoals,
  selectSelectedLocationId,
  selectIncludeChildLocations,
} from './selectors';

// Re-export preferences helper functions
export { getCardsPreferences, getSetsPreferences, getPreferencesForView } from './preferences';
