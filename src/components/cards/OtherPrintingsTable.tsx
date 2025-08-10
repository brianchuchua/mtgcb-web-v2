import {
  Box,
  Chip,
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
import React, { useMemo } from 'react';
import { CardModel } from '@/api/browse/types';
import SetIcon from '@/components/sets/SetIcon';
import capitalize from '@/utils/capitalize';
import { generateCardUrl } from '@/utils/cards/generateCardSlug';
import { formatISODate } from '@/utils/dateUtils';
import { getCollectionCardUrl, getCollectionSetUrl } from '@/utils/collectionUrls';

interface OtherPrintingsTableProps {
  otherPrintings: CardModel[];
  isLoading?: boolean;
  isCollectionContext?: boolean;
  userId?: number;
  compact?: boolean;
}

const getRarityColor = (rarity: string | undefined) => {
  if (!rarity) return 'default';
  switch (rarity.toLowerCase()) {
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
};

const getRarityAbbreviation = (rarity: string | undefined) => {
  if (!rarity) return '?';
  switch (rarity.toLowerCase()) {
    case 'common':
      return 'C';
    case 'uncommon':
      return 'U';
    case 'rare':
      return 'R';
    case 'mythic rare':
      return 'M';
    case 'special':
      return 'S';
    default:
      return rarity.charAt(0).toUpperCase();
  }
};

export const OtherPrintingsTable: React.FC<OtherPrintingsTableProps> = ({
  otherPrintings,
  isLoading = false,
  isCollectionContext = false,
  userId,
  compact = true,
}) => {
  const sortedPrintings = useMemo(() => {
    return [...otherPrintings].sort((a, b) => {
      // Sort by release date descending (newest first)
      if (a.releaseDate && b.releaseDate) {
        return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
      }
      return 0;
    });
  }, [otherPrintings]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} variant="rectangular" height={compact ? 48 : 60} />
        ))}
      </Box>
    );
  }

  if (otherPrintings.length === 0) {
    return (
      <Typography variant="body1" color="text.secondary">
        No other printings found for this card.
      </Typography>
    );
  }

  // Compact table design for better space utilization
  if (compact) {
    return (
      <TableContainer component={Paper} sx={{ boxShadow: 1, overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 350 }} aria-label="other printings table">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', py: 1 }}>Set</TableCell>
              <TableCell sx={{ fontWeight: 'bold', py: 1, width: '60px' }}>#</TableCell>
              <TableCell sx={{ fontWeight: 'bold', py: 1, width: '40px', textAlign: 'center' }}>R</TableCell>
              {isCollectionContext && (
                <>
                  <TableCell sx={{ fontWeight: 'bold', py: 1, width: '50px', textAlign: 'center' }}>Reg</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', py: 1, width: '50px', textAlign: 'center' }}>Foil</TableCell>
                </>
              )}
              <TableCell sx={{ fontWeight: 'bold', py: 1, width: '80px', textAlign: 'right' }}>Price</TableCell>
              <TableCell sx={{ fontWeight: 'bold', py: 1, width: '100px', display: { xs: 'none', md: 'table-cell' } }}>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedPrintings.map((printing) => {
              const marketPrice =
                printing.prices?.normal?.market || (printing.market ? parseFloat(printing.market) : null);
              const foilPrice = 
                printing.prices?.foil?.market || (printing.foil ? parseFloat(printing.foil) : null);
              
              const cardUrlParts = generateCardUrl(printing.name, printing.id).split('/').slice(-2);
              const cardSlug = cardUrlParts[0];
              const cardId = cardUrlParts[1];
              
              const cardUrl = isCollectionContext && userId
                ? getCollectionCardUrl(userId, cardSlug, cardId)
                : generateCardUrl(printing.name, printing.id);

              const setUrl = isCollectionContext && userId && printing.setSlug
                ? getCollectionSetUrl(userId, printing.setSlug)
                : `/browse/sets/${printing.setSlug}`;

              return (
                <TableRow
                  key={printing.id}
                  sx={{
                    '&:hover': {
                      backgroundColor: (theme) => theme.palette.action.hover,
                    },
                    '& td': {
                      py: 0.75,
                    },
                  }}
                >
                  {/* Set Name with Icon */}
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {printing.setSlug && (
                        <SetIcon code={printing.setSlug} size="1x" fixedWidth />
                      )}
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        {printing.setName && printing.setSlug ? (
                          <Link
                            component={NextLink}
                            href={setUrl}
                            sx={{
                              textDecoration: 'none',
                              color: 'inherit',
                              fontSize: '0.875rem',
                              fontWeight: 500,
                              display: 'block',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              '&:hover': {
                                textDecoration: 'underline',
                                color: (theme) => theme.palette.primary.main,
                              },
                            }}
                            title={printing.setName}
                          >
                            {printing.setName}
                          </Link>
                        ) : (
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontSize: '0.875rem',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={printing.setName || 'Unknown Set'}
                          >
                            {printing.setName || 'Unknown Set'}
                          </Typography>
                        )}
                        <Link
                          component={NextLink}
                          href={cardUrl}
                          sx={{
                            textDecoration: 'none',
                            color: (theme) => theme.palette.text.secondary,
                            fontSize: '0.75rem',
                            '&:hover': {
                              textDecoration: 'underline',
                              color: (theme) => theme.palette.primary.main,
                            },
                          }}
                        >
                          View →
                        </Link>
                      </Box>
                    </Box>
                  </TableCell>

                  {/* Collector Number */}
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '0.813rem' }}>
                      {printing.collectorNumber || '—'}
                    </Typography>
                  </TableCell>

                  {/* Rarity - Single Letter */}
                  <TableCell sx={{ textAlign: 'center' }}>
                    <Chip
                      label={getRarityAbbreviation(printing.rarity)}
                      size="small"
                      variant="outlined"
                      color={getRarityColor(printing.rarity)}
                      sx={{ 
                        minWidth: '28px',
                        height: '20px',
                        '& .MuiChip-label': {
                          px: 0.5,
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                        },
                      }}
                      title={capitalize(printing.rarity || 'Unknown') || undefined}
                    />
                  </TableCell>

                  {/* Collection Quantities */}
                  {isCollectionContext && (
                    <>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontSize: '0.813rem',
                            fontWeight: printing.quantityReg ? 'bold' : 'normal',
                            color: printing.quantityReg ? 'success.main' : 'text.secondary',
                          }}
                        >
                          {printing.quantityReg || 0}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontSize: '0.813rem',
                            fontWeight: printing.quantityFoil ? 'bold' : 'normal',
                            color: printing.quantityFoil ? 'secondary.main' : 'text.secondary',
                          }}
                        >
                          {printing.quantityFoil || 0}
                        </Typography>
                      </TableCell>
                    </>
                  )}

                  {/* Market Price */}
                  <TableCell sx={{ textAlign: 'right' }}>
                    <Box>
                      {marketPrice ? (
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontSize: '0.813rem',
                            fontWeight: 500,
                          }}
                        >
                          ${marketPrice.toFixed(2)}
                        </Typography>
                      ) : (
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontSize: '0.813rem',
                            color: 'text.secondary',
                          }}
                        >
                          —
                        </Typography>
                      )}
                      {foilPrice && (
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            fontSize: '0.688rem',
                            color: 'secondary.main',
                            display: 'block',
                          }}
                          title="Foil price"
                        >
                          F: ${foilPrice.toFixed(2)}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>

                  {/* Release Date */}
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                      {printing.releaseDate ? formatISODate(printing.releaseDate) : '—'}
                    </Typography>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  // Original non-compact version (kept for flexibility)
  return (
    <TableContainer component={Paper} sx={{ boxShadow: 2, overflowX: 'auto' }}>
      <Table sx={{ minWidth: { xs: 350, sm: 650 } }} aria-label="other printings table">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold' }}>Set</TableCell>
            <TableCell sx={{ fontWeight: 'bold', display: { xs: 'none', sm: 'table-cell' } }}>
              Collector #
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Rarity</TableCell>
            {isCollectionContext && (
              <>
                <TableCell sx={{ fontWeight: 'bold' }}>Regular</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Foil</TableCell>
              </>
            )}
            <TableCell sx={{ fontWeight: 'bold', display: { xs: 'none', md: 'table-cell' } }}>
              Release Date
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Market Price</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedPrintings.map((printing) => {
            const marketPrice =
              printing.prices?.normal?.market || (printing.market ? parseFloat(printing.market) : null);
            
            const cardUrlParts = generateCardUrl(printing.name, printing.id).split('/').slice(-2);
            const cardSlug = cardUrlParts[0];
            const cardId = cardUrlParts[1];
            
            const cardUrl = isCollectionContext && userId
              ? getCollectionCardUrl(userId, cardSlug, cardId)
              : generateCardUrl(printing.name, printing.id);

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
                        <Link
                          component={NextLink}
                          href={`/browse/sets/${printing.setSlug}`}
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
                      ) : (
                        <Typography variant="body2" fontWeight="medium">
                          {printing.setName || 'Unknown Set'}
                        </Typography>
                      )}
                      <Link
                        component={NextLink}
                        href={cardUrl}
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
                    color={getRarityColor(printing.rarity)}
                  />
                </TableCell>

                {/* Collection Quantities */}
                {isCollectionContext && (
                  <>
                    <TableCell>
                      <Typography variant="body2" fontWeight={printing.quantityReg ? 'bold' : 'normal'}>
                        {printing.quantityReg || 0}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={printing.quantityFoil ? 'bold' : 'normal'}>
                        {printing.quantityFoil || 0}
                      </Typography>
                    </TableCell>
                  </>
                )}

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
  );
};