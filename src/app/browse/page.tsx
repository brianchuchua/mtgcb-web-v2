'use client';

import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { Box, Typography } from '@mui/material';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getNextPageParams, useGetCardsPrefetch, useGetCardsQuery, useGetSetsQuery } from '@/api/browse/browseApi';
import { CardModel } from '@/api/browse/types';
import CardItemRenderer from '@/components/cards/CardItemRenderer';
import CardTable from '@/components/cards/CardTable';
import { useCardRowRenderer, useCardTableColumns } from '@/components/cards/CardTableRenderer';
import VirtualizedGallery from '@/components/common/VirtualizedGallery';
import VirtualizedTable from '@/components/common/VirtualizedTable';
import { CardGalleryPagination } from '@/components/pagination';
import SetDisplay from '@/components/sets/SetDisplay';
import SetSettingsPanel from '@/components/sets/SetSettingsPanel';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { mapApiCardsToCardItems, mapApiSetsToSetItems } from '@/features/browse/mappers';
import { useCardSetSettingGroups } from '@/hooks/useCardSetSettingGroups';
import { useInitializeBrowseFromUrl } from '@/hooks/useInitializeBrowseFromUrl';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { usePriceType } from '@/hooks/usePriceType';
import { useSetDisplaySettings } from '@/hooks/useSetDisplaySettings';
import {
  selectSearchParams,
  selectSortBy,
  selectSortOrder,
  selectViewContentType,
  setSortBy,
  setSortOrder,
} from '@/redux/slices/browseSlice';
import { Set } from '@/types/sets';
import { BrowsePagination, SortByOption } from '@/types/browse';
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
  const pathname = usePathname();
  const urlSearchParams = useSearchParams();
  const reduxSearchParams = useSelector(selectSearchParams);
  const dispatch = useDispatch();

  const viewContentType = useSelector(selectViewContentType);
  const [preferredViewMode, setPreferredViewMode] = useLocalStorage<'grid' | 'table'>(
    'preferredViewMode',
    'grid',
  );

  const [pagination, setPagination] = useState<BrowsePagination>({
    currentPage: Math.max(parseInt(urlSearchParams.get('page') || '1', 10), 1),
    pageSize: Math.min(Math.max(parseInt(urlSearchParams.get('pageSize') || '24', 10), 1), 500),
    viewMode: preferredViewMode,
  });

  useEffect(() => {
    if (pagination.viewMode !== preferredViewMode) {
      setPagination((prev) => ({
        ...prev,
        viewMode: preferredViewMode,
      }));
    }
  }, [preferredViewMode, pagination.viewMode]);

  useInitializeBrowseFromUrl();

  // Card API params
  const cardApiParams = useMemo(() => {
    const params = buildApiParamsFromSearchParams(reduxSearchParams, 'cards');
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
  }, [reduxSearchParams, pagination]);

  // Set API params
  const setApiParams = useMemo(() => {
    const params = buildApiParamsFromSearchParams(reduxSearchParams, 'sets');
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
  }, [reduxSearchParams, pagination]);

  const nextPageApiParams = useMemo(
    () =>
      pagination.currentPage >= 1
        ? getNextPageParams(
            viewContentType === 'cards' ? cardApiParams : setApiParams,
            pagination.currentPage,
            pagination.pageSize
          )
        : null,
    [viewContentType, cardApiParams, setApiParams, pagination.currentPage, pagination.pageSize],
  );

  const queryConfig = {
    refetchOnMountOrArgChange: false,
    refetchOnFocus: false,
    refetchOnReconnect: false,
  };

  // Fetch cards or sets based on content type
  const {
    data: cardsSearchResult,
    isFetching: isCardsApiLoading,
    error: cardsError,
  } = useGetCardsQuery(cardApiParams, { 
    ...queryConfig,
    skip: viewContentType !== 'cards',
  });

  const {
    data: setsSearchResult,
    isFetching: isSetsApiLoading,
    error: setsError,
  } = useGetSetsQuery(setApiParams, { 
    ...queryConfig,
    skip: viewContentType !== 'sets',
  });

  const isApiLoading = viewContentType === 'cards' ? isCardsApiLoading : isSetsApiLoading;
  const error = viewContentType === 'cards' ? cardsError : setsError;

  const prefetchNextPage = useGetCardsPrefetch(viewContentType === 'cards' ? 'getCards' : 'getSets');

  useEffect(() => {
    if (!nextPageApiParams || isApiLoading) return;

    const prefetchTimer = setTimeout(() => {
      prefetchNextPage(nextPageApiParams, { ifOlderThan: 300 });
    }, 1000);

    return () => clearTimeout(prefetchTimer);
  }, [prefetchNextPage, nextPageApiParams, isApiLoading]);

  // Reset pagination to page 1 when search parameters change
  const reduxSearchParamsRef = useRef(reduxSearchParams);
  useEffect(() => {
    // Skip on first render
    if (reduxSearchParamsRef.current === reduxSearchParams) {
      reduxSearchParamsRef.current = reduxSearchParams;
      return;
    }

    // Only reset pagination if search params (not pagination params) have changed
    const hasSearchParamsChanged =
      JSON.stringify(reduxSearchParamsRef.current) !== JSON.stringify(reduxSearchParams);

    if (hasSearchParamsChanged && pagination.currentPage !== 1) {
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
    }

    reduxSearchParamsRef.current = reduxSearchParams;
  }, [reduxSearchParams, pagination.currentPage]);

  // Add content type to URL
  useEffect(() => {
    const params = new URLSearchParams();
    const defaults = { currentPage: 1, pageSize: 24 };

    // Add pagination parameters
    pagination.currentPage > defaults.currentPage
      ? params.set('page', pagination.currentPage.toString())
      : params.delete('page');

    pagination.pageSize !== defaults.pageSize
      ? params.set('pageSize', pagination.pageSize.toString())
      : params.delete('pageSize');

    // Add content type parameter
    if (viewContentType !== 'cards') {
      params.set('contentType', viewContentType);
    }

    // Add search parameters from Redux
    if (reduxSearchParams.name) {
      params.set('name', reduxSearchParams.name);
    }

    if (reduxSearchParams.oracleText) {
      params.set('oracleText', reduxSearchParams.oracleText);
    }

    if (reduxSearchParams.artist) {
      params.set('artist', reduxSearchParams.artist);
    }

    if (reduxSearchParams.oneResultPerCardName) {
      params.set('oneResultPerCardName', 'true');
    }

    if (reduxSearchParams.colors) {
      if (reduxSearchParams.colors.includeColorless) {
        params.set('colorless', 'true');
      } else if (reduxSearchParams.colors.colors.length > 0) {
        params.set('colors', reduxSearchParams.colors.colors.join(','));
        params.set('colorMatchType', reduxSearchParams.colors.matchType);
      }
    }

    if (reduxSearchParams.types) {
      if (reduxSearchParams.types.include.length > 0) {
        params.set('includeTypes', reduxSearchParams.types.include.join('|'));
      }
      if (reduxSearchParams.types.exclude.length > 0) {
        params.set('excludeTypes', reduxSearchParams.types.exclude.join('|'));
      }
    }

    // Add rarity parameters to URL
    if (reduxSearchParams.rarities) {
      if (reduxSearchParams.rarities.include.length > 0) {
        params.set('includeRarities', reduxSearchParams.rarities.include.join('|'));
      }
      if (reduxSearchParams.rarities.exclude.length > 0) {
        params.set('excludeRarities', reduxSearchParams.rarities.exclude.join('|'));
      }
    }

    // Add set parameters to URL
    if (reduxSearchParams.sets) {
      if (reduxSearchParams.sets.include.length > 0) {
        params.set('includeSets', reduxSearchParams.sets.include.join('|'));
      }
      if (reduxSearchParams.sets.exclude.length > 0) {
        params.set('excludeSets', reduxSearchParams.sets.exclude.join('|'));
      }
    }

    if (reduxSearchParams.stats) {
      // Format each stat group as: attribute=condition1|condition2
      const statParams = Object.entries(reduxSearchParams.stats)
        .filter(([_, conditions]) => conditions.length > 0)
        .map(([attribute, conditions]) => `${attribute}=${conditions.join('|')}`);

      if (statParams.length > 0) {
        params.set('stats', statParams.join(','));
      }
    }

    // Add sorting parameters to URL
    if (reduxSearchParams.sortBy) {
      params.set('sortBy', reduxSearchParams.sortBy);
    }

    if (reduxSearchParams.sortOrder) {
      params.set('sortOrder', reduxSearchParams.sortOrder);
    }

    const newSearch = params.toString();
    const newUrl = newSearch ? `${pathname}?${newSearch}` : pathname;
    router.replace(newUrl, { scroll: false });
  }, [pagination, reduxSearchParams, pathname, router, viewContentType]);

  const handlePageChange = useCallback((page: number) => {
    const validPage = Math.max(page, 1);
    setPagination((prev) => ({ ...prev, currentPage: validPage }));
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    const limitedSize = Math.min(Math.max(size, 1), 500);
    setPagination((prev) => ({ ...prev, pageSize: limitedSize, currentPage: 1 }));
  }, []);

  const handleViewModeChange = useCallback(
    (mode: 'grid' | 'table') => {
      setPagination((prev) => ({ ...prev, viewMode: mode }));
      setPreferredViewMode(mode);
    },
    [setPreferredViewMode],
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
    () => (cardsSearchResult?.data ? mapApiCardsToCardItems(cardsSearchResult.data.cards || []) : []),
    [cardsSearchResult?.data],
  );

  const setItems = useMemo(
    () => (setsSearchResult?.data ? mapApiSetsToSetItems(setsSearchResult.data.sets || []) : []),
    [setsSearchResult?.data],
  );

  const totalItems = useMemo(
    () => {
      if (viewContentType === 'cards') {
        return cardsSearchResult?.data?.totalCount || 0;
      } else {
        return setsSearchResult?.data?.totalCount || 0;
      }
    },
    [viewContentType, cardsSearchResult?.data?.totalCount, setsSearchResult?.data?.totalCount],
  );

  const totalPages = useMemo(
    () => Math.ceil(totalItems / pagination.pageSize),
    [totalItems, pagination.pageSize],
  );

  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const isInitialLoading = !initialLoadComplete && !((viewContentType === 'cards' ? cardsSearchResult : setsSearchResult)?.data) && !error;

  useEffect(() => {
    if (((viewContentType === 'cards' ? cardsSearchResult : setsSearchResult)?.data || error) && !initialLoadComplete) {
      setInitialLoadComplete(true);
    }
  }, [viewContentType, cardsSearchResult?.data, setsSearchResult?.data, error, initialLoadComplete]);

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
  };

  // Get display settings for sets
  const setDisplaySettings = useSetDisplaySettings(pagination.viewMode);

  // Get setting groups based on content type and view mode
  const settingGroups = useCardSetSettingGroups(viewContentType, pagination.viewMode);

  // Update page title to reflect content type
  useEffect(() => {
    document.title = `Browse ${viewContentType === 'cards' ? 'Cards' : 'Sets'} | MTG Collection Builder`;
  }, [viewContentType]);

  return (
    <Box>
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Browse' }]} />

      {/* Page Settings */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        {viewContentType === 'cards' ? (
          <Box>
            {/* Existing CardSettingsPanel will be shown automatically in CardGalleryPagination */}
          </Box>
        ) : (
          <SetSettingsPanel
            settingGroups={settingGroups}
            panelId={`set${pagination.viewMode === 'grid' ? 'Gallery' : 'Table'}Settings`}
            panelTitle={`Set ${pagination.viewMode === 'grid' ? 'Display' : 'Table'} Settings`}
          />
        )}
      </Box>

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
