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
  selectCardSearchParams,
  selectSetSearchParams,
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
  const reduxCardSearchParams = useSelector(selectCardSearchParams);
  const reduxSetSearchParams = useSelector(selectSetSearchParams);
  const dispatch = useDispatch();

  const viewContentType = useSelector(selectViewContentType);
  const [preferredViewMode, setPreferredViewMode] = useLocalStorage<'grid' | 'table'>(
    'preferredViewMode',
    'grid',
  );

  // Separate pagination state for cards and sets
  const [cardsPagination, setCardsPagination] = useState<BrowsePagination>({
    currentPage: Math.max(parseInt(urlSearchParams.get('page') || '1', 10), 1),
    pageSize: Math.min(Math.max(parseInt(urlSearchParams.get('pageSize') || '24', 10), 1), 500),
    viewMode: preferredViewMode,
  });

  const [setsPagination, setSetsPagination] = useState<BrowsePagination>({
    currentPage: Math.max(parseInt(urlSearchParams.get('page') || '1', 10), 1),
    pageSize: Math.min(Math.max(parseInt(urlSearchParams.get('pageSize') || '24', 10), 1), 500),
    viewMode: preferredViewMode,
  });

  // Get the current pagination based on content type
  const pagination = viewContentType === 'cards' ? cardsPagination : setsPagination;
  const setPagination = viewContentType === 'cards' ? setCardsPagination : setSetsPagination;

  useEffect(() => {
    if (pagination.viewMode !== preferredViewMode) {
      setPagination((prev) => ({
        ...prev,
        viewMode: preferredViewMode,
      }));
    }
  }, [preferredViewMode, pagination.viewMode, setPagination]);

  useInitializeBrowseFromUrl();

  // Card API params
  const cardApiParams = useMemo(() => {
    const params = buildApiParamsFromSearchParams(reduxCardSearchParams, 'cards');
    return {
      ...params,
      limit: cardsPagination.pageSize,
      offset: (cardsPagination.currentPage - 1) * cardsPagination.pageSize,
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
  }, [reduxCardSearchParams, cardsPagination]);

  // Set API params
  const setApiParams = useMemo(() => {
    const params = buildApiParamsFromSearchParams(reduxSetSearchParams, 'sets');
    return {
      ...params,
      limit: setsPagination.pageSize,
      offset: (setsPagination.currentPage - 1) * setsPagination.pageSize,
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
  }, [reduxSetSearchParams, setsPagination]);

  const nextPageApiParams = useMemo(
    () => {
      if (viewContentType === 'cards' && cardsPagination.currentPage >= 1) {
        return getNextPageParams(
          cardApiParams,
          cardsPagination.currentPage,
          cardsPagination.pageSize
        );
      } else if (viewContentType === 'sets' && setsPagination.currentPage >= 1) {
        return getNextPageParams(
          setApiParams,
          setsPagination.currentPage,
          setsPagination.pageSize
        );
      }
      return null;
    },
    [viewContentType, cardApiParams, setApiParams, cardsPagination, setsPagination],
  );

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

  const prefetchNextPage = useGetCardsPrefetch(viewContentType === 'cards' ? 'getCards' : 'getSets');

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

    // Only reset pagination if search params (not pagination params) have changed
    const hasSearchParamsChanged =
      JSON.stringify(reduxCardSearchParamsRef.current) !== JSON.stringify(reduxCardSearchParams);

    if (hasSearchParamsChanged && viewContentType === 'cards' && cardsPagination.currentPage !== 1) {
      setCardsPagination((prev) => ({ ...prev, currentPage: 1 }));
    }

    reduxCardSearchParamsRef.current = reduxCardSearchParams;
  }, [reduxCardSearchParams, viewContentType, cardsPagination.currentPage]);
  
  useEffect(() => {
    // Skip on first render
    if (reduxSetSearchParamsRef.current === reduxSetSearchParams) {
      reduxSetSearchParamsRef.current = reduxSetSearchParams;
      return;
    }

    // Only reset pagination if search params (not pagination params) have changed
    const hasSearchParamsChanged =
      JSON.stringify(reduxSetSearchParamsRef.current) !== JSON.stringify(reduxSetSearchParams);

    if (hasSearchParamsChanged && viewContentType === 'sets' && setsPagination.currentPage !== 1) {
      setSetsPagination((prev) => ({ ...prev, currentPage: 1 }));
    }

    reduxSetSearchParamsRef.current = reduxSetSearchParams;
  }, [reduxSetSearchParams, viewContentType, setsPagination.currentPage]);

  // Add content type to URL
  useEffect(() => {
    // Use existing URL parameters as a base to preserve other parameters
    const params = new URLSearchParams(urlSearchParams.toString());
    const defaults = { currentPage: 1, pageSize: 24 };
    const currentPagination = viewContentType === 'cards' ? cardsPagination : setsPagination;

    // Add pagination parameters
    currentPagination.currentPage > defaults.currentPage
      ? params.set('page', currentPagination.currentPage.toString())
      : params.delete('page');

    currentPagination.pageSize !== defaults.pageSize
      ? params.set('pageSize', currentPagination.pageSize.toString())
      : params.delete('pageSize');

    // Add content type parameter (always preserve sets, remove if cards to keep URLs clean)
    if (viewContentType === 'sets') {
      params.set('contentType', 'sets');
    } else {
      params.delete('contentType');
    }

    // Get the currently active search params based on view type
    const activeSearchParams = viewContentType === 'cards' ? reduxCardSearchParams : reduxSetSearchParams;
    
    // Add name parameter depending on current view
    if (activeSearchParams.name) {
      params.set('name', activeSearchParams.name);
    }

    // Add card-specific parameters when in cards view
    if (viewContentType === 'cards') {
      if (reduxCardSearchParams.oracleText) {
        params.set('oracleText', reduxCardSearchParams.oracleText);
      }

      if (reduxCardSearchParams.artist) {
        params.set('artist', reduxCardSearchParams.artist);
      }

      if (reduxCardSearchParams.oneResultPerCardName) {
        params.set('oneResultPerCardName', 'true');
      }

      if (reduxCardSearchParams.colors) {
        if (reduxCardSearchParams.colors.includeColorless) {
          params.set('colorless', 'true');
        } else if (reduxCardSearchParams.colors.colors.length > 0) {
          params.set('colors', reduxCardSearchParams.colors.colors.join(','));
          params.set('colorMatchType', reduxCardSearchParams.colors.matchType);
        }
      }

      if (reduxCardSearchParams.types) {
        if (reduxCardSearchParams.types.include.length > 0) {
          params.set('includeTypes', reduxCardSearchParams.types.include.join('|'));
        }
        if (reduxCardSearchParams.types.exclude.length > 0) {
          params.set('excludeTypes', reduxCardSearchParams.types.exclude.join('|'));
        }
      }

      // Add rarity parameters to URL
      if (reduxCardSearchParams.rarities) {
        if (reduxCardSearchParams.rarities.include.length > 0) {
          params.set('includeRarities', reduxCardSearchParams.rarities.include.join('|'));
        }
        if (reduxCardSearchParams.rarities.exclude.length > 0) {
          params.set('excludeRarities', reduxCardSearchParams.rarities.exclude.join('|'));
        }
      }

      // Add set parameters to URL
      if (reduxCardSearchParams.sets) {
        if (reduxCardSearchParams.sets.include.length > 0) {
          params.set('includeSets', reduxCardSearchParams.sets.include.join('|'));
        }
        if (reduxCardSearchParams.sets.exclude.length > 0) {
          params.set('excludeSets', reduxCardSearchParams.sets.exclude.join('|'));
        }
      }

      if (reduxCardSearchParams.stats) {
        // Format each stat group as: attribute=condition1|condition2
        const statParams = Object.entries(reduxCardSearchParams.stats)
          .filter(([_, conditions]) => conditions.length > 0)
          .map(([attribute, conditions]) => `${attribute}=${conditions.join('|')}`);

        if (statParams.length > 0) {
          params.set('stats', statParams.join(','));
        }
      }
    }

    // Add sorting parameters to URL from the active view type
    if (activeSearchParams.sortBy) {
      params.set('sortBy', activeSearchParams.sortBy);
    }

    if (activeSearchParams.sortOrder) {
      params.set('sortOrder', activeSearchParams.sortOrder);
    }

    const newSearch = params.toString();
    const newUrl = newSearch ? `${pathname}?${newSearch}` : pathname;
    router.replace(newUrl, { scroll: false });
  }, [cardsPagination, setsPagination, reduxCardSearchParams, reduxSetSearchParams, pathname, router, viewContentType]);

  const handlePageChange = useCallback((page: number) => {
    const validPage = Math.max(page, 1);
    setPagination((prev) => ({ ...prev, currentPage: validPage }));
  }, [setPagination]);

  const handlePageSizeChange = useCallback((size: number) => {
    const limitedSize = Math.min(Math.max(size, 1), 500);
    setPagination((prev) => ({ ...prev, pageSize: limitedSize, currentPage: 1 }));
  }, [setPagination]);

  const handleViewModeChange = useCallback(
    (mode: 'grid' | 'table') => {
      setPagination((prev) => ({ ...prev, viewMode: mode }));
      setPreferredViewMode(mode);
    },
    [setPreferredViewMode, setPagination],
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
        <Box>
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
          viewMode={cardsPagination.viewMode}
          onCardClick={handleCardClick}
          pageSize={cardsPagination.pageSize}
        />
      ) : (
        <SetDisplay
          setItems={setItems}
          isLoading={isSetsApiLoading}
          viewMode={setsPagination.viewMode}
          onSetClick={handleSetClick}
          pageSize={setsPagination.pageSize}
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