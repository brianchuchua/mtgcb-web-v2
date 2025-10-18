'use client';

import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { Box, Button, Typography } from '@mui/material';
import { usePathname } from 'next/navigation';
import React, { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import SubsetSection from './SubsetSection';
import { useGetSetByIdQuery, useGetSetsQuery } from '@/api/browse/browseApi';
import { useGetCostToCompleteQuery } from '@/api/sets/setsApi';
import { SearchDescription } from '@/components/browse/SearchDescription';
import { Pagination } from '@/components/pagination';
import SubsetDropdown from '@/components/pagination/SubsetDropdown';
import SetIcon from '@/components/sets/SetIcon';
import { SetNavigationButtons } from '@/components/sets/SetNavigationButtons';
import { SetPageBuyButton } from '@/components/sets/SetPageBuyButton';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { useSetNavigation } from '@/hooks/useSetNavigation';
import { useSetPriceType } from '@/hooks/useSetPriceType';
import { clearSpecificSearchField } from '@/hooks/useSearchStateSync';
import { CardsProps } from '@/features/browse/types/browseController';
import { useBrowseController } from '@/features/browse/useBrowseController';
import { CardGrid, CardTable, ErrorBanner } from '@/features/browse/views';
import InfoBanner from '@/features/browse/views/InfoBanner';
import { resetSearch, selectCardSearchParams, selectIncludeSubsetsInSets, selectSets, setSets, setViewContentType } from '@/redux/slices/browseSlice';
import { SetFilter } from '@/types/browse';
import capitalize from '@/utils/capitalize';
import { formatISODate } from '@/utils/dateUtils';

// Allow time for CSS animation to complete before scrolling
const SUBSET_EXPANSION_DELAY_MS = 100;

interface SetBrowseClientProps {
  setSlug: string;
}

export default function SetBrowseClient({ setSlug }: SetBrowseClientProps) {
  const dispatch = useDispatch();
  const setPriceType = useSetPriceType();

  // Use browse controller with proper configuration
  const browseController = useBrowseController({
    forceView: 'cards',
    waitForSetFilter: true,
  });

  const subsetRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const subsetToggleRefs = useRef<Record<string, () => void>>({});

  // Get current search parameters to pass to subsets
  const cardSearchParams = useSelector(selectCardSearchParams);
  const currentSetsFilter = useSelector(selectSets);
  const currentIncludeSubsetsInSets = useSelector(selectIncludeSubsetsInSets);

  const {
    data: setsData,
    isSuccess,
    isLoading: isSetLoading,
  } = useGetSetsQuery({
    limit: 1,
    slug: setSlug,
    priceType: setPriceType,
    includeSubsetsInSets: currentIncludeSubsetsInSets,
  });

  const set = setsData?.data?.sets?.[0];
  const pathname = usePathname();

  // Fetch cost to complete data for non-collection browse
  const { data: costToCompleteData } = useGetCostToCompleteQuery(
    {
      priceType: setPriceType,
      includeSubsetsInSets: currentIncludeSubsetsInSets,
    },
    {
      skip: !set?.id || isSetLoading,
    }
  );

  const { data: subsetsData, isLoading: isSubsetsLoading } = useGetSetsQuery(
    {
      parentSetId: set?.id,
      limit: 100,
    },
    {
      skip: !set?.id,
    },
  );

  const { data: parentSetData } = useGetSetByIdQuery(set?.parentSetId || '', {
    skip: !set?.parentSetId,
  });

  const parentSet = parentSetData?.data?.set;

  // Clean up filter when component unmounts
  useEffect(() => {
    return () => {
      dispatch(setSets({ include: [], exclude: [] }));
      // Clear sets filter from sessionStorage on unmount
      clearSpecificSearchField('cards', 'sets');
    };
  }, [dispatch]);

  // Set the filter and view when set data loads
  useEffect(() => {
    // Always set view to cards for this page
    dispatch(setViewContentType('cards'));

    if (isSuccess && setsData?.data?.sets && setsData.data.sets.length > 0) {
      const set = setsData.data.sets[0];

      const setFilter: SetFilter = {
        include: [set.id],
        exclude: [],
      };

      dispatch(setSets(setFilter));

      // Clear sets filter from sessionStorage since this is page context, not user input
      clearSpecificSearchField('cards', 'sets');
    }
  }, [dispatch, setsData, isSuccess]);

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

  const subsets = subsetsData?.data?.sets || [];
  const setName = isSetLoading ? '' : set?.name || 'Set not found';

  const { previousSet, nextSet, handleSetNavigation } = useSetNavigation({
    currentSetId: set?.id,
    baseUrl: '/browse/sets',
  });

  const handleSubsetSelect = useCallback((subsetId: string) => {
    // First, open/expand the subset
    const toggleFunction = subsetToggleRefs.current[subsetId];
    if (toggleFunction) {
      toggleFunction();
    }

    // Then scroll to it after a brief delay to allow expansion
    setTimeout(() => {
      const element = subsetRefs.current[subsetId];
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, SUBSET_EXPANSION_DELAY_MS);
  }, []);

  const isCardGridView = browseController.view === 'cards' && browseController.viewMode === 'grid';
  const isCardTableView = browseController.view === 'cards' && browseController.viewMode === 'table';

  const cardsProps = browseController.cardsProps as CardsProps;

  if (isSetLoading) {
    return (
      <Box>
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Browse', href: '/browse' },
            { label: 'Sets', href: '/browse?contentType=sets' },
          ]}
        />
        <Box sx={{ fontWeight: 'bold', fontSize: '1.5rem', mb: 2 }}></Box>
      </Box>
    );
  }

  if (!set && !isSetLoading) {
    const handleResetSearch = () => {
      dispatch(resetSearch());
    };

    return (
      <Box>
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Browse', href: '/browse' },
            { label: 'Sets', href: '/browse?contentType=sets' },
            { label: 'Set not found' },
          ]}
        />
        <InfoBanner
          title="Set not found or no cards found in it matching your criteria"
          message="The requested set might not exist, or there are no cards that match your current filter settings."
          action={
            <Button variant="outlined" startIcon={<RestartAltIcon />} onClick={handleResetSearch}>
              Reset Search
            </Button>
          }
        />
      </Box>
    );
  }

  const formatSetCategoryAndType = (set: any) => {
    const category = set.category ? capitalize(set.category) : null;
    const type = set.setType ? capitalize(set.setType) : null;

    if (category && type) return `${category} Set - ${type}`;
    if (category) return `${category} Set`;
    if (type) return type;
    return 'Special Set';
  };

  return (
    <Box>
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Browse', href: '/browse' },
          { label: 'Sets', href: '/browse?contentType=sets' },
          { label: setName },
        ]}
      />

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        <SetNavigationButtons
          previousSet={previousSet}
          nextSet={nextSet}
          onNavigate={handleSetNavigation}
        />

        <Typography
          variant="h4"
          fontWeight="500"
          sx={(theme) => ({
            color: theme.palette.primary.main,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '100%',
            [theme.breakpoints.down('sm')]: {
              fontSize: '1.5rem',
              whiteSpace: 'normal',
              wordBreak: 'break-word',
            },
            [theme.breakpoints.up('sm')]: {
              whiteSpace: 'nowrap',
            },
          })}
        >
          {setName}
        </Typography>

        <Typography variant="body1" color="text.secondary">
          {set && formatSetCategoryAndType(set)}
        </Typography>

        <Typography variant="body1" color="text.secondary">
          {set?.releasedAt && formatISODate(set.releasedAt)}
        </Typography>

        {set?.code && (
          <Box>
            <SetIcon code={set.code} size="5x" fixedWidth />
          </Box>
        )}

        <Typography variant="body1" color="text.secondary">
          {set?.cardCount ? `${set.cardCount} cards` : 'N/A'}
        </Typography>

        {set && costToCompleteData?.data && (
          <SetPageBuyButton
            set={set}
            costToComplete={costToCompleteData.data.sets.find(s => s.id === set.id)?.costToComplete}
            includeSubsetsInSets={currentIncludeSubsetsInSets}
            isCollection={false}
          />
        )}
      </Box>

      <Pagination
        {...browseController.paginationProps}
        hideContentTypeToggle={true}
        subsets={subsets}
        onSubsetSelect={handleSubsetSelect}
        parentSet={parentSet}
        currentPath={pathname}
      />
      <SearchDescription forceView="cards" />

      {browseController.error ? (
        <ErrorBanner type={browseController.view} />
      ) : (
        <Box
          sx={{
            opacity: cardsProps?.isFetching ? 0 : 1,
            transition: 'opacity 0.2s ease-in-out',
            minHeight: cardsProps?.items?.length ? 'auto' : '400px',
          }}
        >
          {isCardGridView && <CardGrid {...cardsProps} />}
          {isCardTableView && <CardTable {...cardsProps} />}
        </Box>
      )}

      <Pagination {...browseController.paginationProps} position="bottom" hideContentTypeToggle={true} />

      {subsets.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" fontWeight="500" sx={{ mb: 3, color: (theme) => theme.palette.primary.main }}>
            Subsets
          </Typography>
          {subsets.map((subset) => (
            <SubsetSection
              key={subset.id}
              subset={subset}
              searchParams={cardSearchParams}
              ref={(el) => {
                if (el) {
                  subsetRefs.current[subset.id] = el;
                }
              }}
              onRegisterToggle={(toggleFn) => {
                subsetToggleRefs.current[subset.id] = toggleFn;
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
