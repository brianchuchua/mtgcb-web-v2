'use client';

import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {
  Box,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Tooltip,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { TableVirtuoso } from 'react-virtuoso';
import { CardItemProps } from './CardItem';
import CardPrice from './CardPrice';
import { usePriceType } from '@/hooks/usePriceType';
import { selectSortBy, selectSortOrder, setSortBy, setSortOrder } from '@/redux/slices/browseSlice';
import { SortByOption, SortOrderOption } from '@/types/browse';
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

// Define table headers with their corresponding sort options
interface TableHeader {
  label: string;
  id: SortByOption | null;
  width?: string;
  align?: 'inherit' | 'left' | 'center' | 'right' | 'justify';
  tooltip?: React.ReactNode;
  hasInfoIcon?: boolean;
}

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  cursor: 'pointer',
  transition: 'background-color 0.2s ease, opacity 0.2s ease',
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

/**
 * A virtualized table view for displaying card data with sortable columns
 */
const CardTable = React.memo(
  ({ cards, isLoading = false, onCardClick }: CardTableProps) => {
    const dispatch = useDispatch();
    const currentSortBy = useSelector(selectSortBy) || 'releasedAt';
    const currentSortOrder = useSelector(selectSortOrder) || 'asc';
    const currentPriceType = usePriceType();

    // Custom tooltip components
    const ReleaseDateTooltip = () => (
      <div>
        <div>Sort by set release date</div>
        <div>Sets are displayed by name, but sorted chronologically</div>
      </div>
    );

    const PriceTooltip = () => (
      <div>
        <div>Sort by {currentPriceType} price</div>
        <div>Changes to the price type in settings will update this sort</div>
      </div>
    );

    const RarityTooltip = () => (
      <div>
        <div>Sort by rarity</div>
        <div>Common → Uncommon → Rare → Mythic</div>
      </div>
    );

    const MtgcbNumberTooltip = () => (
      <div>
        <div>Sort by MTG CB Collector Number</div>
        <div>Custom sequential numbering system used by MTG Collection Builder</div>
      </div>
    );

    // Table headers with corresponding sort options
    const tableHeaders: TableHeader[] = useMemo(
      () => [
        { label: 'Name', id: 'name', width: '25%' },
        {
          label: 'Set',
          id: 'releasedAt',
          width: '16%',
          tooltip: <ReleaseDateTooltip />,
          hasInfoIcon: true,
        },
        { label: 'Collector #', id: 'collectorNumber', width: '8%' },
        {
          label: 'MTG CB #',
          id: 'mtgcbCollectorNumber',
          width: '10%',
          tooltip: <MtgcbNumberTooltip />,
          hasInfoIcon: true,
        },
        {
          label: 'Rarity',
          id: 'rarityNumeric',
          width: '7%',
          tooltip: <RarityTooltip />,
          hasInfoIcon: true,
        },
        { label: 'Power', id: 'powerNumeric', width: '6%', align: 'center' },
        { label: 'Toughness', id: 'toughnessNumeric', width: '7%', align: 'center' },
        { label: 'Loyalty', id: 'loyaltyNumeric', width: '6%', align: 'center' },
        {
          label: 'Price',
          id: currentPriceType as SortByOption,
          width: '12%',
          tooltip: <PriceTooltip />,
          hasInfoIcon: true,
        },
      ],
      [currentPriceType],
    );

    // Create a ref to store the previous cards for smooth transitions
    const prevCardsRef = React.useRef(cards || []);

    // Update the ref when not loading and we have cards
    React.useEffect(() => {
      if (!isLoading && cards && cards.length > 0) {
        prevCardsRef.current = cards;
      }
    }, [isLoading, cards]);

    // For loading states, keep the previous data instead of using placeholders
    const tableCards = isLoading ? prevCardsRef.current : cards || [];

    // Fade-in fade-out transition for the table content
    const tableOpacity = isLoading ? 0.6 : 1;
    const tablePointerEvents = isLoading ? 'none' : 'auto';

    const handleCardClick = useCallback(
      (cardId: string) => {
        if (onCardClick) {
          onCardClick(cardId);
        }
      },
      [onCardClick],
    );

    const handleSortClick = useCallback(
      (headerId: SortByOption | null) => {
        if (!headerId) return; // Skip if no sort option

        // If clicking the same column, toggle sort order, otherwise set to asc
        if (headerId === currentSortBy) {
          const newOrder: SortOrderOption = currentSortOrder === 'asc' ? 'desc' : 'asc';
          dispatch(setSortOrder(newOrder));
        } else {
          dispatch(setSortBy(headerId));
          dispatch(setSortOrder('asc')); // Reset to ascending when changing columns
        }
      },
      [currentSortBy, currentSortOrder, dispatch],
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

    // Format numeric values with decimals to whole numbers, handling null/undefined
    const formatNumeric = (value: string | null | undefined): string => {
      if (value === null || value === undefined) return '';

      // Try to parse as float and display as integer
      const parsed = parseFloat(value);
      if (!isNaN(parsed)) {
        return Math.floor(parsed).toString();
      }
      return value;
    };

    // Check for empty state after all hooks have been called
    const hasNoCards = !isLoading && (!cards || cards.length === 0);

    if (hasNoCards) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <Typography variant="h6">No cards found</Typography>
        </Box>
      );
    }

    // Custom table row component that includes click handling
    const CustomTableRow = React.useCallback(
      (props: any) => {
        const { index, item, ...restProps } = props;
        return (
          <StyledTableRow
            onClick={() => handleCardClick(item.id)}
            style={{ pointerEvents: tablePointerEvents }}
            {...restProps}
          />
        );
      },
      [handleCardClick, tablePointerEvents],
    );

    // Define MUI table components
    const VirtuosoTableComponents = {
      Scroller: React.forwardRef<HTMLDivElement>((props, ref) => (
        <TableContainer component={Paper} {...props} ref={ref} />
      )),
      Table: (props: React.ComponentProps<typeof Table>) => (
        <Table
          {...props}
          size="small"
          aria-label="card table"
          sx={{
            borderCollapse: 'separate', // Fix for virtuoso rendering
            ...props.sx,
          }}
        />
      ),
      TableHead,
      TableRow: CustomTableRow,
      TableBody: React.forwardRef<HTMLTableSectionElement>((props, ref) => (
        <TableBody {...props} ref={ref} />
      )),
    };

    // Fixed header content for the TableVirtuoso
    const fixedHeaderContent = React.useCallback(
      () => (
        <TableRow>
          {tableHeaders.map((header) => (
            <TableCell
              key={header.label}
              width={header.width}
              align={header.align || 'left'}
              sx={{
                '& .MuiTableSortLabel-root': {
                  width: '100%',
                  justifyContent: header.align === 'center' ? 'center' : 'flex-start',
                  // This makes the icon not take space when hidden
                  '& .MuiTableSortLabel-icon': {
                    opacity: 0,
                    position: header.align === 'center' ? 'absolute' : 'static',
                    right: 0,
                  },
                  '&.Mui-active .MuiTableSortLabel-icon': {
                    opacity: 1,
                    position: 'static',
                  },
                },
              }}
            >
              {header.id ? (
                <TableSortLabel
                  active={currentSortBy === header.id}
                  direction={currentSortBy === header.id ? currentSortOrder : 'asc'}
                  onClick={() => handleSortClick(header.id)}
                  hideSortIcon={header.align === 'center' && currentSortBy !== header.id}
                  sx={{
                    display: 'flex',
                    width: '100%',
                    justifyContent: header.align === 'center' ? 'center' : 'flex-start',
                  }}
                >
                  {header.label}
                  {header.tooltip && header.hasInfoIcon && (
                    <Tooltip title={header.tooltip} placement="top">
                      <InfoOutlinedIcon
                        color="disabled"
                        sx={{
                          cursor: 'help',
                          fontSize: '0.875rem',
                          ml: 0.5,
                          verticalAlign: 'middle',
                        }}
                      />
                    </Tooltip>
                  )}
                </TableSortLabel>
              ) : (
                header.label
              )}
            </TableCell>
          ))}
        </TableRow>
      ),
      [tableHeaders, currentSortBy, currentSortOrder, handleSortClick],
    );

    // Row content renderer for the TableVirtuoso
    const rowContent = React.useCallback(
      (index: number, card: CardItemProps) => {
        return (
          <React.Fragment>
            <TableCell component="th" scope="row">
              <ClickableText>{card.name}</ClickableText>
            </TableCell>
            <TableCell>{card.setName || (isLoading ? '' : 'Unknown')}</TableCell>
            <TableCell>{card.collectorNumber || (isLoading ? '' : 'N/A')}</TableCell>
            <TableCell>{card.mtgcbCollectorNumber || (isLoading ? '' : 'N/A')}</TableCell>
            <TableCell>{card.rarity || (isLoading ? '' : 'N/A')}</TableCell>
            <TableCell sx={{ textAlign: 'center' }}>{formatNumeric(card.powerNumeric)}</TableCell>
            <TableCell sx={{ textAlign: 'center' }}>
              {formatNumeric(card.toughnessNumeric)}
            </TableCell>
            <TableCell sx={{ textAlign: 'center' }}>{formatNumeric(card.loyaltyNumeric)}</TableCell>
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
                  centered={false}
                />
              </PriceLink>
            </TableCell>
          </React.Fragment>
        );
      },
      [isLoading, preparePriceData, currentPriceType, formatNumeric],
    );

    return (
      <Box sx={{ position: 'relative', mt: 2 }}>
        {isLoading && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 2,
            }}
          >
            <CircularProgress size={32} thickness={4} sx={{ opacity: 0.7 }} />
          </Box>
        )}

        <TableVirtuoso
          style={{
            height: 'calc(100vh - 250px)', // Adjust height as needed
            minHeight: '400px',
            transition: 'opacity 0.2s ease',
            opacity: tableOpacity,
            filter: isLoading ? 'blur(2px)' : 'none',
          }}
          data={tableCards}
          components={VirtuosoTableComponents}
          fixedHeaderContent={fixedHeaderContent}
          itemContent={rowContent}
          useWindowScroll
          increaseViewportBy={200} // Pre-render more rows for smoother scrolling
          computeItemKey={(index) => tableCards[index]?.id || index.toString()}
          totalCount={tableCards.length}
          overscan={50} // Additional rows to render beyond the visible area
        />
      </Box>
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

export default CardTable;
