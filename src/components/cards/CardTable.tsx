'use client';

import {
  Box,
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
import { styled } from '@mui/material/styles';
import React, { useCallback } from 'react';
import { CardItemProps } from './CardItem';
import CardPrice from './CardPrice';
import { usePriceType } from '@/hooks/usePriceType';
import { generateTCGPlayerLink } from '@/utils/affiliateLinkBuilder';

export interface CardTableProps {
  /**
   * Array of cards to display in the table
   */
  cards: CardItemProps[];

  /**
   * Loading state
   */
  isLoading?: boolean;

  /**
   * Callback when a card is clicked
   */
  onCardClick?: (cardId: string) => void;
}

/**
 * A table view for displaying card data
 */
const CardTable = React.memo(
  ({ cards, isLoading = false, onCardClick }: CardTableProps) => {
    const currentPriceType = usePriceType();

    // For empty state
    if (!isLoading && (!cards || cards.length === 0)) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <Typography variant="h6">No cards found</Typography>
        </Box>
      );
    }

    // For loading states, always use skeleton placeholders
    const tableCards = isLoading
      ? Array(24)
          .fill(0)
          .map((_, index) => ({
            id: `table-skeleton-${index}`,
            name: '',
            setName: '',
            collectorNumber: '',
            rarity: '',
            isLoadingSkeleton: true,
          }))
      : cards;

    const handleCardClick = useCallback(
      (cardId: string) => {
        if (onCardClick) {
          onCardClick(cardId);
        }
      },
      [onCardClick],
    );

    // Function to prepare price data for cards that might not have it already
    const preparePriceData = useCallback((card: CardItemProps) => {
      // If prices object already exists with the correct format, use it
      if (card.prices?.normal || card.prices?.foil) {
        return card.prices;
      }

      // Otherwise create it from raw price data
      return {
        normal: {
          market: card.market ? parseFloat(card.market as string) : null,
          low: card.low ? parseFloat(card.low as string) : null,
          average: card.average ? parseFloat(card.average as string) : null,
          high: card.high ? parseFloat(card.high as string) : null,
        },
        foil: card.foil
          ? {
              market: parseFloat(card.foil as string),
              low: null,
              average: null,
              high: null,
            }
          : null,
      };
    }, []);

    return (
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table aria-label="card table">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Set</TableCell>
              <TableCell>Collector #</TableCell>
              <TableCell>Rarity</TableCell>
              <TableCell>Price</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tableCards.map((card) => {
              // For skeleton rows
              if (card.isLoadingSkeleton) {
                return (
                  <StyledTableRow key={card.id}>
                    <TableCell component="th" scope="row">
                      <Skeleton variant="text" width="80%" animation="wave" />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="text" width="70%" animation="wave" />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="text" width="40%" animation="wave" />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="text" width="50%" animation="wave" />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="text" width="60%" animation="wave" />
                    </TableCell>
                  </StyledTableRow>
                );
              }

              // For normal rows
              return (
                <StyledTableRow key={card.id} onClick={() => handleCardClick(card.id)}>
                  <TableCell component="th" scope="row">
                    <ClickableText>{card.name}</ClickableText>
                  </TableCell>
                  <TableCell>{card.setName || 'Unknown'}</TableCell>
                  <TableCell>{card.collectorNumber || 'N/A'}</TableCell>
                  <TableCell>{card.rarity || 'N/A'}</TableCell>
                  <TableCell>
                    <PriceLink
                      href={generateTCGPlayerLink(
                        'tcgplayerId' in card ? card.tcgplayerId : undefined,
                        card.name,
                      )}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()} // Prevent row click when clicking on price
                    >
                      <CardPrice
                        prices={preparePriceData(card)}
                        isLoading={false}
                        priceType={currentPriceType}
                      />
                    </PriceLink>
                  </TableCell>
                </StyledTableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison for memo
    // Only re-render if these specific props change
    return (
      prevProps.isLoading === nextProps.isLoading &&
      prevProps.onCardClick === nextProps.onCardClick &&
      prevProps.cards === nextProps.cards
    );
  },
);

// For better debugging in React DevTools
CardTable.displayName = 'CardTable';

// Styled components
const StyledTableRow = styled(TableRow)(({ theme }) => ({
  cursor: 'pointer',
  transition: 'background-color 0.2s ease',
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:hover': {
    backgroundColor: theme.palette.action.selected,
  },
}));

const ClickableText = styled(Typography)(({ theme }) => ({
  fontWeight: 'medium',
  '&:hover': {
    textDecoration: 'underline',
  },
}));

const PriceLink = styled('a')(({ theme }) => ({
  color: theme.palette.primary.main,
  textDecoration: 'none',
  '&:hover': {
    textDecoration: 'underline',
  },
}));

export default CardTable;
