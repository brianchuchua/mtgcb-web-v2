import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useGetSetByIdQuery, useGetSetsQuery } from '@/api/browse/browseApi';
import { clearSpecificSearchField } from '@/hooks/useSearchStateSync';
import { selectSets, setSets, setViewContentType } from '@/redux/slices/browseSlice';
import { SetFilter } from '@/types/browse';

/**
 * Consolidated hook for managing set filter logic on set-specific pages
 * Used by both SetBrowseClient and CollectionSetClient
 *
 * Handles:
 * - Fetching set, subsets, and parent set data
 * - Applying Redux set filter automatically
 * - Re-applying filter if it gets cleared (e.g., by reset search)
 * - Cleaning up filter on unmount or setSlug change
 */

export interface UseSetPageFilterOptions {
  /** URL slug for the set (e.g., "foundational") */
  setSlug: string;

  /** Price type for queries */
  priceType: 'market' | 'low' | 'average' | 'high';

  /** Whether to include subsets in set queries */
  includeSubsetsInSets: boolean;

  /** Optional userId for collection queries */
  userId?: number;

  /** Optional goalId for collection queries */
  goalId?: number | null;

  /** Skip all queries (e.g., while waiting for sync) */
  skipQueries?: boolean;
}

export interface UseSetPageFilterReturn {
  /** The fetched set data */
  set: any | undefined;

  /** Array of subset sets */
  subsets: any[];

  /** Parent set if this set has one */
  parentSet: any | undefined;

  /** Loading state for main set query */
  isSetLoading: boolean;

  /** Loading state for subsets query */
  isSubsetsLoading: boolean;

  /** True when set filter has been applied and cards query can proceed */
  isReady: boolean;

  /** True when set query succeeded */
  isSuccess: boolean;
}

export function useSetPageFilter(options: UseSetPageFilterOptions): UseSetPageFilterReturn {
  const dispatch = useDispatch();
  const currentSetsFilter = useSelector(selectSets);
  const [isSetReady, setIsSetReady] = useState(false);

  // Fetch set by slug
  const {
    data: setsData,
    isSuccess,
    isLoading: isSetLoading,
  } = useGetSetsQuery(
    {
      limit: 1,
      slug: options.setSlug,
      priceType: options.priceType,
      includeSubsetsInSets: options.includeSubsetsInSets,
      ...(options.userId && { userId: options.userId }),
      ...(options.goalId && { goalId: options.goalId }),
    },
    {
      skip: options.skipQueries,
    }
  );

  const set = setsData?.data?.sets?.[0];

  // Fetch subsets
  const { data: subsetsData, isLoading: isSubsetsLoading } = useGetSetsQuery(
    {
      parentSetId: set?.id,
      limit: 100,
      ...(options.userId && { userId: options.userId }),
      priceType: options.priceType,
      ...(options.goalId && { goalId: options.goalId }),
    },
    {
      skip: !set?.id || options.skipQueries,
    }
  );

  // Fetch parent set
  const { data: parentSetData } = useGetSetByIdQuery(set?.parentSetId || '', {
    skip: !set?.parentSetId || options.skipQueries,
  });

  const subsets = subsetsData?.data?.sets || [];
  const parentSet = parentSetData?.data?.set;

  // Clear filter immediately when setSlug changes
  useEffect(() => {
    setIsSetReady(false);
    dispatch(setSets({ include: [], exclude: [] }));
    clearSpecificSearchField('cards', 'sets');
  }, [options.setSlug, dispatch]);

  // Clean up filter when component unmounts
  useEffect(() => {
    return () => {
      dispatch(setSets({ include: [], exclude: [] }));
      clearSpecificSearchField('cards', 'sets');
    };
  }, [dispatch]);

  // Set the filter and view when set data loads
  useEffect(() => {
    // Always set view to cards for set-specific pages
    dispatch(setViewContentType('cards'));

    if (isSuccess && setsData?.data?.sets && setsData.data.sets.length > 0) {
      const set = setsData.data.sets[0];

      const setFilter: SetFilter = {
        include: [set.id],
        exclude: [],
      };

      dispatch(setSets(setFilter));
      setIsSetReady(true);

      // Clear sets filter from sessionStorage since this is page context, not user input
      clearSpecificSearchField('cards', 'sets');
    }
  }, [dispatch, setsData, isSuccess, options.setSlug]);

  // Re-apply set filter if it gets cleared (e.g., by reset search)
  useEffect(() => {
    if (isSuccess && setsData?.data?.sets && setsData.data.sets.length > 0) {
      const set = setsData.data.sets[0];
      const expectedSetId = set.id;

      // Check if current sets filter doesn't include this set
      const hasCorrectSetFilter =
        currentSetsFilter && currentSetsFilter.include && currentSetsFilter.include.includes(expectedSetId);

      if (!hasCorrectSetFilter) {
        const setFilter: SetFilter = {
          include: [expectedSetId],
          exclude: [],
        };
        dispatch(setSets(setFilter));
      }
    }
  }, [dispatch, setsData, isSuccess, currentSetsFilter]);

  return {
    set,
    subsets,
    parentSet,
    isSetLoading,
    isSubsetsLoading,
    isReady: isSetReady,
    isSuccess,
  };
}
