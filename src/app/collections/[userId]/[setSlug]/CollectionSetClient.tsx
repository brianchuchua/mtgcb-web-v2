'use client';

import { Box, Typography } from '@mui/material';
import Link from 'next/link';
import React, { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useGetSetsQuery } from '@/api/browse/browseApi';
import SubsetSection from '@/app/browse/sets/[setSlug]/SubsetSection';
import { CollectionProgressBar } from '@/components/collections/CollectionProgressBar';
import { Pagination } from '@/components/pagination';
import SubsetDropdown from '@/components/pagination/SubsetDropdown';
import SetIcon from '@/components/sets/SetIcon';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { CardsProps } from '@/features/browse/types/browseController';
import { CardGrid, CardTable, ErrorBanner } from '@/features/browse/views';
import { useCollectionBrowseController } from '@/features/collections/useCollectionBrowseController';
import { useSetPriceType } from '@/hooks/useSetPriceType';
import { selectCardSearchParams, selectSets, setSets, setViewContentType } from '@/redux/slices/browseSlice';
import { SetFilter } from '@/types/browse';
import capitalize from '@/utils/capitalize';
import { formatISODate } from '@/utils/dateUtils';

interface CollectionSetClientProps {
  userId: number;
  setSlug: string;
}

export const CollectionSetClient: React.FC<CollectionSetClientProps> = ({ userId, setSlug }) => {
  const dispatch = useDispatch();
  const browseController = useCollectionBrowseController({ userId });
  const subsetRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const subsetToggleRefs = useRef<Record<string, () => void>>({});
  const setPriceType = useSetPriceType();

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
    userId: userId,
    priceType: setPriceType,
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
  const username =
    browseController.setsProps && 'username' in browseController.setsProps
      ? browseController.setsProps.username
      : browseController.cardsProps && 'username' in browseController.cardsProps
        ? browseController.cardsProps.username
        : '';
  const collectionSummary =
    browseController.setsProps && 'collectionSummary' in browseController.setsProps
      ? browseController.setsProps.collectionSummary
      : browseController.cardsProps && 'collectionSummary' in browseController.cardsProps
        ? browseController.cardsProps.collectionSummary
        : null;

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
        <Box sx={{ fontWeight: 'bold', fontSize: '1.5rem', mb: 2 }}></Box>
      </Box>
    );
  }

  if (!set && !isSetLoading) {
    return (
      <Box>
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

        {username && (
          <Typography variant="body1" color="text.secondary" sx={{ m: 0.5 }}>
            (Part of{' '}
            <Link
              href={`/collections/${userId}?contentType=sets`}
              style={{
                color: 'inherit',
                textDecoration: 'underline',
              }}
            >
              {username}'s collection
            </Link>
            )
          </Typography>
        )}

        {set?.code && (
          <Box>
            <SetIcon code={set.code} size="5x" fixedWidth />
          </Box>
        )}

        {set && set.uniquePrintingsCollectedInSet !== undefined && (
          <>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 0 }}>
              {set.uniquePrintingsCollectedInSet}/{set.cardCount || 0}
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              ({set.totalCardsCollectedInSet || 0} total cards collected)
            </Typography>

            <Typography variant="h6" color="text.secondary" sx={{}}>
              Set value: $
              {(set.totalValue || 0).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Typography>

            <Box sx={{ mt: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <CollectionProgressBar
                percentage={set.percentageCollected || 0}
                height={24}
                showLabel={true}
                labelFormat="long"
                maxWidth="400px"
              />
            </Box>
          </>
        )}
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
};
