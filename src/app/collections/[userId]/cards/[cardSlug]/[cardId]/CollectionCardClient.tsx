'use client';

import { Box, Link, Paper, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import React, { useMemo, useState } from 'react';
import { useGetCardsQuery } from '@/api/browse/browseApi';
import { CardModel } from '@/api/browse/types';
import CardItem from '@/components/cards/CardItem';
import { CardDetailsSection, CardPricesSection, OtherPrintingsSection } from '@/components/cards/CardDetails';
import { SharedCollectionBanner } from '@/components/collections/SharedCollectionBanner';
import { InvalidShareLinkBanner } from '@/components/collections/InvalidShareLinkBanner';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { useAuth } from '@/hooks/useAuth';
import { useShareTokenContext } from '@/contexts/ShareTokenContext';
import { usePriceType } from '@/hooks/usePriceType';
import { generateTCGPlayerLink } from '@/utils/affiliateLinkBuilder';
import { extractBaseName } from '@/utils/cards/extractBaseName';
import PrivacyErrorBanner from '@/features/browse/views/PrivacyErrorBanner';
import { getCollectionUrl } from '@/utils/collectionUrls';

interface CollectionCardClientProps {
  userId: number;
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
  'releasedAt',
  'canBeFoil',
  'canBeNonFoil',
  'quantityReg',
  'quantityFoil',
  'locations',
  'flavorName',
  'oracleText',
  'flavorText',
  'pureName',
  'isReserved',
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
  'quantityReg',
  'quantityFoil',
  'flavorName',
];


export default function CollectionCardClient({ userId, cardId, cardSlug }: CollectionCardClientProps) {
  const { user } = useAuth();
  const { shareToken, isViewingSharedCollection } = useShareTokenContext();
  const isOwnCollection = user?.userId === userId;
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
      userId,
      priceType,
      limit: 1,
      offset: 0,
      select: selectFields as string[],
      includeLocations: true,
    },
    {
      skip: !cardId,
    },
  );

  const card = cardsData?.data?.cards?.[0];
  const cardName = isLoading ? 'Loading...' : card?.name || 'Card not found';
  const username = cardsData?.data?.username || `User ${userId}`;

  // Calculate which batch of 500 we need based on current page
  const apiOffset = Math.floor((otherPrintingsPage * printingsPerPage) / 500) * 500;
  
  const { data: otherPrintingsData, isLoading: isOtherPrintingsLoading } = useGetCardsQuery(
    {
      pureName: `"${(card as any)?.pureName || extractBaseName(card?.name)}"`,
      userId,
      priceType,
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

  if (isLoading) {
    return (
      <Box>
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Collection', href: getCollectionUrl({ userId }) },
            { label: 'Cards', href: getCollectionUrl({ userId, contentType: 'cards' }) },
          ]}
        />
        <Box sx={{ fontWeight: 'bold', fontSize: '1.5rem', mb: 2 }}>Loading...</Box>
      </Box>
    );
  }

  // Check for privacy error (403)
  const isPrivacyError = error && 'status' in error && error.status === 403;
  const hasInvalidShareLink = shareToken && isViewingSharedCollection(userId) && isPrivacyError;
  
  if (isPrivacyError) {
    return (
      <Box>
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: hasInvalidShareLink ? 'Invalid share link' : 'Private user' },
          ]}
        />
        <Box sx={{ mt: 3 }}>
          {hasInvalidShareLink ? (
            <InvalidShareLinkBanner username={username} />
          ) : (
            <PrivacyErrorBanner />
          )}
        </Box>
      </Box>
    );
  }
  
  if (error || (!card && !isLoading)) {
    return (
      <Box>
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Collection', href: getCollectionUrl({ userId }) },
            { label: 'Cards', href: getCollectionUrl({ userId, contentType: 'cards' }) },
            { label: 'Card not found' },
          ]}
        />
        <Box sx={{ fontWeight: 'bold', fontSize: '1.5rem', mb: 2 }}>Card not found</Box>
      </Box>
    );
  }

  return (
    <Box>
      {!hasInvalidShareLink && (
        <SharedCollectionBanner username={username || 'User'} userId={userId} />
      )}
      
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Collection', href: getCollectionUrl({ userId }) },
          { label: 'Cards', href: getCollectionUrl({ userId, contentType: 'cards' }) },
          { label: cardName },
        ]}
      />

      {/* Compact Three Column Layout */}
      <Grid container spacing={2} sx={{ mt: 1, alignItems: 'flex-start' }}>
        {/* Column 1: Card Image & Collection Management */}
        <Grid size={{ xs: 12, md: 12, lg: 3.5 }}>
          <CardItem
            id={cardId}
            name={card?.name || ''}
            setCode={card?.setCode}
            setName={card?.setName}
            setSlug={card?.setSlug}
            tcgplayerId={card?.tcgplayerId ? Number(card.tcgplayerId) : undefined}
            collectorNumber={card?.collectorNumber}
            rarity={card?.rarity}
            prices={priceData || undefined}
            quantityReg={card?.quantityReg}
            quantityFoil={card?.quantityFoil}
            canBeFoil={card?.canBeFoil}
            canBeNonFoil={card?.canBeNonFoil}
            locations={card?.locations}
            isOwnCollection={isOwnCollection}
            priceType={priceType}
            imageLinksToTCGPlayer={true}
            directPriceToTCGPlayer={true}
            display={{
              nameIsVisible: true,
              setIsVisible: true,
              priceIsVisible: true,
              quantityIsVisible: true,
              goalProgressIsVisible: false,
              locationsIsVisible: true,
            }}
          />
        </Grid>

        {/* Column 2: Card Details */}
        <Grid size={{ xs: 12, md: 12, lg: 4.5 }}>
          <Paper elevation={0} sx={{ p: 3, backgroundColor: (theme) => theme.palette.background.default }}>
            <CardDetailsSection 
              card={card as any} 
              userId={userId} 
              isCollectionView={true} 
            />
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
              userId={userId}
              isCollectionView={true}
              onPageChange={setOtherPrintingsPage}
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}