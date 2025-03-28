'use client';

import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { Box, Divider, Typography } from '@mui/material';
import { skipToken } from '@reduxjs/toolkit/query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { getNextPageParams, useGetCardsPrefetch, useGetCardsQuery } from '@/api/browse/browseApi';
import { CardApiParams, CardModel, CardSearchData } from '@/api/browse/types';
import { mtgcbApi } from '@/api/mtgcbApi';
import { ApiResponse } from '@/api/types/apiTypes';
import CardGallery from '@/components/cards/CardGallery';
import CardTable from '@/components/cards/CardTable';
import { CardGalleryPagination } from '@/components/pagination';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { mapApiCardsToCardItems } from '@/features/browse/mappers';
import { useInitializeBrowseFromUrl } from '@/hooks/useInitializeBrowseFromUrl';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { selectSearchParams } from '@/redux/slices/browseSlice';
import { BrowsePagination } from '@/types/browse';
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

  const [cardsPerRow] = useLocalStorage<number>('cardsPerRow', 4);

  return viewMode === 'grid' ? (
    <CardGallery
      key="gallery"
      cards={displayCards}
      isLoading={isLoading}
      cardsPerRow={cardsPerRow}
      galleryWidth={95}
      onCardClick={onCardClick}
    />
  ) : (
    <CardTable key="table" cards={displayCards} isLoading={isLoading} onCardClick={onCardClick} />
  );
};

// Debug view as a separate component
interface DebugViewProps {
  searchResult: ApiResponse<CardSearchData>;
}

export default function BrowsePage() {
  const router = useRouter();
  const pathname = usePathname();
  const urlSearchParams = useSearchParams();
  const reduxSearchParams = useSelector(selectSearchParams);

  const [pagination, setPagination] = useState<BrowsePagination>({
    currentPage: Math.max(parseInt(urlSearchParams.get('page') || '1', 10), 1),
    pageSize: Math.min(Math.max(parseInt(urlSearchParams.get('pageSize') || '24', 10), 1), 500),
    viewMode: urlSearchParams.get('view') === 'table' ? 'table' : 'grid',
  });

  useInitializeBrowseFromUrl();

  const apiParams = useMemo(() => {
    const params = buildApiParamsFromSearchParams(reduxSearchParams);
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
        'powerNumeric',
        'toughnessNumeric',
        'loyaltyNumeric',
        'releaseDate',
      ] as Array<keyof CardModel>,
    };
  }, [reduxSearchParams, pagination]);

  const nextPageApiParams = useMemo(
    () =>
      pagination.currentPage >= 1
        ? getNextPageParams(apiParams, pagination.currentPage, pagination.pageSize)
        : null,
    [apiParams, pagination.currentPage, pagination.pageSize],
  );

  const queryConfig = {
    refetchOnMountOrArgChange: false,
    refetchOnFocus: false,
    refetchOnReconnect: false,
  };

  const {
    data: searchResult,
    isFetching: isApiLoading,
    error,
  } = useGetCardsQuery(apiParams, queryConfig);

  const prefetchNextPage = useGetCardsPrefetch('getCards');

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

  useEffect(() => {
    const params = new URLSearchParams();
    const defaults = { currentPage: 1, pageSize: 24, viewMode: 'grid' };

    // Add pagination parameters
    pagination.currentPage > defaults.currentPage
      ? params.set('page', pagination.currentPage.toString())
      : params.delete('page');

    pagination.pageSize !== defaults.pageSize
      ? params.set('pageSize', pagination.pageSize.toString())
      : params.delete('pageSize');

    pagination.viewMode !== defaults.viewMode
      ? params.set('view', pagination.viewMode)
      : params.delete('view');

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
  }, [pagination, reduxSearchParams, pathname, router]);

  const handlePageChange = useCallback((page: number) => {
    const validPage = Math.max(page, 1);
    setPagination((prev) => ({ ...prev, currentPage: validPage }));
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    const limitedSize = Math.min(Math.max(size, 1), 500);
    setPagination((prev) => ({ ...prev, pageSize: limitedSize, currentPage: 1 }));
  }, []);

  const handleViewModeChange = useCallback((mode: 'grid' | 'table') => {
    setPagination((prev) => ({ ...prev, viewMode: mode }));
  }, []);

  const handleCardClick = useCallback(
    (cardId: string) => {
      router.push(`/browse/cards/${cardId}`);
    },
    [router],
  );

  const cardItems = useMemo(
    () => (searchResult?.data ? mapApiCardsToCardItems(searchResult.data.cards || []) : []),
    [searchResult?.data],
  );

  const totalItems = useMemo(
    () => searchResult?.data?.totalCount || 0,
    [searchResult?.data?.totalCount],
  );

  const totalPages = useMemo(
    () => Math.ceil(totalItems / pagination.pageSize),
    [totalItems, pagination.pageSize],
  );

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
  };

  return (
    <Box>
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Browse' }]} />

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
            Unable to load cards
          </Typography>
          <Typography color="text.primary">
            There was a problem fetching card data. Please try again later.
          </Typography>
        </Box>
      )}

      <CardDisplay
        cardItems={cardItems}
        isLoading={isApiLoading}
        viewMode={pagination.viewMode}
        onCardClick={handleCardClick}
        pageSize={pagination.pageSize}
      />

      <CardGalleryPagination {...paginationProps} isOnBottom={true} />
    </Box>
  );
}
