'use client';

import { Box, Typography } from '@mui/material';
import React, { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import SubsetSection from './SubsetSection';
import { useGetSetsQuery } from '@/api/browse/browseApi';
import { Pagination } from '@/components/pagination';
import SubsetDropdown from '@/components/pagination/SubsetDropdown';
import SetIcon from '@/components/sets/SetIcon';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { CardsProps } from '@/features/browse/types/browseController';
import { useBrowseController } from '@/features/browse/useBrowseController';
import { CardGrid, CardTable, ErrorBanner } from '@/features/browse/views';
import { selectCardSearchParams, selectSets, setSets, setViewContentType } from '@/redux/slices/browseSlice';
import { SetFilter } from '@/types/browse';
import capitalize from '@/utils/capitalize';
import { formatISODate } from '@/utils/dateUtils';

interface SetBrowseClientProps {
  setSlug: string;
}

export default function SetBrowseClient({ setSlug }: SetBrowseClientProps) {
  const dispatch = useDispatch();
  const browseController = useBrowseController();
  const subsetRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const subsetToggleRefs = useRef<Record<string, () => void>>({});

  // Get current search parameters to pass to subsets
  const cardSearchParams = useSelector(selectCardSearchParams);
  const currentSetsFilter = useSelector(selectSets);

  const {
    data: setsData,
    isSuccess,
    isLoading: isSetLoading,
  } = useGetSetsQuery({
    limit: 1,
    slug: setSlug,
  });

  const set = setsData?.data?.sets?.[0];

  const { data: subsetsData, isLoading: isSubsetsLoading } = useGetSetsQuery(
    {
      parentSetId: set?.id,
      limit: 100,
    },
    {
      skip: !set?.id,
    },
  );

  useEffect(() => {
    dispatch(setViewContentType('cards'));

    if (isSuccess && setsData?.data?.sets && setsData.data.sets.length > 0) {
      const set = setsData.data.sets[0];

      const setFilter: SetFilter = {
        include: [set.id],
        exclude: [],
      };

      dispatch(setSets(setFilter));
    }
  }, [dispatch, setsData, isSuccess, setSlug]);

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
    }, 100);
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
        <Box sx={{ fontWeight: 'bold', fontSize: '1.5rem', mb: 2 }}>Set not found</Box>
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
        }}
      >
        <Typography
          variant="h4"
          fontWeight="500"
          sx={{
            color: (theme) => theme.palette.primary.main,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '100%',
          }}
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
      </Box>

      <Pagination
        {...browseController.paginationProps}
        hideContentTypeToggle={true}
        subsets={subsets}
        onSubsetSelect={handleSubsetSelect}
      />

      {browseController.error ? (
        <ErrorBanner type={browseController.view} />
      ) : (
        <>
          {isCardGridView && <CardGrid {...cardsProps} />}
          {isCardTableView && <CardTable {...cardsProps} />}
        </>
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
