/**
 * useBrowseController
 * =============================================================================
 * The Browse page in MTG Collection Builder can work in **two modes**:
 *
 *   1. **Card mode** – the user scrolls through individual cards.
 *   2. **Set  mode** – the user browses sets (with optional "cost to
 *      complete" information).
 *
 * Regardless of the mode, the page always shows a toolbar with:
 *   • pagination controls (page, page‑size)
 *   • a "grid / table" toggle
 *   • column sorting (in table view)
 *
 * What this hook does, in plain English
 * ------------------------------------
 * 1. **Figure out what the user wants to see** by reading Redux (view type,
 *    search terms, these can come from the URL) and local‑storage (grid vs table).
 * 2. **Download the data** for cards or sets from RTK‑Query.
 * 3. **Warm the cache** for the next page so moving forward feels instant.
 * 4. **Collect every callback** the UI needs (page change, view‑mode change,
 *    sort change, row clicks).
 * 5. **Package all of this into three prop objects**:
 *        • paginationProps   – drives the toolbar
 *        • cardsProps        – drives <CardGrid /> or <CardTable />
 *        • setsProps         – drives <SetGrid />  or <SetTable />
 *
 * The presentational components never touch Redux or the network.  They just
 * take these props and render.
 */
import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { SelectChangeEvent } from '@mui/material';
import {
  useCardData,
  useCompilationHandler,
  useDisplaySettings,
  usePaginationSync,
  usePrefetchNextPage,
  useSetData,
  useSort,
  useViewMode,
} from '@/features/browse/hooks';
import { BrowseControllerResult, CardPayloadProps, SetPayloadProps } from '@/features/browse/types/browseController';
import {
  selectIncludeSubsetsInSets,
  selectSelectedGoalId,
  selectSets,
  selectViewContentType,
  setSortBy,
  setSortOrder,
} from '@/redux/slices/browse';
import { useCardSearchParams, useSetSearchParams } from '@/hooks/useBrowseSearchParams';
import { SortByOption, SortOrderOption } from '@/types/browse';
import {
  usePreferredCardsSortBy,
  usePreferredCardsSortOrder,
  usePreferredSetsSortBy,
  usePreferredSetsSortOrder,
} from '@/hooks/useBrowsePreferences';
import { getCardSortOptions, getSetSortOptions } from '@/features/browse/BrowseSearchForm/utils/sortOptions';
import { usePriceTypeSync } from '@/features/browse/BrowseSearchForm/hooks/usePriceTypeSync';
import { useBrowseUrlContext } from '@/features/browse/BrowseSearchForm/hooks/useBrowseUrlContext';

interface UseBrowseControllerOptions {
  skipCostToComplete?: boolean;
  userId?: number;
  forceView?: 'cards' | 'sets';
  skipCardsUntilReady?: boolean;
  waitForSetFilter?: boolean; // New option to wait for set filter
  waitForInitialLoad?: boolean; // Wait for URL sync to complete
}

export function useBrowseController(options?: UseBrowseControllerOptions): BrowseControllerResult {
  const dispatch = useDispatch();
  const viewFromRedux = useSelector(selectViewContentType) ?? 'cards';
  const currentView = options?.forceView ?? viewFromRedux; // Use forced view if provided
  const cardSearchParams = useCardSearchParams();
  const setSearchParams = useSetSearchParams();
  const includeSubsetsInSets = useSelector(selectIncludeSubsetsInSets);
  const selectedGoalId = useSelector(selectSelectedGoalId);
  const currentSetsFilter = useSelector(selectSets);

  // URL context for determining if we're in collection view
  const { isCollectionPage } = useBrowseUrlContext();

  // localStorage hooks for persisting sort preferences
  const [, setPreferredCardsSortBy] = usePreferredCardsSortBy();
  const [, setPreferredCardsSortOrder] = usePreferredCardsSortOrder();
  const [, setPreferredSetsSortBy] = usePreferredSetsSortBy();
  const [, setPreferredSetsSortOrder] = usePreferredSetsSortOrder();

  // Price type sync for price sort handling
  const { isPriceMismatched, handlePriceSortChange } = usePriceTypeSync();

  // Determine if we should skip cards query
  const shouldSkipCards = currentView !== 'cards' ||
    (options?.skipCardsUntilReady ?? false) ||
    (options?.waitForSetFilter === true && (!currentSetsFilter?.include || currentSetsFilter.include.length === 0));

  // Pagination kept in sync with the URL
  const { pagination, handlePageChange, handlePageSizeChange, initialLoadComplete } = usePaginationSync();

  // "grid / table" preference
  const { viewMode, changeViewMode } = useViewMode(currentView);

  // Sort handlers with localStorage persistence
  const handleSortByChange = useCallback((e: SelectChangeEvent<SortByOption>) => {
    const newSortBy = e.target.value as SortByOption;
    dispatch(setSortBy(newSortBy));
    handlePriceSortChange(newSortBy);

    // Save to localStorage based on current view
    if (currentView === 'cards') {
      setPreferredCardsSortBy(newSortBy);
    } else {
      setPreferredSetsSortBy(newSortBy);
    }
  }, [dispatch, currentView, setPreferredCardsSortBy, setPreferredSetsSortBy, handlePriceSortChange]);

  const handleSortOrderChange = useCallback((e: SelectChangeEvent<SortOrderOption>) => {
    const newSortOrder = e.target.value as SortOrderOption;
    dispatch(setSortOrder(newSortOrder));

    // Save to localStorage based on current view
    if (currentView === 'cards') {
      setPreferredCardsSortOrder(newSortOrder);
    } else {
      setPreferredSetsSortOrder(newSortOrder);
    }
  }, [dispatch, currentView, setPreferredCardsSortOrder, setPreferredSetsSortOrder]);

  // Data for whichever mode is active
  const cardData = useCardData({
    searchParams: cardSearchParams,
    pagination,
    skip: shouldSkipCards,
    userId: options?.userId,
  });

  // Skip sets query until localStorage is ready to prevent double API calls
  const shouldSkipSets = currentView !== 'sets' || 
    !initialLoadComplete ||
    (options?.waitForInitialLoad === true && !initialLoadComplete);

  const setData = useSetData({
    searchParams: setSearchParams,
    pagination,
    skip: shouldSkipSets,
    includeSubsets: includeSubsetsInSets,
    skipCostToComplete: options?.skipCostToComplete,
    userId: options?.userId,
  });

  // Visibility flags and setting groups
  const displaySettings = useDisplaySettings({ view: currentView, viewMode });

  // Column sorting helpers
  const sorting = useSort();

  // Compilation handler for goal compilation states
  const compilationHandler = useCompilationHandler({
    refetch: currentView === 'cards' ? cardData.refetch : setData.refetch,
  });

  usePrefetchNextPage({
    view: currentView,
    pagination,
    cardApiArgs: cardData.apiArgs,
    setApiArgs: setData.apiArgs,
    isLoading: currentView === 'cards' ? cardData.isLoading : setData.isLoading,
  });

  // Get sort options based on view type
  const sortOptions = currentView === 'cards'
    ? getCardSortOptions(isPriceMismatched, isCollectionPage)
    : getSetSortOptions(isCollectionPage);

  return currentView === 'cards'
    ? buildCardPayload({
        currentView: currentView as 'cards' | 'sets',
        viewMode,
        pagination,
        handlePageChange,
        handlePageSizeChange,
        changeViewMode,
        cardData,
        displaySettings,
        sorting,
        initialLoadComplete,
        selectedGoalId,
        userId: options?.userId,
        compilationHandler,
        handleSortByChange,
        handleSortOrderChange,
        sortOptions,
      })
    : buildSetPayload({
        currentView: currentView as 'cards' | 'sets',
        viewMode,
        pagination,
        handlePageChange,
        handlePageSizeChange,
        changeViewMode,
        setData,
        displaySettings,
        sorting,
        initialLoadComplete,
        includeSubsetsInSets,
        selectedGoalId,
        userId: options?.userId,
        compilationHandler,
        handleSortByChange,
        handleSortOrderChange,
        sortOptions,
      });
}

/** Props for Card mode ----------------------------------------------------- */
function buildCardPayload({
  currentView,
  viewMode,
  pagination,
  handlePageChange,
  handlePageSizeChange,
  changeViewMode,
  cardData,
  displaySettings,
  sorting,
  initialLoadComplete,
  selectedGoalId,
  userId,
  compilationHandler,
  handleSortByChange,
  handleSortOrderChange,
  sortOptions,
}: CardPayloadProps & {
  compilationHandler: any;
  handleSortByChange: (e: SelectChangeEvent<SortByOption>) => void;
  handleSortOrderChange: (e: SelectChangeEvent<SortOrderOption>) => void;
  sortOptions: React.ReactNode[];
}) {
  const isApiLoading = cardData.isLoading;
  const isInitialLoading = !initialLoadComplete && !cardData.items.length && !cardData.error;

  return {
    view: currentView,
    viewMode,
    error: cardData.error,

    paginationProps: {
      currentPage: pagination.currentPage,
      totalPages: Math.ceil(cardData.total / pagination.pageSize) || 1,
      pageSize: pagination.pageSize,
      totalItems: cardData.total,
      viewMode: pagination.viewMode,
      onPageChange: handlePageChange,
      onPageSizeChange: handlePageSizeChange,
      onViewModeChange: changeViewMode,
      isLoading: isApiLoading,
      isInitialLoading,
      contentType: currentView,
      settingGroups: displaySettings.settingGroups,
      sortBy: sorting.sortBy,
      sortOrder: sorting.sortOrder,
      onSortByChange: handleSortByChange,
      onSortOrderChange: handleSortOrderChange,
      sortOptions,
    },

    cardsProps: {
      items: cardData.items,
      loading: isApiLoading,
      isFetching: cardData.isFetching,
      viewMode,
      onSort: sorting.handleSort,
      onCardClick: cardData.handleCardClick,
      pageSize: pagination.pageSize,
      sortBy: sorting.sortBy,
      sortOrder: sorting.sortOrder,
      gallerySettings: displaySettings.gallerySettings,
      tableSettings: displaySettings.tableSettings,
      cardDisplaySettings: {
        ...displaySettings.cardDisplaySettings,
        goalProgressIsVisible: !!selectedGoalId && !!userId,
      },
      priceType: displaySettings.priceType,
      username: cardData.username,
      collectionSummary: cardData.collectionSummary,
      goalSummary: cardData.goalSummary,
    },

    /* No setsProps while in Card mode */
    setsProps: {},
  };
}

/** Props for Set mode ------------------------------------------------------ */
function buildSetPayload({
  currentView,
  viewMode,
  pagination,
  handlePageChange,
  handlePageSizeChange,
  changeViewMode,
  setData,
  displaySettings,
  sorting,
  initialLoadComplete,
  includeSubsetsInSets,
  compilationHandler,
  handleSortByChange,
  handleSortOrderChange,
  sortOptions,
}: SetPayloadProps & {
  compilationHandler: any;
  handleSortByChange: (e: SelectChangeEvent<SortByOption>) => void;
  handleSortOrderChange: (e: SelectChangeEvent<SortOrderOption>) => void;
  sortOptions: React.ReactNode[];
}) {
  const isApiLoading = setData.isLoading;
  const isInitialLoading = !initialLoadComplete && !setData.items.length && !setData.error;

  return {
    view: currentView,
    viewMode,
    error: setData.error,

    paginationProps: {
      currentPage: pagination.currentPage,
      totalPages: Math.ceil(setData.total / pagination.pageSize) || 1,
      pageSize: pagination.pageSize,
      totalItems: setData.total,
      viewMode: pagination.viewMode,
      onPageChange: handlePageChange,
      onPageSizeChange: handlePageSizeChange,
      onViewModeChange: changeViewMode,
      isLoading: isApiLoading,
      isInitialLoading,
      contentType: currentView,
      settingGroups: displaySettings.settingGroups,
      sortBy: sorting.sortBy,
      sortOrder: sorting.sortOrder,
      onSortByChange: handleSortByChange,
      onSortOrderChange: handleSortOrderChange,
      sortOptions,
    },

    /* No cardsProps while in Set mode */
    cardsProps: {},

    setsProps: {
      setItems: setData.items,
      isLoading: isApiLoading,
      viewMode,
      onSort: sorting.handleSort,
      onSetClick: setData.handleSetClick,
      pageSize: pagination.pageSize,
      sortBy: sorting.sortBy,
      sortOrder: sorting.sortOrder,
      displaySettings: displaySettings.setDisplaySettings,
      costToCompleteData: setData.costToComplete
        ? // Ensure it has the expected structure with 'sets' property
          setData.costToComplete.sets
          ? setData.costToComplete
          : undefined
        : undefined,
      includeSubsetsInSets,
      username: setData.username,
      collectionSummary: setData.collectionSummary,
      goalSummary: setData.goalSummary,
    },
  };
}
