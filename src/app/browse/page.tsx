'use client';

import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { Box, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getNextPageParams,
  useGetCardsPrefetch,
  useGetCardsQuery,
  useGetSetsQuery,
} from '@/api/browse/browseApi';
import { CardModel } from '@/api/browse/types';
import CardItemRenderer from '@/components/cards/CardItemRenderer';
import { useCardRowRenderer, useCardTableColumns } from '@/components/cards/CardTableRenderer';
import VirtualizedGallery from '@/components/common/VirtualizedGallery';
import VirtualizedTable from '@/components/common/VirtualizedTable';
import { CardGalleryPagination } from '@/components/pagination';
import SetDisplay from '@/components/sets/SetDisplay';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { mapApiCardsToCardItems, mapApiSetsToSetItems } from '@/features/browse/mappers';
import { useBrowseStateSync } from '@/hooks/useBrowseStateSync';
import { useCardSetSettingGroups } from '@/hooks/useCardSetSettingGroups';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { usePriceType } from '@/hooks/usePriceType';
import { useSetDisplaySettings } from '@/hooks/useSetDisplaySettings';
import {
  selectCardSearchParams,
  selectSetSearchParams,
  selectSortBy,
  selectSortOrder,
  selectViewContentType,
  setSortBy,
  setSortOrder,
} from '@/redux/slices/browseSlice';
import { SortByOption } from '@/types/browse';
import { Set } from '@/types/sets';
import { buildApiParamsFromSearchParams } from '@/utils/searchParamsConverter';

interface CardDisplayProps {
  cardItems: ReturnType<typeof mapApiCardsToCardItems>;
  isLoading: boolean;
  viewMode: 'grid' | 'table';
  onCardClick: (cardId: string) => void;
  pageSize: number;
}

const CardDisplay = ({
  cardItems,
  isLoading,
  viewMode,
  onCardClick,
  pageSize,
}: CardDisplayProps) => {
  const dispatch = useDispatch();
  const currentSortBy = useSelector(selectSortBy) || 'releasedAt';
  const currentSortOrder = useSelector(selectSortOrder) || 'asc';

  const displayCards = isLoading
    ? Array(pageSize)
        .fill(0)
        .map((_, index) => ({
          id: `skeleton-${index}`,
          name: '',
          setName: '',
          collectorNumber: '',
          rarity: '',
          isLoadingSkeleton: true,
        }))
    : cardItems;

  // Gallery settings
  const [cardsPerRow] = useLocalStorage<number>('cardsPerRow', 4);
  const [cardSizeMargin] = useLocalStorage('cardSizeMargin', 0);
  const [nameIsVisible] = useLocalStorage('cardNameIsVisible', true);
  const [setIsVisible] = useLocalStorage('cardSetIsVisible', true);
  const [priceIsVisible] = useLocalStorage('cardPriceIsVisible', true);
  const currentPriceType = usePriceType();

  // Table settings
  const [tableSetIsVisible] = useLocalStorage('tableSetIsVisible', true);
  const [tableCollectorNumberIsVisible] = useLocalStorage('tableCollectorNumberIsVisible', true);
  const [tableMtgcbNumberIsVisible] = useLocalStorage('tableMtgcbNumberIsVisible', false);
  const [tableRarityIsVisible] = useLocalStorage('tableRarityIsVisible', true);
  const [tableTypeIsVisible] = useLocalStorage('tableTypeIsVisible', false);
  const [tableArtistIsVisible] = useLocalStorage('tableArtistIsVisible', false);
  const [tableManaCostIsVisible] = useLocalStorage('tableManaCostIsVisible', true);
  const [tablePowerIsVisible] = useLocalStorage('tablePowerIsVisible', false);
  const [tableToughnessIsVisible] = useLocalStorage('tableToughnessIsVisible', false);
  const [tableLoyaltyIsVisible] = useLocalStorage('tableLoyaltyIsVisible', false);
  const [tablePriceIsVisible] = useLocalStorage('tablePriceIsVisible', true);

  // Card table settings
  const tableDisplaySettings = {
    setIsVisible: tableSetIsVisible,
    collectorNumberIsVisible: tableCollectorNumberIsVisible,
    mtgcbNumberIsVisible: tableMtgcbNumberIsVisible,
    rarityIsVisible: tableRarityIsVisible,
    typeIsVisible: tableTypeIsVisible,
    artistIsVisible: tableArtistIsVisible,
    manaCostIsVisible: tableManaCostIsVisible,
    powerIsVisible: tablePowerIsVisible,
    toughnessIsVisible: tableToughnessIsVisible,
    loyaltyIsVisible: tableLoyaltyIsVisible,
    priceIsVisible: tablePriceIsVisible,
  };

  // Card gallery settings
  const cardDisplaySettings = {
    nameIsVisible,
    setIsVisible,
    priceIsVisible,
  };

  // Table column configuration
  const tableColumns = useCardTableColumns(
    { priceType: currentPriceType, displaySettings: tableDisplaySettings },
    currentSortBy,
  );

  // Card row renderer
  const renderCardRow = useCardRowRenderer(currentPriceType, tableDisplaySettings, onCardClick);

  // Handle sort change
  const handleSortChange = (columnId: string) => {
    if (columnId) {
      const isClickingCurrentSortColumn = columnId === currentSortBy;
      if (isClickingCurrentSortColumn) {
        const newOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
        dispatch(setSortOrder(newOrder));
      } else {
        dispatch(setSortBy(columnId as SortByOption));
        dispatch(setSortOrder('asc'));
      }
    }
  };

  if (viewMode === 'grid') {
    return (
      <VirtualizedGallery
        key="browse-card-gallery"
        items={displayCards}
        renderItem={(card, index) => (
          <CardItemRenderer
            card={card}
            settings={cardDisplaySettings}
            priceType={currentPriceType}
            onClick={onCardClick}
          />
        )}
        isLoading={isLoading}
        columnsPerRow={cardsPerRow}
        galleryWidth={95}
        horizontalPadding={cardSizeMargin}
        emptyMessage="No cards found"
        computeItemKey={(index) => displayCards[index]?.id || index}
      />
    );
  }

  // Table view
  return (
    <VirtualizedTable
      key="browse-card-table"
      items={displayCards}
      columns={tableColumns}
      renderRowContent={renderCardRow}
      isLoading={isLoading}
      sortBy={currentSortBy}
      sortOrder={currentSortOrder}
      onSortChange={handleSortChange}
      emptyMessage="No cards found"
      computeItemKey={(index) => displayCards[index]?.id || index}
      onClick={onCardClick}
      getItemId={(card) => card.id}
    />
  );
};

export default function BrowsePage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const viewContentType = useSelector(selectViewContentType);
  const reduxCardSearchParams = useSelector(selectCardSearchParams);
  const reduxSetSearchParams = useSelector(selectSetSearchParams);

  const { pagination, updatePagination } = useBrowseStateSync();

  const [preferredCardViewMode, setPreferredCardViewMode] = useLocalStorage<'grid' | 'table'>(
    'preferredCardViewMode',
    'grid',
  );
  const [preferredSetViewMode, setPreferredSetViewMode] = useLocalStorage<'grid' | 'table'>(
    'preferredSetViewMode',
    'grid',
  );

  // Card API params
  const cardApiParams = useMemo(() => {
    const params = buildApiParamsFromSearchParams(reduxCardSearchParams, 'cards');
    return {
      ...params,
      limit: pagination.pageSize,
      offset: (pagination.currentPage - 1) * pagination.pageSize,
      // Use the sort parameters from the redux store if provided, otherwise use defaults
      sortBy: params.sortBy || 'releasedAt',
      sortDirection: params.sortDirection || ('asc' as const),
      select: [
        'name',
        'setId',
        'setName',
        'tcgplayerId',
        'market',
        'low',
        'average',
        'high',
        'foil',
        'collectorNumber',
        'mtgcbCollectorNumber',
        'rarity',
        'rarityNumeric',
        'type',
        'artist',
        'manaCost',
        'convertedManaCost',
        'powerNumeric',
        'toughnessNumeric',
        'loyaltyNumeric',
        'releaseDate',
      ] as Array<keyof CardModel>,
    };
  }, [reduxCardSearchParams, pagination]);

  // Set API params
  const setApiParams = useMemo(() => {
    const params = buildApiParamsFromSearchParams(reduxSetSearchParams, 'sets');
    return {
      ...params,
      limit: pagination.pageSize,
      offset: (pagination.currentPage - 1) * pagination.pageSize,
      // Use the sort parameters from the redux store if provided, otherwise use defaults
      sortBy: params.sortBy || 'name',
      sortDirection: params.sortDirection || ('asc' as const),
      select: [
        'name',
        'slug',
        'code',
        'setType',
        'category',
        'releasedAt',
        'cardCount',
        'iconUrl',
        'isDraftable',
      ],
    };
  }, [reduxSetSearchParams, pagination]);

  const nextPageApiParams = useMemo(() => {
    if (viewContentType === 'cards' && pagination.currentPage >= 1) {
      return getNextPageParams(cardApiParams, pagination.currentPage, pagination.pageSize);
    } else if (viewContentType === 'sets' && pagination.currentPage >= 1) {
      return getNextPageParams(setApiParams, pagination.currentPage, pagination.pageSize);
    }
    return null;
  }, [viewContentType, cardApiParams, setApiParams, pagination]);

  const queryConfig = {
    refetchOnMountOrArgChange: false,
    refetchOnFocus: false,
    refetchOnReconnect: false,
  };

  // Explicitly calculate skip params with protection against undefined values
  const contentTypeForSkip = viewContentType || 'cards'; // Default to cards if undefined
  const shouldSkipCardsQuery = contentTypeForSkip !== 'cards';
  const shouldSkipSetsQuery = contentTypeForSkip !== 'sets';

  // Fetch cards or sets based on content type
  const {
    data: cardsSearchResult,
    isFetching: isCardsApiLoading,
    error: cardsError,
  } = useGetCardsQuery(cardApiParams, {
    ...queryConfig,
    skip: shouldSkipCardsQuery,
  });

  const {
    data: setsSearchResult,
    isFetching: isSetsApiLoading,
    error: setsError,
  } = useGetSetsQuery(setApiParams, {
    ...queryConfig,
    skip: shouldSkipSetsQuery,
  });

  const isApiLoading = viewContentType === 'cards' ? isCardsApiLoading : isSetsApiLoading;
  const error = viewContentType === 'cards' ? cardsError : setsError;

  const prefetchNextPage = useGetCardsPrefetch(
    viewContentType === 'cards' ? 'getCards' : 'getSets',
  );

  useEffect(() => {
    if (!nextPageApiParams || isApiLoading) return;

    const prefetchTimer = setTimeout(() => {
      prefetchNextPage(nextPageApiParams, { ifOlderThan: 300 });
    }, 1000);

    return () => clearTimeout(prefetchTimer);
  }, [prefetchNextPage, nextPageApiParams, isApiLoading]);

  // Reset pagination to page 1 when search parameters change
  const reduxCardSearchParamsRef = useRef(reduxCardSearchParams);
  const reduxSetSearchParamsRef = useRef(reduxSetSearchParams);

  useEffect(() => {
    // Skip on first render
    if (reduxCardSearchParamsRef.current === reduxCardSearchParams) {
      reduxCardSearchParamsRef.current = reduxCardSearchParams;
      return;
    }

    const filterOutPaginationParams = (params: any) => {
      const { currentPage, pageSize, pagination, ...filteredParams } = params;
      return filteredParams;
    };

    // Only reset pagination if search params (not pagination params) have changed
    const filteredCurrentParams = filterOutPaginationParams(reduxCardSearchParams);
    const filteredPrevParams = filterOutPaginationParams(reduxCardSearchParamsRef.current);

    const hasSearchParamsChanged =
      JSON.stringify(filteredPrevParams) !== JSON.stringify(filteredCurrentParams);

    if (hasSearchParamsChanged && viewContentType === 'cards' && pagination.currentPage !== 1) {
      console.log('Resetting cards pagination due to search params change');
      updatePagination({ currentPage: 1 });
    }

    reduxCardSearchParamsRef.current = reduxCardSearchParams;
  }, [reduxCardSearchParams, viewContentType, pagination.currentPage, updatePagination]);

  useEffect(() => {
    // Skip on first render
    if (reduxSetSearchParamsRef.current === reduxSetSearchParams) {
      reduxSetSearchParamsRef.current = reduxSetSearchParams;
      return;
    }

    const filterOutPaginationParams = (params: any) => {
      const { currentPage, pageSize, pagination, ...filteredParams } = params;
      return filteredParams;
    };

    // Only reset pagination if search params (not pagination params) have changed
    const filteredCurrentParams = filterOutPaginationParams(reduxSetSearchParams);
    const filteredPrevParams = filterOutPaginationParams(reduxSetSearchParamsRef.current);

    const hasSearchParamsChanged =
      JSON.stringify(filteredPrevParams) !== JSON.stringify(filteredCurrentParams);

    if (hasSearchParamsChanged && viewContentType === 'sets' && pagination.currentPage !== 1) {
      console.log('Resetting sets pagination due to search params change');
      updatePagination({ currentPage: 1 });
    }

    reduxSetSearchParamsRef.current = reduxSetSearchParams;
  }, [reduxSetSearchParams, viewContentType, pagination.currentPage, updatePagination]);

  const handlePageChange = useCallback(
    (page: number) => {
      const validPage = Math.max(page, 1);
      updatePagination({ currentPage: validPage });
    },
    [updatePagination],
  );

  const handlePageSizeChange = useCallback(
    (size: number) => {
      const limitedSize = Math.min(Math.max(size, 1), 500);
      updatePagination({ pageSize: limitedSize, currentPage: 1 });
    },
    [updatePagination],
  );

  // Handle view mode change based on content type
  const handleViewModeChange = useCallback(
    (mode: 'grid' | 'table') => {
      if (viewContentType === 'cards') {
        setPreferredCardViewMode(mode);
      } else {
        setPreferredSetViewMode(mode);
      }
    },
    [viewContentType, setPreferredCardViewMode, setPreferredSetViewMode],
  );

  const handleCardClick = useCallback(
    (cardId: string) => {
      router.push(`/browse/cards/${cardId}`);
    },
    [router],
  );

  const handleSetClick = useCallback(
    (set: Set) => {
      // Navigate to cards filtered by this set
      router.push(`/browse?includeSets=${set.id}`);
    },
    [router],
  );

  // Map API data to component props
  const cardItems = useMemo(
    () =>
      cardsSearchResult?.data ? mapApiCardsToCardItems(cardsSearchResult.data.cards || []) : [],
    [cardsSearchResult?.data],
  );

  const setItems = useMemo(
    () => (setsSearchResult?.data ? mapApiSetsToSetItems(setsSearchResult.data.sets || []) : []),
    [setsSearchResult?.data],
  );

  const totalItems = useMemo(() => {
    if (viewContentType === 'cards') {
      return cardsSearchResult?.data?.totalCount || 0;
    } else {
      return setsSearchResult?.data?.totalCount || 0;
    }
  }, [viewContentType, cardsSearchResult?.data?.totalCount, setsSearchResult?.data?.totalCount]);

  const totalPages = useMemo(
    () => Math.ceil(totalItems / pagination.pageSize),
    [totalItems, pagination.pageSize],
  );

  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const isInitialLoading =
    !initialLoadComplete &&
    !(viewContentType === 'cards' ? cardsSearchResult : setsSearchResult)?.data &&
    !error;

  useEffect(() => {
    if (
      ((viewContentType === 'cards' ? cardsSearchResult : setsSearchResult)?.data || error) &&
      !initialLoadComplete
    ) {
      setInitialLoadComplete(true);
    }
  }, [
    viewContentType,
    cardsSearchResult?.data,
    setsSearchResult?.data,
    error,
    initialLoadComplete,
  ]);

  // Get display settings for sets
  const setDisplaySettings = useSetDisplaySettings(pagination.viewMode);

  // Get setting groups based on content type and view mode
  const settingGroups = useCardSetSettingGroups(viewContentType, pagination.viewMode);

  const paginationProps = {
    currentPage: pagination.currentPage,
    totalPages: totalPages || 1,
    pageSize: pagination.pageSize,
    totalItems,
    viewMode: pagination.viewMode,
    onPageChange: handlePageChange,
    onPageSizeChange: handlePageSizeChange,
    onViewModeChange: handleViewModeChange,
    isLoading: isApiLoading,
    isInitialLoading: isInitialLoading,
    contentType: viewContentType,
    settingGroups,
  };

  // Update page title to reflect content type
  useEffect(() => {
    document.title = `Browse ${viewContentType === 'cards' ? 'Cards' : 'Sets'} | MTG Collection Builder`;
  }, [viewContentType]);

  return (
    <Box>
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Browse' }]} />

      {/* Settings are moved to CardGalleryPagination (which needs to be renamed) */}

      <CardGalleryPagination {...paginationProps} />

      {error && (
        <Box
          mb={3}
          sx={{
            textAlign: 'center',
            p: 3,
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'rgba(211, 47, 47, 0.3)',
            bgcolor: 'rgba(211, 47, 47, 0.03)',
            maxWidth: '800px',
            mx: 'auto',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          }}
        >
          <ErrorOutlineIcon
            sx={{
              fontSize: 40,
              color: 'error.main',
              mb: 1,
            }}
          />
          <Typography variant="h6" gutterBottom fontWeight="bold" color="error.main">
            Unable to load {viewContentType}
          </Typography>
          <Typography color="text.primary">
            There was a problem fetching data. Please try again later.
          </Typography>
        </Box>
      )}

      {viewContentType === 'cards' ? (
        <CardDisplay
          cardItems={cardItems}
          isLoading={isCardsApiLoading}
          viewMode={pagination.viewMode}
          onCardClick={handleCardClick}
          pageSize={pagination.pageSize}
        />
      ) : (
        <SetDisplay
          setItems={setItems}
          isLoading={isSetsApiLoading}
          viewMode={pagination.viewMode}
          onSetClick={handleSetClick}
          pageSize={pagination.pageSize}
          displaySettings={{
            grid: {
              nameIsVisible: setDisplaySettings.nameIsVisible,
              codeIsVisible: setDisplaySettings.codeIsVisible,
              releaseDateIsVisible: setDisplaySettings.releaseDateIsVisible,
              cardCountIsVisible: setDisplaySettings.cardCountIsVisible,
            },
            table: {
              codeIsVisible: setDisplaySettings.codeIsVisible,
              cardCountIsVisible: setDisplaySettings.cardCountIsVisible,
              releaseDateIsVisible: setDisplaySettings.releaseDateIsVisible,
              typeIsVisible: setDisplaySettings.typeIsVisible,
              categoryIsVisible: setDisplaySettings.categoryIsVisible,
              isDraftableIsVisible: setDisplaySettings.isDraftableIsVisible,
            },
          }}
        />
      )}

      <CardGalleryPagination {...paginationProps} isOnBottom={true} />
    </Box>
  );
}
