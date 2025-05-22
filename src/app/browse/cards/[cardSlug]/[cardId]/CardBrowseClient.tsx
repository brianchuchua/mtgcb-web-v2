'use client';

// TODO: This is an AI-generated stub and it's a mess.
import {
  Box,
  Chip,
  Grid,
  Link,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import NextLink from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';
import { useGetCardsQuery } from '@/api/browse/browseApi';
import { CardModel } from '@/api/browse/types';
import CardPrice from '@/components/cards/CardPrice';
import SetIcon from '@/components/sets/SetIcon';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { PriceType } from '@/types/pricing';
import { generateTCGPlayerLink } from '@/utils/affiliateLinkBuilder';
import capitalize from '@/utils/capitalize';
import { generateCardUrl } from '@/utils/cards/generateCardSlug';
import { formatISODate } from '@/utils/dateUtils';

interface CardBrowseClientProps {
  cardId: string;
  cardSlug: string;
}

export default function CardBrowseClient({ cardId, cardSlug }: CardBrowseClientProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const {
    data: cardsData,
    isSuccess,
    isLoading,
    error,
  } = useGetCardsQuery(
    {
      id: cardId, // Filter by specific card ID
      limit: 1,
      offset: 0,
      select: [
        'id',
        'name',
        'scryfallId',
        'setId',
        'setName',
        'setSlug',
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
        'releaseDate',
      ] as Array<keyof CardModel>,
    },
    {
      skip: !cardId,
    },
  );

  const card = cardsData?.data?.cards?.[0];
  const cardName = isLoading ? 'Loading...' : card?.name || 'Card not found';

  // Query for other printings of the same card
  const { data: otherPrintingsData, isLoading: isOtherPrintingsLoading } = useGetCardsQuery(
    {
      name: card?.name, // Search by the card name (pureName)
      limit: 50, // Get up to 50 other printings
      offset: 0,
      sortBy: 'releaseDate',
      sortDirection: 'desc',
      select: [
        'id',
        'name',
        'setId',
        'setName',
        'setSlug',
        'collectorNumber',
        'rarity',
        'market',
        'low',
        'average',
        'high',
        'foil',
        'prices',
        'releaseDate',
      ] as Array<keyof CardModel>,
    },
    {
      skip: !card?.name, // Don't run until we have the card name
    },
  );

  // Filter out the current card from other printings
  const otherPrintings = useMemo(() => {
    if (!otherPrintingsData?.data?.cards || !cardId) return [];
    return otherPrintingsData.data.cards.filter((printing) => printing.id !== cardId);
  }, [otherPrintingsData?.data?.cards, cardId]);

  // Get image URL using the same pattern as CardItem component
  const getImageUrl = () => {
    if (!cardId) return null;
    return `https://mtgcb-images.s3.amazonaws.com/cards/images/normal/${cardId}.jpg?v=${process.env.NEXT_PUBLIC_IMAGE_CACHE_DATE || '20241220'}`;
  };

  const imageUrl = getImageUrl();

  const rarityColor = useMemo(() => {
    if (!card?.rarity) return 'default';
    switch (card.rarity.toLowerCase()) {
      case 'common':
        return 'default';
      case 'uncommon':
        return 'info';
      case 'rare':
        return 'warning';
      case 'mythic rare':
        return 'error';
      default:
        return 'default';
    }
  }, [card?.rarity]);

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

  const formatManaCost = (manaCost: string | null) => {
    if (!manaCost) return 'N/A';
    // This is a simple version - I might want to enhance with mana symbols
    return manaCost;
  };

  const formatPowerToughness = (power: string | null, toughness: string | null) => {
    if (!power && !toughness) return null;
    if (power && toughness) return `${power}/${toughness}`;
    if (power) return power;
    if (toughness) return toughness;
    return null;
  };

  const getBorderRadius = () => {
    return card?.setName === 'Limited Edition Alpha' ? '7%' : '5%';
  };

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

      <Grid container spacing={{ xs: 2, md: 4 }} sx={{ mt: 1 }}>
        {/* Card Image */}
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              maxWidth: { xs: 300, sm: 400 },
              margin: '0 auto',
              aspectRatio: '488/680', // Magic card aspect ratio
              borderRadius: getBorderRadius(),
              overflow: 'hidden',
              boxShadow: 3,
            }}
          >
            {!imageLoaded && !imageError && (
              <Skeleton
                variant="rectangular"
                width="100%"
                height="100%"
                animation="wave"
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  borderRadius: getBorderRadius(),
                }}
              />
            )}
            {imageUrl && !imageError ? (
              <Box
                component="img"
                src={imageUrl}
                alt={card?.name || 'Card image'}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  opacity: imageLoaded ? 1 : 0,
                  transition: 'opacity 0.7s ease-in-out',
                  borderRadius: getBorderRadius(),
                }}
              />
            ) : (
              <Paper
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'grey.100',
                  borderRadius: getBorderRadius(),
                  textAlign: 'center',
                  p: 2,
                }}
              >
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                  {card?.name || 'Card Name'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Image not available
                </Typography>
              </Paper>
            )}
          </Box>
        </Grid>

        {/* Card Details */}
        <Grid item xs={12} sm={6} md={8} lg={9}>
          <Typography
            variant="h3"
            fontWeight="600"
            sx={{
              color: (theme) => theme.palette.primary.main,
              mb: 2,
              fontSize: { xs: '1.75rem', sm: '2.125rem', md: '3rem' },
              lineHeight: 1.2,
            }}
          >
            {card?.name}
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Set
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  {card?.setSlug && <SetIcon code={card.setSlug} size="lg" fixedWidth />}
                  {card?.setName && card?.setSlug ? (
                    <NextLink href={`/browse/sets/${card.setSlug}`} passHref>
                      <Link
                        variant="body1"
                        sx={{
                          textDecoration: 'none',
                          color: 'inherit',
                          '&:hover': {
                            textDecoration: 'underline',
                            color: (theme) => theme.palette.primary.main,
                          },
                        }}
                      >
                        {card.setName}
                      </Link>
                    </NextLink>
                  ) : (
                    <Typography variant="body1">{card?.setName || 'Unknown Set'}</Typography>
                  )}
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Collector Number
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {card?.collectorNumber || 'N/A'}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Rarity
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Chip
                    label={capitalize(card?.rarity || 'Unknown')}
                    color={rarityColor}
                    variant="outlined"
                    size="small"
                  />
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Type
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {card?.type || 'N/A'}
                </Typography>
              </Grid>

              {card?.manaCost && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Mana Cost
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {formatManaCost(card.manaCost)}
                  </Typography>
                </Grid>
              )}

              {card?.convertedManaCost !== null && card && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Converted Mana Cost
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {card.convertedManaCost}
                  </Typography>
                </Grid>
              )}

              {formatPowerToughness(card?.powerNumeric || null, card?.toughnessNumeric || null) && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Power/Toughness
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {formatPowerToughness(card?.powerNumeric || null, card?.toughnessNumeric || null)}
                  </Typography>
                </Grid>
              )}

              {card?.loyaltyNumeric && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Loyalty
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {card.loyaltyNumeric}
                  </Typography>
                </Grid>
              )}

              {card?.artist && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Artist
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {card.artist}
                  </Typography>
                </Grid>
              )}

              {card?.releaseDate && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Release Date
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {formatISODate(card.releaseDate)}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>

          {/* Pricing Information */}
          {card && (
            <Box sx={{ mt: { xs: 2, md: 3 } }}>
              <Typography
                variant="h5"
                fontWeight="500"
                sx={{
                  mb: 2,
                  color: (theme) => theme.palette.primary.main,
                  fontSize: { xs: '1.25rem', sm: '1.5rem' },
                }}
              >
                Pricing
              </Typography>

              {/* Create structured price data */}
              {(() => {
                const priceData = card.prices || {
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

                const hasNormalPrices =
                  priceData.normal &&
                  (priceData.normal.market ||
                    priceData.normal.low ||
                    priceData.normal.average ||
                    priceData.normal.high);

                const hasFoilPrices = priceData.foil && priceData.foil.market;

                if (!hasNormalPrices && !hasFoilPrices) {
                  return (
                    <Typography variant="body1" color="text.secondary">
                      No pricing information available
                    </Typography>
                  );
                }

                return (
                  <Grid container spacing={2}>
                    {/* Normal Prices */}
                    {hasNormalPrices && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="h6" sx={{ mb: 1, fontWeight: 500 }}>
                          Normal
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {priceData.normal?.market && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2" color="text.secondary">
                                Market:
                              </Typography>
                              <Typography variant="body1" fontWeight="medium">
                                ${priceData.normal.market.toFixed(2)}
                              </Typography>
                            </Box>
                          )}
                          {priceData.normal?.low && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2" color="text.secondary">
                                Low:
                              </Typography>
                              <Typography variant="body1">${priceData.normal.low.toFixed(2)}</Typography>
                            </Box>
                          )}
                          {priceData.normal?.average && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2" color="text.secondary">
                                Average:
                              </Typography>
                              <Typography variant="body1">${priceData.normal.average.toFixed(2)}</Typography>
                            </Box>
                          )}
                          {priceData.normal?.high && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2" color="text.secondary">
                                High:
                              </Typography>
                              <Typography variant="body1">${priceData.normal.high.toFixed(2)}</Typography>
                            </Box>
                          )}
                        </Box>
                      </Grid>
                    )}

                    {/* Foil Prices */}
                    {hasFoilPrices && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="h6" sx={{ mb: 1, fontWeight: 500 }}>
                          Foil
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                              Market:
                            </Typography>
                            <Typography variant="body1" fontWeight="medium">
                              ${priceData.foil?.market?.toFixed(2) || '0.00'}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                );
              })()}

              {/* TCGPlayer Link */}
              {card && (card.tcgplayerId || card.name) && (
                <Box sx={{ mt: 2, textAlign: { xs: 'center', sm: 'left' } }}>
                  <Link
                    href={generateTCGPlayerLink(card.tcgplayerId, card.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 1,
                      textDecoration: 'none',
                      color: (theme) => theme.palette.primary.main,
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    <Typography variant="body2" fontWeight="medium">
                      Buy on TCGPlayer →
                    </Typography>
                  </Link>
                </Box>
              )}
            </Box>
          )}
        </Grid>
      </Grid>

      {/* Other Printings Section */}
      {card && (otherPrintings.length > 0 || isOtherPrintingsLoading) && (
        <Box sx={{ mt: 4 }}>
          <Typography
            variant="h4"
            fontWeight="600"
            sx={{
              mb: 3,
              color: (theme) => theme.palette.primary.main,
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' },
            }}
          >
            Other Printings
          </Typography>

          {isOtherPrintingsLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} variant="rectangular" height={60} />
              ))}
            </Box>
          ) : otherPrintings.length > 0 ? (
            <TableContainer component={Paper} sx={{ boxShadow: 2, overflowX: 'auto' }}>
              <Table sx={{ minWidth: { xs: 350, sm: 650 } }} aria-label="other printings table">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Set</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', display: { xs: 'none', sm: 'table-cell' } }}>
                      Collector #
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Rarity</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', display: { xs: 'none', md: 'table-cell' } }}>
                      Release Date
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Market Price</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {otherPrintings.map((printing) => {
                    const marketPrice =
                      printing.prices?.normal?.market || (printing.market ? parseFloat(printing.market) : null);

                    return (
                      <TableRow
                        key={printing.id}
                        sx={{
                          '&:hover': {
                            backgroundColor: (theme) => theme.palette.action.hover,
                          },
                        }}
                      >
                        {/* Set Name with Icon */}
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {printing.setSlug && <SetIcon code={printing.setSlug} size="1x" fixedWidth />}
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              {printing.setName && printing.setSlug ? (
                                <NextLink href={`/browse/sets/${printing.setSlug}`} passHref>
                                  <Link
                                    sx={{
                                      textDecoration: 'none',
                                      color: 'inherit',
                                      fontWeight: 'medium',
                                      '&:hover': {
                                        textDecoration: 'underline',
                                        color: (theme) => theme.palette.primary.main,
                                      },
                                    }}
                                  >
                                    {printing.setName}
                                  </Link>
                                </NextLink>
                              ) : (
                                <Typography variant="body2" fontWeight="medium">
                                  {printing.setName || 'Unknown Set'}
                                </Typography>
                              )}
                              {/* Card link */}
                              <NextLink href={generateCardUrl(printing.name, printing.id)} passHref>
                                <Link
                                  sx={{
                                    textDecoration: 'none',
                                    color: (theme) => theme.palette.text.secondary,
                                    fontSize: '0.875rem',
                                    '&:hover': {
                                      textDecoration: 'underline',
                                      color: (theme) => theme.palette.primary.main,
                                    },
                                  }}
                                >
                                  View Card →
                                </Link>
                              </NextLink>
                            </Box>
                          </Box>
                        </TableCell>

                        {/* Collector Number */}
                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                          <Typography variant="body2">{printing.collectorNumber || 'N/A'}</Typography>
                        </TableCell>

                        {/* Rarity */}
                        <TableCell>
                          <Chip
                            label={capitalize(printing.rarity || 'Unknown')}
                            size="small"
                            variant="outlined"
                            color={(() => {
                              switch (printing.rarity?.toLowerCase()) {
                                case 'common':
                                  return 'default';
                                case 'uncommon':
                                  return 'info';
                                case 'rare':
                                  return 'warning';
                                case 'mythic rare':
                                  return 'error';
                                default:
                                  return 'default';
                              }
                            })()}
                          />
                        </TableCell>

                        {/* Release Date */}
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                          <Typography variant="body2">
                            {printing.releaseDate ? formatISODate(printing.releaseDate) : 'N/A'}
                          </Typography>
                        </TableCell>

                        {/* Market Price */}
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {marketPrice ? `$${marketPrice.toFixed(2)}` : 'N/A'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body1" color="text.secondary">
              No other printings found for this card.
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}
