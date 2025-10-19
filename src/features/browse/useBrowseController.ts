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
import { useSelector } from 'react-redux';
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
  selectCardSearchParams,
  selectIncludeSubsetsInSets,
  selectSelectedGoalId,
  selectSetSearchParams,
  selectSets,
  selectViewContentType,
} from '@/redux/slices/browse';

interface UseBrowseControllerOptions {
  skipCostToComplete?: boolean;
  userId?: number;
  forceView?: 'cards' | 'sets';
  skipCardsUntilReady?: boolean;
  waitForSetFilter?: boolean; // New option to wait for set filter
  waitForInitialLoad?: boolean; // Wait for URL sync to complete
}

export function useBrowseController(options?: UseBrowseControllerOptions): BrowseControllerResult {
  const viewFromRedux = useSelector(selectViewContentType) ?? 'cards';
  const currentView = options?.forceView ?? viewFromRedux; // Use forced view if provided
  const cardSearchParams = useSelector(selectCardSearchParams);
  const setSearchParams = useSelector(selectSetSearchParams);
  const includeSubsetsInSets = useSelector(selectIncludeSubsetsInSets);
  const selectedGoalId = useSelector(selectSelectedGoalId);
  const currentSetsFilter = useSelector(selectSets);
  
  // Determine if we should skip cards query
  const shouldSkipCards = currentView !== 'cards' ||
    (options?.skipCardsUntilReady ?? false) ||
    (options?.waitForSetFilter === true && (!currentSetsFilter?.include || currentSetsFilter.include.length === 0));

  // Pagination kept in sync with the URL
  const { pagination, handlePageChange, handlePageSizeChange, initialLoadComplete } = usePaginationSync();

  // "grid / table" preference
  const { viewMode, changeViewMode } = useViewMode(currentView);

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
}: CardPayloadProps & { compilationHandler: any }) {
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
}: SetPayloadProps & { compilationHandler: any }) {
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
