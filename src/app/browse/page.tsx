'use client';

import { Box, Divider, Typography } from '@mui/material';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { ApiResponse } from '@/api/types/apiTypes';
import CardGallery from '@/components/cards/CardGallery';
import CardTable from '@/components/cards/CardTable';
import { CardGalleryPagination } from '@/components/pagination';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { mapApiCardsToCardItems } from '@/features/browse/mappers';
import { useInitializeBrowseFromUrl } from '@/hooks/useInitializeBrowseFromUrl';
import { useGetCardsQuery, useGetCardsPrefetch, getNextPageParams } from '@/api/browse/browseApi';
import { mtgcbApi } from '@/api/mtgcbApi';
import { skipToken } from '@reduxjs/toolkit/query';
import { CardApiParams, CardModel, CardSearchData } from '@/api/browse/types';
import { selectSearchParams } from '@/redux/slices/browseSlice';
import { BrowsePagination } from '@/types/browse';
import { buildApiParamsFromSearchParams } from '@/utils/searchParamsConverter';
import { useImagePreloader } from '@/hooks/useImagePreloader';

interface CardDisplayProps {
  cardItems: ReturnType<typeof mapApiCardsToCardItems>;
  isLoading: boolean;
  viewMode: 'grid' | 'table';
  onCardClick: (cardId: string) => void;
}

const CardDisplay = ({ cardItems, isLoading, viewMode, onCardClick }: CardDisplayProps) => {
  const displayCards = isLoading
    ? Array(24).fill(0).map((_, index) => ({
        id: `skeleton-${index}`,
        name: '',
        setName: '',
        collectorNumber: '',
        rarity: '',
        isLoadingSkeleton: true,
      }))
    : cardItems;
  
  return viewMode === 'grid' ? (
    <CardGallery
      key="gallery"
      cards={displayCards}
      isLoading={isLoading}
      cardsPerRow={4}
      galleryWidth={95}
      onCardClick={onCardClick}
    />
  ) : (
    <CardTable
      key="table"
      cards={displayCards}
      isLoading={isLoading}
      onCardClick={onCardClick}
    />
  );
};

// Debug view as a separate component
interface DebugViewProps {
  searchResult: ApiResponse<CardSearchData>;
}

const DebugView = ({ searchResult }: DebugViewProps) => (
  <>
    <Divider sx={{ my: 4 }} />
    <Typography variant="h6" sx={{ mb: 2 }}>
      Debug: Raw API Response
    </Typography>
    <Box
      component="pre"
      sx={{
        p: 2,
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        color: 'text.primary',
        overflow: 'auto',
        fontSize: '0.75rem',
      }}
    >
      {JSON.stringify(searchResult, null, 2)}
    </Box>
  </>
);

export default function BrowsePage() {
  const router = useRouter();
  const pathname = usePathname();
  const urlSearchParams = useSearchParams();
  const reduxSearchParams = useSelector(selectSearchParams);
  
  const [pagination, setPagination] = useState<BrowsePagination>({
    currentPage: parseInt(urlSearchParams.get('page') || '1', 10),
    pageSize: parseInt(urlSearchParams.get('pageSize') || '24', 10),
    viewMode: urlSearchParams.get('view') === 'table' ? 'table' : 'grid'
  });
  
  useInitializeBrowseFromUrl();
  
  const apiParams = useMemo(() => ({
    ...buildApiParamsFromSearchParams(reduxSearchParams),
    limit: pagination.pageSize,
    offset: (pagination.currentPage - 1) * pagination.pageSize,
    sortBy: 'name',
    sortDirection: 'asc' as const,
    select: [
      'name', 'setId', 'setName', 'tcgplayerId',
      'market', 'low', 'average', 'high', 'foil',
      'collectorNumber', 'mtgcbCollectorNumber', 'rarity',
    ] as Array<keyof CardModel>,
  }), [reduxSearchParams, pagination]);
  
  const nextPageApiParams = useMemo(() => 
    pagination.currentPage >= 1
      ? getNextPageParams(apiParams, pagination.currentPage, pagination.pageSize)
      : null,
    [apiParams, pagination.currentPage, pagination.pageSize]
  );

  const queryConfig = {
    refetchOnMountOrArgChange: false,
    refetchOnFocus: false,
    refetchOnReconnect: false
  };

  const { 
    data: searchResult, 
    isFetching: apiLoading,
    error 
  } = useGetCardsQuery(apiParams, queryConfig);

  const prefetchNextPage = useGetCardsPrefetch('getCards');
  
  useEffect(() => {
    if (!nextPageApiParams || apiLoading) return;
    
    const prefetchTimer = setTimeout(() => {
      prefetchNextPage(nextPageApiParams, { ifOlderThan: 300 });
    }, 1000);
    
    return () => clearTimeout(prefetchTimer);
  }, [prefetchNextPage, nextPageApiParams, apiLoading]);
  
  const { currentData: nextPageCachedData } = useGetCardsQuery(
    nextPageApiParams || skipToken, 
    { ...queryConfig, skip: !nextPageApiParams }
  );
  
  const nextPageData = useMemo(() => 
    nextPageCachedData?.data?.cards 
      ? mapApiCardsToCardItems(nextPageCachedData.data.cards)
      : null,
    [nextPageCachedData]
  );
  
  const [isLoading, setIsLoading] = useState(false);
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  useImagePreloader(nextPageData, isLoading);
  
  useEffect(() => {
    // Clear any pending timers first
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = null;
    }
    
    if (apiLoading) {
      // Add delay before showing loading indicators to prevent flashing
      loadingTimerRef.current = setTimeout(() => {
        if (apiLoading) setIsLoading(true);
        loadingTimerRef.current = null;
      }, 300);
    } else if (isLoading) {
      // Maintain minimum loading duration for consistent UX
      const minLoadingTimer = setTimeout(() => setIsLoading(false), 400);
      return () => clearTimeout(minLoadingTimer);
    } else {
      setIsLoading(false);
    }
    
    return () => {
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
    };
  }, [apiLoading, isLoading]);
  
  useEffect(() => {
    const params = new URLSearchParams(urlSearchParams.toString());
    const defaults = { currentPage: 1, pageSize: 24, viewMode: 'grid' };
    
    // Only include non-default values in URL
    pagination.currentPage > defaults.currentPage 
      ? params.set('page', pagination.currentPage.toString())
      : params.delete('page');
    
    pagination.pageSize !== defaults.pageSize
      ? params.set('pageSize', pagination.pageSize.toString())
      : params.delete('pageSize');
    
    pagination.viewMode !== defaults.viewMode
      ? params.set('view', pagination.viewMode)
      : params.delete('view');
    
    const newSearch = params.toString();
    const newUrl = newSearch ? `${pathname}?${newSearch}` : pathname;
    router.replace(newUrl, { scroll: false });
  }, [pagination, pathname, router, urlSearchParams]);

  const handlePageChange = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPagination(prev => ({ ...prev, pageSize: size, currentPage: 1 }));
  }, []);

  const handleViewModeChange = useCallback((mode: 'grid' | 'table') => {
    setPagination(prev => ({ ...prev, viewMode: mode }));
  }, []);

  const handleCardClick = useCallback((cardId: string) => {
    router.push(`/browse/cards/${cardId}`);
  }, [router]);

  const cardItems = useMemo(() => 
    searchResult?.data ? mapApiCardsToCardItems(searchResult.data.cards || []) : [],
    [searchResult?.data]
  );

  const totalItems = useMemo(() => 
    searchResult?.data?.totalCount || 0,
    [searchResult?.data?.totalCount]
  );
  
  const totalPages = useMemo(() => 
    Math.ceil(totalItems / pagination.pageSize),
    [totalItems, pagination.pageSize]
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
    isLoading
  };

  return (
    <Box>
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Browse' }]} />

      <CardGalleryPagination {...paginationProps} />

      {error && (
        <Box mb={2}>
          <Typography color="error">Error loading cards: {JSON.stringify(error)}</Typography>
        </Box>
      )}

      <CardDisplay 
        cardItems={cardItems}
        isLoading={isLoading}
        viewMode={pagination.viewMode}
        onCardClick={handleCardClick}
      />

      <CardGalleryPagination 
        {...paginationProps} 
        isOnBottom={true} 
      />

      {searchResult && <DebugView searchResult={searchResult} />}
    </Box>
  );
}