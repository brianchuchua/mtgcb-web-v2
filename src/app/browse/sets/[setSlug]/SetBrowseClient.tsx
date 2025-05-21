'use client';

import { Box, Typography } from '@mui/material';
import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useGetSetsQuery } from '@/api/browse/browseApi';
import { Pagination } from '@/components/pagination';
import SetIcon from '@/components/sets/SetIcon';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { CardsProps } from '@/features/browse/types/browseController';
import { useBrowseController } from '@/features/browse/useBrowseController';
import { CardGrid, CardTable, ErrorBanner } from '@/features/browse/views';
import { setSets, setViewContentType } from '@/redux/slices/browseSlice';
import { SetFilter } from '@/types/browse';
import capitalize from '@/utils/capitalize';
import { formatISODate } from '@/utils/dateUtils';

interface SetBrowseClientProps {
  setSlug: string;
}

export default function SetBrowseClient({ setSlug }: SetBrowseClientProps) {
  const dispatch = useDispatch();
  const browseController = useBrowseController();

  const {
    data: setsData,
    isSuccess,
    isLoading: isSetLoading,
  } = useGetSetsQuery({
    limit: 1,
    slug: setSlug,
  });

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

  const set = setsData?.data?.sets?.[0];
  const setName = isSetLoading ? 'Loading...' : set?.name || 'Set not found';

  const isCardGridView = browseController.view === 'cards' && browseController.viewMode === 'grid';
  const isCardTableView = browseController.view === 'cards' && browseController.viewMode === 'table';

  const cardsProps = browseController.cardsProps as CardsProps;

  if (isSetLoading) {
    return (
      <Box>
        <Breadcrumbs
          items={[{ label: 'Home', href: '/' }, { label: 'Browse', href: '/browse' }, { label: 'Loading...' }]}
        />
        <Box sx={{ fontWeight: 'bold', fontSize: '1.5rem', mb: 2 }}>Loading...</Box>
      </Box>
    );
  }

  if (!set && !isSetLoading) {
    return (
      <Box>
        <Breadcrumbs
          items={[{ label: 'Home', href: '/' }, { label: 'Browse', href: '/browse' }, { label: 'Set not found' }]}
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
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Browse', href: '/browse' }, { label: setName }]} />

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
      />

      {browseController.error ? (
        <ErrorBanner type={browseController.view} />
      ) : (
        <>
          {isCardGridView && <CardGrid {...cardsProps} />}
          {isCardTableView && <CardTable {...cardsProps} />}
        </>
      )}

      <Pagination
        {...browseController.paginationProps}
        position="bottom"
        hideContentTypeToggle={true}
      />
    </Box>
  );
}
