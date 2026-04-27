'use client';

import ImportContactsIcon from '@mui/icons-material/ImportContacts';
import { Box, Button, Paper, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import NextLink from 'next/link';
import React, { useMemo, useState } from 'react';
import { useGetCardsQuery } from '@/api/browse/browseApi';
import { CardModel } from '@/api/browse/types';
import { useGetAllSetsQuery } from '@/api/sets/setsApi';
import {
  CardDetailsSection,
  CardLegalitySection,
  CardPricesSection,
  OtherPrintingsSection,
} from '@/components/cards/CardDetails';
import { CardImageDisplay } from '@/components/cards/CardImageDisplay';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { useAuth } from '@/hooks/useAuth';
import { usePriceType } from '@/hooks/usePriceType';
import { extractBaseName } from '@/utils/cards/extractBaseName';
import { getCollectionCardUrl } from '@/utils/collectionUrls';

interface CardBrowseClientProps {
  cardId: string;
  cardSlug: string;
}

const selectFields: Array<keyof CardModel | string> = [
  'id',
  'name',
  'scryfallId',
  'setId',
  'setName',
  'setSlug',
  'setCode',
  'rarity',
  'rarityNumeric',
  'collectorNumber',
  'mtgcbCollectorNumber',
  'type',
  'artist',
  'manaCost',
  'convertedManaCost',
  'powerNumeric',
  'toughnessNumeric',
  'loyaltyNumeric',
  'tcgplayerId',
  'tcgplayerName',
  'tcgplayerSetCode',
  'market',
  'low',
  'average',
  'high',
  'foil',
  'prices',
  'pricesUpdatedAt',
  'cardKingdomRetail',
  'cardKingdomFoil',
  'cardKingdomUrl',
  'cardKingdomFoilUrl',
  'cardKingdomPricesUpdatedAt',
  'releasedAt',
  'canBeFoil',
  'canBeNonFoil',
  'flavorName',
  'oracleText',
  'flavorText',
  'pureName',
  'isReserved',
  'legalities',
];

const otherPrintingsSelectFields: Array<keyof CardModel | string> = [
  'id',
  'name',
  'setId',
  'setName',
  'setSlug',
  'setCode',
  'collectorNumber',
  'rarity',
  'market',
  'low',
  'average',
  'high',
  'foil',
  'prices',
  'releasedAt',
  'flavorName',
  'quantityReg',
  'quantityFoil',
];

export default function CardBrowseClient({ cardId, cardSlug }: CardBrowseClientProps) {
  const { user, isAuthenticated } = useAuth();
  const priceType = usePriceType();
  const [otherPrintingsPage, setOtherPrintingsPage] = useState(0);
  const printingsPerPage = 20;

  const {
    data: cardsData,
    isLoading,
    error,
  } = useGetCardsQuery(
    {
      id: cardId,
      limit: 1,
      offset: 0,
      select: selectFields as string[],
    },
    {
      skip: !cardId,
    },
  );

  const card = cardsData?.data?.cards?.[0];
  const cardName = isLoading ? 'Loading...' : card?.name || 'Card not found';

  // Calculate which batch of 500 we need based on current page
  const apiOffset = Math.floor((otherPrintingsPage * printingsPerPage) / 500) * 500;

  const { data: otherPrintingsData, isLoading: isOtherPrintingsLoading } = useGetCardsQuery(
    {
      pureName: `"${(card as any)?.pureName || extractBaseName(card?.name)}"`,
      limit: 500,
      offset: apiOffset,
      sortBy: 'releasedAt',
      sortDirection: 'desc',
      select: otherPrintingsSelectFields as string[],
    },
    {
      skip: !card?.name,
    },
  );

  const otherPrintings = useMemo(() => {
    if (!otherPrintingsData?.data?.cards || !cardId) return [];
    return otherPrintingsData.data.cards.filter((printing) => printing.id !== cardId);
  }, [otherPrintingsData?.data?.cards, cardId]);

  const paginatedPrintings = useMemo(() => {
    // Calculate position within the current 500-item batch
    const localStart = (otherPrintingsPage * printingsPerPage) % 500;
    const localEnd = Math.min(localStart + printingsPerPage, otherPrintings.length);
    return otherPrintings.slice(localStart, localEnd);
  }, [otherPrintings, otherPrintingsPage]);

  const totalPrintingCount = otherPrintingsData?.data?.totalCount ? otherPrintingsData.data.totalCount - 1 : 0;
  const totalPrintingPages = Math.ceil(totalPrintingCount / printingsPerPage);

  const priceData = useMemo(() => {
    if (!card) return null;

    const prices = card.prices || {
      normal: {
        market: card.market ? parseFloat(card.market) : null,
        low: card.low ? parseFloat(card.low) : null,
        average: card.average ? parseFloat(card.average) : null,
        high: card.high ? parseFloat(card.high) : null,
      },
      foil: card.foil
        ? {
            market: parseFloat(card.foil),
            low: null,
            average: null,
            high: null,
          }
        : null,
    };

    return prices;
  }, [card]);

  // Memorabilia printings (CED, 30A, WC decks, PTC, oversized promos) aren't tournament-legal
  // regardless of the card's oracle legality. Use the cached all-sets query to look up the
  // set's type by id; swap the legality table for an explanatory note when memorabilia.
  // Note: the /sets/all endpoint returns `id` as a number despite the TS type claiming string;
  // `card.setId` is stringified by formatCard on the backend. Coerce both sides to compare.
  const { data: allSetsResponse } = useGetAllSetsQuery();
  const isNonTournamentLegalPrinting = useMemo(() => {
    if (!card?.setId || !allSetsResponse?.data?.sets) return false;
    const matchingSet = allSetsResponse.data.sets.find((s) => String(s.id) === String(card.setId));
    return matchingSet?.setType === 'memorabilia';
  }, [card?.setId, allSetsResponse]);

  if (isLoading) {
    return (
      <Box>
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Browse', href: '/browse' },
            { label: 'Cards', href: '/browse?contentType=cards' },
          ]}
        />
        <Box sx={{ fontWeight: 'bold', fontSize: '1.5rem', mb: 2 }}>Loading...</Box>
      </Box>
    );
  }

  if (error || (!card && !isLoading)) {
    return (
      <Box>
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Browse', href: '/browse' },
            { label: 'Cards', href: '/browse?contentType=cards' },
            { label: 'Card not found' },
          ]}
        />
        <Box sx={{ fontWeight: 'bold', fontSize: '1.5rem', mb: 2 }}>Card not found</Box>
      </Box>
    );
  }

  return (
    <Box>
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Browse', href: '/browse' },
          { label: 'Cards', href: '/browse?contentType=cards' },
          { label: cardName },
        ]}
      />

      {/* Compact Three Column Layout */}
      <Grid container spacing={2} sx={{ mt: 1, alignItems: 'flex-start' }}>
        {/* Column 1: Card Image */}
        <Grid size={{ xs: 12, md: 12, lg: 3.5 }}>
          <CardImageDisplay
            cardId={cardId}
            cardName={card?.name}
            setName={card?.setName}
            tcgplayerId={card?.tcgplayerId || undefined}
            // On the detail page we want clicking the image to open a buy-options menu
            // (not a one-click direct route to TCGPlayer), so the user can pick TCG or
            // Card Kingdom with equal prominence.
            showBuyMenuOnClick={true}
            hideViewCardOption={true}
            tcgHasRegular={Boolean(
              priceData?.normal &&
                (priceData.normal.market != null ||
                  priceData.normal.low != null ||
                  priceData.normal.average != null ||
                  priceData.normal.high != null),
            )}
            tcgHasFoil={Boolean(
              priceData?.foil &&
                (priceData.foil.market != null ||
                  priceData.foil.low != null ||
                  priceData.foil.average != null ||
                  priceData.foil.high != null),
            )}
            cardKingdomUrl={card?.cardKingdomUrl}
            cardKingdomFoilUrl={card?.cardKingdomFoilUrl}
            maxWidth={{ xs: 400, sm: 500, md: 600 }}
          />

          {/* View in Collection Button */}
          {isAuthenticated && (
            <Paper
              elevation={0}
              sx={{
                mt: 2,
                p: 1.5,
                backgroundColor: (theme) => theme.palette.background.default,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <Button
                component={NextLink}
                href={user?.userId ? getCollectionCardUrl(user.userId, cardSlug, cardId) : '#'}
                variant="contained"
                color="secondary"
                size="small"
                startIcon={<ImportContactsIcon sx={{ mb: 0.25 }} />}
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                }}
              >
                View in your collection
              </Button>
            </Paper>
          )}
        </Grid>

        {/* Column 2: Card Details */}
        <Grid size={{ xs: 12, md: 12, lg: 4.5 }}>
          <Paper elevation={0} sx={{ p: 3, backgroundColor: (theme) => theme.palette.background.default }}>
            <CardDetailsSection card={card as any} isCollectionView={false} />
            {(isNonTournamentLegalPrinting || (card?.legalities && Object.keys(card.legalities).length > 0)) && (
              <Box sx={{ mt: 3 }}>
                <CardLegalitySection
                  legalities={card?.legalities}
                  isNonTournamentLegal={isNonTournamentLegalPrinting}
                />
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Column 3: Prices and Other Printings */}
        <Grid size={{ xs: 12, md: 12, lg: 4 }}>
          {/* Prices Section */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 2,
              backgroundColor: (theme) => theme.palette.background.default,
            }}
          >
            <CardPricesSection
              priceData={priceData}
              tcgplayerId={card?.tcgplayerId}
              cardName={card?.name}
              pricesUpdatedAt={card?.pricesUpdatedAt}
              cardKingdomRetail={card?.cardKingdomRetail}
              cardKingdomFoil={card?.cardKingdomFoil}
              cardKingdomUrl={card?.cardKingdomUrl}
              cardKingdomFoilUrl={card?.cardKingdomFoilUrl}
              cardKingdomPricesUpdatedAt={card?.cardKingdomPricesUpdatedAt}
            />
          </Paper>

          {/* Other Printings Section */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              backgroundColor: (theme) => theme.palette.background.default,
            }}
          >
            <OtherPrintingsSection
              printings={paginatedPrintings as any[]}
              currentPage={otherPrintingsPage}
              totalCount={totalPrintingCount}
              itemsPerPage={printingsPerPage}
              isLoading={isOtherPrintingsLoading}
              priceType={priceType}
              isCollectionView={false}
              onPageChange={setOtherPrintingsPage}
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
