/**
 * useIndependentBrowseController
 * =============================================================================
 * A simplified browse controller for subset sections that operates independently
 * from the main Redux-based browse controller. This prevents state conflicts
 * between the main set and its subsets.
 * 
 * Key differences from useBrowseController:
 * - Uses local React state instead of Redux
 * - Only supports card view (no sets view)
 * - Fixed to a specific setId
 * - Simplified pagination and view mode handling
 */

import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useGetCardsQuery } from '@/api/browse/browseApi';
import { CardModel } from '@/api/browse/types';
import { useDisplaySettings } from '@/features/browse/hooks/useDisplaySettings';
import { mapApiCardsToCardItems } from '@/features/browse/mappers';
import { useCardSettingGroups } from '@/hooks/useCardSettingGroups';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { usePriceType } from '@/hooks/usePriceType';
import { selectSortBy, selectSortOrder, setSortBy, setSortOrder } from '@/redux/slices/browseSlice';
import { SortByOption } from '@/types/browse';
import { buildApiParamsFromSearchParams } from '@/utils/searchParamsConverter';

interface UseIndependentBrowseControllerProps {
  setId: string;
  enabled?: boolean;
  searchParams?: any;
}

export function useIndependentBrowseController({ setId, enabled = true, searchParams = {} }: UseIndependentBrowseControllerProps) {
  const router = useRouter();
  const dispatch = useDispatch();
  
  // Local state for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);
  
  // Local state for view mode
  const [viewMode, setViewMode] = useLocalStorage<'grid' | 'table'>('cardViewMode', 'grid');
  
  // Use Redux sort state for global synchronization
  const sortBy = useSelector(selectSortBy) || 'releasedAt';
  const sortOrder = useSelector(selectSortOrder) || 'asc';

  // Display settings
  const displaySettings = useDisplaySettings({ view: 'cards', viewMode });
  const cardSettingGroups = useCardSettingGroups(viewMode);
  const priceType = usePriceType();

  // Build API parameters
  const apiArgs = useMemo(() => {
    // Start with search parameters from the main search form
    const baseParams = buildApiParamsFromSearchParams(searchParams, 'cards');
    
    // Combine with subset-specific parameters
    return {
      ...baseParams,
      // Override/add subset-specific filters
      setId: {
        OR: [setId], // Force this subset's ID
      },
      limit: pageSize,
      offset: (currentPage - 1) * pageSize,
      sortBy: sortBy || baseParams.sortBy || 'releasedAt',
      sortDirection: sortOrder || baseParams.sortDirection || 'asc',
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
  }, [setId, pageSize, currentPage, sortBy, sortOrder, searchParams]);

  // Fetch data
  const {
    data: cardsSearchResult,
    isFetching: isLoading,
    error,
  } = useGetCardsQuery(apiArgs, {
    skip: !enabled,
    refetchOnMountOrArgChange: false,
    refetchOnFocus: false,
    refetchOnReconnect: false,
  });

  // Process data
  const items = useMemo(
    () => (cardsSearchResult?.data ? mapApiCardsToCardItems(cardsSearchResult.data.cards || []) : []),
    [cardsSearchResult?.data],
  );

  const total = cardsSearchResult?.data?.totalCount || 0;
  const totalPages = Math.ceil(total / pageSize) || 1;

  // Create loading skeletons
  const displayItems = useMemo(() => {
    if (!isLoading) return items;

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
  }, [items, isLoading, pageSize]);

  // Event handlers
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  }, []);

  const handleViewModeChange = useCallback((newViewMode: 'grid' | 'table') => {
    setViewMode(newViewMode);
  }, [setViewMode]);

  const handleSort = useCallback((columnId: string) => {
    if (!columnId) return;

    const isClickingCurrentSortColumn = columnId === sortBy;
    if (isClickingCurrentSortColumn) {
      const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
      dispatch(setSortOrder(newOrder));
    } else {
      dispatch(setSortBy(columnId as SortByOption));
      dispatch(setSortOrder('asc'));
    }
    setCurrentPage(1); // Reset to first page when sorting
  }, [dispatch, sortBy, sortOrder]);

  const handleCardClick = useCallback(
    (cardId: string) => {
      router.push(`/browse/cards/${cardId}`);
    },
    [router],
  );

  // Return controller result matching the main controller's interface
  return {
    view: 'cards' as const,
    viewMode,
    error,

    paginationProps: {
      currentPage,
      totalPages,
      pageSize,
      totalItems: total,
      viewMode,
      onPageChange: handlePageChange,
      onPageSizeChange: handlePageSizeChange,
      onViewModeChange: handleViewModeChange,
      isLoading,
      isInitialLoading: false,
      contentType: 'cards' as const,
      settingGroups: cardSettingGroups,
    },

    cardsProps: {
      items: displayItems,
      loading: isLoading,
      viewMode,
      onSort: handleSort,
      onCardClick: handleCardClick,
      pageSize,
      sortBy,
      sortOrder,
      gallerySettings: displaySettings.gallerySettings,
      tableSettings: displaySettings.tableSettings,
      cardDisplaySettings: displaySettings.cardDisplaySettings,
      priceType: displaySettings.priceType,
    },

    setsProps: {},
  };
}