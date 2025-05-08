'use client';

import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { Box, Typography, styled } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { PriceType } from '@/types/pricing';
import { getNextPageParams, useGetCardsPrefetch, useGetCardsQuery, useGetSetsQuery } from '@/api/browse/browseApi';
import { CardModel } from '@/api/browse/types';
import { useGetCostToCompleteQuery } from '@/api/sets/setsApi';
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
import { useSetPriceType } from '@/hooks/useSetPriceType';
import {
  selectCardSearchParams,
  selectIncludeSubsetsInSet,
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

export default function BrowsePage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const viewContentType = useSelector(selectViewContentType);
  const reduxCardSearchParams = useSelector(selectCardSearchParams);
  const reduxSetSearchParams = useSelector(selectSetSearchParams);

  const { pagination, updatePagination } = useBrowseStateSync();
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const [preferredCardViewMode, setPreferredCardViewMode] = useLocalStorage<'grid' | 'table'>(
    'preferredCardViewMode',
    'grid',
  );
  const [preferredSetViewMode, setPreferredSetViewMode] = useLocalStorage<'grid' | 'table'>(
    'preferredSetViewMode',
    'grid',
  );

  const cardApiParams = useCardApiParams(reduxCardSearchParams, pagination);
  const setApiParams = useSetApiParams(reduxSetSearchParams, pagination);
  const nextPageApiParams = useNextPageApiParams(viewContentType, cardApiParams, setApiParams, pagination);

  const queryConfig = {
    refetchOnMountOrArgChange: false,
    refetchOnFocus: false,
    refetchOnReconnect: false,
  };

  const contentTypeForSkip = viewContentType || 'cards';
  const shouldSkipCardsQuery = contentTypeForSkip !== 'cards';
  const shouldSkipSetsQuery = contentTypeForSkip !== 'sets';

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

  const setPriceType = useSetPriceType();

  const includeSubsetsInSet = useSelector(selectIncludeSubsetsInSet);

  const { data: costToCompleteData } = useGetCostToCompleteQuery(
    {
      priceType: setPriceType,
      includeSubsetsInSets: includeSubsetsInSet,
    },
    { ...queryConfig, skip: shouldSkipSetsQuery },
  );

  const isApiLoading = viewContentType === 'cards' ? isCardsApiLoading : isSetsApiLoading;
  const error = viewContentType === 'cards' ? cardsError : setsError;
  const cardItems = useMemo(
    () => (cardsSearchResult?.data ? mapApiCardsToCardItems(cardsSearchResult.data.cards || []) : []),
    [cardsSearchResult?.data],
  );
  const setItems = useMemo(
    () => (setsSearchResult?.data ? mapApiSetsToSetItems(setsSearchResult.data.sets || []) : []),
    [setsSearchResult?.data],
  );

  const totalItems = useTotalItems(viewContentType, cardsSearchResult, setsSearchResult);
  const totalPages = useMemo(() => Math.ceil(totalItems / pagination.pageSize), [totalItems, pagination.pageSize]);

  const isInitialLoading =
    !initialLoadComplete && !(viewContentType === 'cards' ? cardsSearchResult : setsSearchResult)?.data && !error;

  const prefetchNextPage = useGetCardsPrefetch(viewContentType === 'cards' ? 'getCards' : 'getSets');
  usePrefetchNextPage(prefetchNextPage, nextPageApiParams, isApiLoading);

  const setDisplaySettings = useSetDisplaySettings(pagination.viewMode);
  const settingGroups = useCardSetSettingGroups(viewContentType, pagination.viewMode);

  const handleCardClick = useCardClickHandler(router);
  const handleSetClick = useSetClickHandler(router);
  const handlePageChange = usePageChangeHandler(updatePagination);
  const handlePageSizeChange = usePageSizeChangeHandler(updatePagination);
  const handleViewModeChange = useViewModeChangeHandler(
    viewContentType,
    setPreferredCardViewMode,
    setPreferredSetViewMode,
  );

  const reduxCardSearchParamsRef = useRef(reduxCardSearchParams);
  const reduxSetSearchParamsRef = useRef(reduxSetSearchParams);
  useResetPaginationOnParamsChange(
    reduxCardSearchParams,
    reduxCardSearchParamsRef,
    viewContentType,
    'cards',
    pagination,
    updatePagination,
  );
  useResetPaginationOnParamsChange(
    reduxSetSearchParams,
    reduxSetSearchParamsRef,
    viewContentType,
    'sets',
    pagination,
    updatePagination,
  );

  useEffect(() => {
    if (((viewContentType === 'cards' ? cardsSearchResult : setsSearchResult)?.data || error) && !initialLoadComplete) {
      setInitialLoadComplete(true);
    }
  }, [viewContentType, cardsSearchResult?.data, setsSearchResult?.data, error, initialLoadComplete]);

  useEffect(() => {
    document.title = `Browse ${viewContentType === 'cards' ? 'Cards' : 'Sets'} | MTG Collection Builder`;
  }, [viewContentType]);

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

  return (
    <Box>
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Browse' }]} />
      <CardGalleryPagination {...paginationProps} />

      {error && <ErrorDisplay viewContentType={viewContentType} />}

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
          displaySettings={createSetDisplaySettings(setDisplaySettings)}
          costToCompleteData={costToCompleteData?.data || undefined}
        />
      )}

      <CardGalleryPagination {...paginationProps} isOnBottom={true} />
    </Box>
  );
}

interface CardDisplayProps {
  cardItems: ReturnType<typeof mapApiCardsToCardItems>;
  isLoading: boolean;
  viewMode: 'grid' | 'table';
  onCardClick: (cardId: string) => void;
  pageSize: number;
}

const CardDisplay = ({ cardItems, isLoading, viewMode, onCardClick, pageSize }: CardDisplayProps) => {
  const dispatch = useDispatch();
  const currentSortBy = useSelector(selectSortBy) || 'releasedAt';
  const currentSortOrder = useSelector(selectSortOrder) || 'asc';

  const displayCards = generateDisplayCards(cardItems, isLoading, pageSize);

  const gallerySettings = useGallerySettings();
  const currentPriceType = usePriceType();

  const tableSettings = useTableSettings();

  const cardDisplaySettings = {
    nameIsVisible: gallerySettings.nameIsVisible,
    setIsVisible: gallerySettings.setIsVisible,
    priceIsVisible: gallerySettings.priceIsVisible,
  };

  const tableColumns = useCardTableColumns(
    { priceType: currentPriceType, displaySettings: tableSettings },
    currentSortBy,
  );

  const renderCardRow = useCardRowRenderer(currentPriceType, tableSettings, onCardClick);

  const handleSortChange = (columnId: string) => {
    if (!columnId) return;

    const isClickingCurrentSortColumn = columnId === currentSortBy;
    if (isClickingCurrentSortColumn) {
      const newOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
      dispatch(setSortOrder(newOrder));
    } else {
      dispatch(setSortBy(columnId as SortByOption));
      dispatch(setSortOrder('asc'));
    }
  };

  if (viewMode === 'grid') {
    return (
      <CardGridView
        displayCards={displayCards}
        cardDisplaySettings={cardDisplaySettings}
        priceType={currentPriceType}
        onCardClick={onCardClick}
        isLoading={isLoading}
        gallerySettings={gallerySettings}
      />
    );
  }

  return (
    <CardTableView
      displayCards={displayCards}
      tableColumns={tableColumns}
      renderRowContent={renderCardRow}
      isLoading={isLoading}
      sortBy={currentSortBy}
      sortOrder={currentSortOrder}
      onSortChange={handleSortChange}
      onCardClick={onCardClick}
    />
  );
};

interface CardGridViewProps {
  displayCards: any[];
  cardDisplaySettings: {
    nameIsVisible: boolean;
    setIsVisible: boolean;
    priceIsVisible: boolean;
  };
  priceType: PriceType;
  onCardClick: (cardId: string) => void;
  isLoading: boolean;
  gallerySettings: {
    cardsPerRow: number;
    cardSizeMargin: number;
    nameIsVisible: boolean;
    setIsVisible: boolean;
    priceIsVisible: boolean;
  };
}

const CardGridView = ({
  displayCards,
  cardDisplaySettings,
  priceType,
  onCardClick,
  isLoading,
  gallerySettings,
}: CardGridViewProps) => {
  return (
    <VirtualizedGallery
      key="browse-card-gallery"
      items={displayCards}
      renderItem={(card) => (
        <CardItemRenderer card={card} settings={cardDisplaySettings} priceType={priceType} onClick={onCardClick} />
      )}
      isLoading={isLoading}
      columnsPerRow={gallerySettings.cardsPerRow}
      galleryWidth={95}
      horizontalPadding={gallerySettings.cardSizeMargin}
      emptyMessage="No cards found"
      computeItemKey={(index) => displayCards[index]?.id || index}
    />
  );
};

interface CardTableViewProps {
  displayCards: any[];
  tableColumns: any[];
  renderRowContent: any;
  isLoading: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (columnId: string) => void;
  onCardClick: (cardId: string) => void;
}

const CardTableView = ({
  displayCards,
  tableColumns,
  renderRowContent,
  isLoading,
  sortBy,
  sortOrder,
  onSortChange,
  onCardClick,
}: CardTableViewProps) => {
  return (
    <VirtualizedTable
      key="browse-card-table"
      items={displayCards}
      columns={tableColumns}
      renderRowContent={renderRowContent}
      isLoading={isLoading}
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSortChange={onSortChange}
      emptyMessage="No cards found"
      computeItemKey={(index) => displayCards[index]?.id || index}
      onClick={onCardClick}
      getItemId={(card) => card.id}
    />
  );
};

interface ErrorDisplayProps {
  viewContentType: string;
}

const ErrorDisplay = ({ viewContentType }: ErrorDisplayProps) => {
  return (
    <ErrorContainer mb={3}>
      <ErrorIcon />
      <ErrorTitle variant="h6" gutterBottom fontWeight="bold" color="error.main">
        Unable to load {viewContentType}
      </ErrorTitle>
      <Typography color="text.primary">There was a problem fetching data. Please try again later.</Typography>
    </ErrorContainer>
  );
};

const ErrorContainer = styled(Box)({
  textAlign: 'center',
  padding: 24,
  borderRadius: 4,
  border: '1px solid',
  borderColor: 'rgba(211, 47, 47, 0.3)',
  backgroundColor: 'rgba(211, 47, 47, 0.03)',
  maxWidth: '800px',
  margin: '0 auto',
  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
});

const ErrorIcon = styled(ErrorOutlineIcon)({
  fontSize: 40,
  color: 'error.main',
  marginBottom: 8,
});

const ErrorTitle = styled(Typography)({
  fontWeight: 'bold',
});

function useCardApiParams(reduxCardSearchParams: any, pagination: any) {
  return useMemo(() => {
    const params = buildApiParamsFromSearchParams(reduxCardSearchParams, 'cards');
    return {
      ...params,
      limit: pagination.pageSize,
      offset: (pagination.currentPage - 1) * pagination.pageSize,
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
}

function useSetApiParams(reduxSetSearchParams: any, pagination: any) {
  return useMemo(() => {
    const params = buildApiParamsFromSearchParams(reduxSetSearchParams, 'sets');
    return {
      ...params,
      limit: pagination.pageSize,
      offset: (pagination.currentPage - 1) * pagination.pageSize,
      sortBy: params.sortBy || 'releasedAt',
      sortDirection: params.sortDirection || ('asc' as const),
      select: [
        'name',
        'slug',
        'code',
        'setType',
        'category',
        'releasedAt',
        'cardCount',
        'isDraftable',
        'sealedProductUrl',
      ],
    };
  }, [reduxSetSearchParams, pagination]);
}

function useNextPageApiParams(viewContentType: string, cardApiParams: any, setApiParams: any, pagination: any) {
  return useMemo(() => {
    if (viewContentType === 'cards' && pagination.currentPage >= 1) {
      return getNextPageParams(cardApiParams, pagination.currentPage, pagination.pageSize);
    } else if (viewContentType === 'sets' && pagination.currentPage >= 1) {
      return getNextPageParams(setApiParams, pagination.currentPage, pagination.pageSize);
    }
    return null;
  }, [viewContentType, cardApiParams, setApiParams, pagination]);
}

function useTotalItems(viewContentType: string, cardsSearchResult: any, setsSearchResult: any) {
  return useMemo(() => {
    if (viewContentType === 'cards') {
      return cardsSearchResult?.data?.totalCount || 0;
    } else {
      return setsSearchResult?.data?.totalCount || 0;
    }
  }, [viewContentType, cardsSearchResult?.data?.totalCount, setsSearchResult?.data?.totalCount]);
}

function usePrefetchNextPage(prefetchNextPage: any, nextPageApiParams: any, isApiLoading: boolean) {
  useEffect(() => {
    if (!nextPageApiParams || isApiLoading) return;

    const prefetchTimer = setTimeout(() => {
      prefetchNextPage(nextPageApiParams, { ifOlderThan: 300 });
    }, 1000);

    return () => clearTimeout(prefetchTimer);
  }, [prefetchNextPage, nextPageApiParams, isApiLoading]);
}

function useCardClickHandler(router: any) {
  return useCallback(
    (cardId: string) => {
      router.push(`/browse/cards/${cardId}`);
    },
    [router],
  );
}

function useSetClickHandler(router: any) {
  return useCallback(
    (set: Set) => {
      router.push(`/browse?includeSets=${set.id}`);
    },
    [router],
  );
}

function usePageChangeHandler(updatePagination: (params: any) => void) {
  return useCallback(
    (page: number) => {
      const validPage = Math.max(page, 1);
      updatePagination({ currentPage: validPage });
    },
    [updatePagination],
  );
}

function usePageSizeChangeHandler(updatePagination: (params: any) => void) {
  return useCallback(
    (size: number) => {
      const limitedSize = Math.min(Math.max(size, 1), 500);
      updatePagination({ pageSize: limitedSize, currentPage: 1 });
    },
    [updatePagination],
  );
}

function useViewModeChangeHandler(
  viewContentType: string,
  setPreferredCardViewMode: (mode: 'grid' | 'table') => void,
  setPreferredSetViewMode: (mode: 'grid' | 'table') => void,
) {
  return useCallback(
    (mode: 'grid' | 'table') => {
      if (viewContentType === 'cards') {
        setPreferredCardViewMode(mode);
      } else {
        setPreferredSetViewMode(mode);
      }
    },
    [viewContentType, setPreferredCardViewMode, setPreferredSetViewMode],
  );
}

function useResetPaginationOnParamsChange(
  currentParams: any,
  paramsRef: any,
  viewContentType: string,
  contentType: string,
  pagination: any,
  updatePagination: (params: any) => void,
) {
  useEffect(() => {
    // Skip on first render
    if (paramsRef.current === currentParams) {
      paramsRef.current = currentParams;
      return;
    }

    const filteredCurrentParams = filterOutPaginationParams(currentParams);
    const filteredPrevParams = filterOutPaginationParams(paramsRef.current);

    const hasSearchParamsChanged = JSON.stringify(filteredPrevParams) !== JSON.stringify(filteredCurrentParams);

    if (hasSearchParamsChanged && viewContentType === contentType && pagination.currentPage !== 1) {
      updatePagination({ currentPage: 1 });
    }

    paramsRef.current = currentParams;
  }, [currentParams, viewContentType, pagination.currentPage, updatePagination, contentType]);
}

function useGallerySettings() {
  const [cardsPerRow] = useLocalStorage<number>('cardsPerRow', 4);
  const [cardSizeMargin] = useLocalStorage('cardSizeMargin', 0);
  const [nameIsVisible] = useLocalStorage('cardNameIsVisible', true);
  const [setIsVisible] = useLocalStorage('cardSetIsVisible', true);
  const [priceIsVisible] = useLocalStorage('cardPriceIsVisible', true);

  return {
    cardsPerRow,
    cardSizeMargin,
    nameIsVisible,
    setIsVisible,
    priceIsVisible,
  };
}

function useTableSettings() {
  const [setIsVisible] = useLocalStorage('tableSetIsVisible', true);
  const [collectorNumberIsVisible] = useLocalStorage('tableCollectorNumberIsVisible', true);
  const [mtgcbNumberIsVisible] = useLocalStorage('tableMtgcbNumberIsVisible', false);
  const [rarityIsVisible] = useLocalStorage('tableRarityIsVisible', true);
  const [typeIsVisible] = useLocalStorage('tableTypeIsVisible', false);
  const [artistIsVisible] = useLocalStorage('tableArtistIsVisible', false);
  const [manaCostIsVisible] = useLocalStorage('tableManaCostIsVisible', true);
  const [powerIsVisible] = useLocalStorage('tablePowerIsVisible', false);
  const [toughnessIsVisible] = useLocalStorage('tableToughnessIsVisible', false);
  const [loyaltyIsVisible] = useLocalStorage('tableLoyaltyIsVisible', false);
  const [priceIsVisible] = useLocalStorage('tablePriceIsVisible', true);

  return {
    setIsVisible,
    collectorNumberIsVisible,
    mtgcbNumberIsVisible,
    rarityIsVisible,
    typeIsVisible,
    artistIsVisible,
    manaCostIsVisible,
    powerIsVisible,
    toughnessIsVisible,
    loyaltyIsVisible,
    priceIsVisible,
  };
}

function filterOutPaginationParams(params: any) {
  const { currentPage, pageSize, pagination, ...filteredParams } = params;
  return filteredParams;
}

function generateDisplayCards(cardItems: any[], isLoading: boolean, pageSize: number) {
  if (!isLoading) return cardItems;

  return Array(pageSize)
    .fill(0)
    .map((_, index) => ({
      id: `skeleton-${index}`,
      name: '',
      setName: '',
      collectorNumber: '',
      rarity: '',
      isLoadingSkeleton: true,
    }));
}

function createSetDisplaySettings(setDisplaySettings: any) {
  return {
    grid: {
      nameIsVisible: setDisplaySettings.nameIsVisible,
      codeIsVisible: setDisplaySettings.codeIsVisible,
      releaseDateIsVisible: setDisplaySettings.releaseDateIsVisible,
      typeIsVisible: setDisplaySettings.typeIsVisible,
      categoryIsVisible: setDisplaySettings.categoryIsVisible,
      cardCountIsVisible: setDisplaySettings.cardCountIsVisible,
      costsIsVisible: setDisplaySettings.costsIsVisible,
    },
    table: {
      codeIsVisible: setDisplaySettings.codeIsVisible,
      cardCountIsVisible: setDisplaySettings.cardCountIsVisible,
      releaseDateIsVisible: setDisplaySettings.releaseDateIsVisible,
      typeIsVisible: setDisplaySettings.typeIsVisible,
      categoryIsVisible: setDisplaySettings.categoryIsVisible,
      isDraftableIsVisible: setDisplaySettings.isDraftableIsVisible,
    },
  };
}
