'use client';

import { Box } from '@mui/material';
import React from 'react';
import { SearchDescription } from '@/components/browse/SearchDescription';
import { Pagination } from '@/components/pagination';
import SetDisplay, { SetDisplayProps } from '@/components/sets/SetDisplay';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { CardsProps } from '@/features/browse/types/browseController';
import { useBrowseController } from '@/features/browse/useBrowseController';
import { CardGrid, CardTable, ErrorBanner } from '@/features/browse/views';

export default function BrowseClient() {
  const browseController = useBrowseController();

  const isCardGridView = browseController.view === 'cards' && browseController.viewMode === 'grid';
  const isCardTableView = browseController.view === 'cards' && browseController.viewMode === 'table';
  const isSetGridView = browseController.view === 'sets' && browseController.viewMode === 'grid';
  const isSetTableView = browseController.view === 'sets' && browseController.viewMode === 'table';

  const cardsProps = browseController.cardsProps as CardsProps;
  const setsProps = browseController.setsProps as SetDisplayProps;

  return (
    <Box>
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Browse' }]} />
      <Pagination {...browseController.paginationProps} />
      <SearchDescription />

      {browseController.error ? (
        <ErrorBanner type={browseController.view} />
      ) : (
        <>
          {isCardGridView && <CardGrid {...cardsProps} />}
          {isCardTableView && <CardTable {...cardsProps} />}
          {isSetGridView && <SetDisplay {...setsProps} viewMode="grid" data-testid="sets-grid" />}
          {isSetTableView && <SetDisplay {...setsProps} viewMode="table" data-testid="sets-table" />}
        </>
      )}

      <Pagination {...browseController.paginationProps} position="bottom" />
    </Box>
  );
}
