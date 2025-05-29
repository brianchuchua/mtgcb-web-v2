'use client';

import { Box, Container, Paper, Typography } from '@mui/material';
import React from 'react';
import { useCardRowRenderer, useCardTableColumns } from '@/components/cards/CardTableRenderer';
import { useSetRowRenderer, useSetTableColumns } from '@/components/sets/SetTableRenderer';
import { useCollectionSetRowRenderer, useCollectionSetTableColumns } from '@/components/collections/CollectionSetTableRenderer';
import VirtualizedTable from '@/components/common/VirtualizedTable';

const TestLinksPage = () => {
  // Mock card data
  const mockCards = [
    {
      id: '1',
      name: 'Lightning Bolt',
      setName: 'Limited Edition Alpha',
      setSlug: 'limited-edition-alpha',
      collectorNumber: '159',
      rarity: 'common',
      type: 'Instant',
      artist: 'Christopher Rush',
      manaCost: '{R}',
      market: '10.00',
    },
    {
      id: '2',
      name: 'Black Lotus',
      setName: 'Limited Edition Alpha',
      setSlug: 'limited-edition-alpha',
      collectorNumber: '232',
      rarity: 'rare',
      type: 'Artifact',
      artist: 'Christopher Rush',
      manaCost: '{0}',
      market: '100000.00',
    },
  ];

  // Mock set data
  const mockSets = [
    {
      id: '1',
      name: 'Limited Edition Alpha',
      slug: 'limited-edition-alpha',
      code: 'LEA',
      setType: 'core',
      category: 'base',
      releasedAt: '1993-08-05',
      cardCount: '295',
      isDraftable: false,
    },
    {
      id: '2',
      name: 'Limited Edition Beta',
      slug: 'limited-edition-beta',
      code: 'LEB',
      setType: 'core',
      category: 'base',
      releasedAt: '1993-10-01',
      cardCount: '302',
      isDraftable: false,
    },
  ];

  const cardDisplaySettings = {
    setIsVisible: true,
    collectorNumberIsVisible: true,
    mtgcbNumberIsVisible: false,
    rarityIsVisible: true,
    typeIsVisible: true,
    artistIsVisible: true,
    manaCostIsVisible: true,
    powerIsVisible: false,
    toughnessIsVisible: false,
    loyaltyIsVisible: false,
    priceIsVisible: true,
    quantityIsVisible: false,
  };

  const setDisplaySettings = {
    codeIsVisible: true,
    cardCountIsVisible: true,
    releaseDateIsVisible: true,
    typeIsVisible: true,
    categoryIsVisible: true,
    isDraftableIsVisible: true,
  };

  const collectionSetDisplaySettings = {
    ...setDisplaySettings,
    completionIsVisible: true,
    costToCompleteIsVisible: true,
    valueIsVisible: true,
  };

  const cardColumns = useCardTableColumns(
    { priceType: 'market', displaySettings: cardDisplaySettings },
    'name'
  );

  const setColumns = useSetTableColumns(
    { displaySettings: setDisplaySettings },
    'name'
  );

  const collectionSetColumns = useCollectionSetTableColumns(
    { displaySettings: collectionSetDisplaySettings },
    'name'
  );

  const renderCardRow = useCardRowRenderer('market', cardDisplaySettings);
  const renderSetRow = useSetRowRenderer(setDisplaySettings);
  const renderCollectionSetRow = useCollectionSetRowRenderer(collectionSetDisplaySettings);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Table Link Test Page
      </Typography>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Card Table (Browse Mode)
        </Typography>
        <Paper elevation={1}>
          <VirtualizedTable
            items={mockCards}
            columns={cardColumns}
            renderRowContent={renderCardRow}
            isLoading={false}
            sortBy="name"
            sortOrder="asc"
            onSortChange={() => {}}
            emptyMessage="No cards"
            computeItemKey={(index) => mockCards[index]?.id || index}
          />
        </Paper>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Set Table (Browse Mode)
        </Typography>
        <Paper elevation={1}>
          <VirtualizedTable
            items={mockSets}
            columns={setColumns}
            renderRowContent={renderSetRow}
            isLoading={false}
            sortBy="name"
            sortOrder="asc"
            onSortChange={() => {}}
            emptyMessage="No sets"
            computeItemKey={(index) => mockSets[index]?.id || index}
          />
        </Paper>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Set Table (Collection Mode - simulating /collections/123)
        </Typography>
        <Paper elevation={1}>
          <VirtualizedTable
            items={mockSets.map(set => ({ ...set, percentageCollected: 75, totalValue: 1234.56, costToComplete: { oneOfEachCard: 567.89 } }))}
            columns={collectionSetColumns}
            renderRowContent={renderCollectionSetRow}
            isLoading={false}
            sortBy="name"
            sortOrder="asc"
            onSortChange={() => {}}
            emptyMessage="No sets"
            computeItemKey={(index) => mockSets[index]?.id || index}
          />
        </Paper>
      </Box>

      <Box sx={{ mt: 4 }}>
        <Typography variant="body2" color="text.secondary">
          Test Instructions:
        </Typography>
        <Typography variant="body2" color="text.secondary">
          1. In the Card Table, card names should be clickable links to /browse/cards/[cardSlug]/[cardId]
        </Typography>
        <Typography variant="body2" color="text.secondary">
          2. In the Card Table, set names should be clickable and context-aware
        </Typography>
        <Typography variant="body2" color="text.secondary">
          3. In the Set Tables, both code and name should be clickable links
        </Typography>
        <Typography variant="body2" color="text.secondary">
          4. Links should navigate to /browse/sets/[setSlug] or /collections/[userId]/[setSlug] based on context
        </Typography>
      </Box>
    </Container>
  );
};

export default TestLinksPage;