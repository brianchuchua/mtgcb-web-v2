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
import { alpha, styled } from '@mui/material/styles';
import React, { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { TableVirtuoso } from 'react-virtuoso';
import { CardItemProps } from './CardItem';
import CardPrice from './CardPrice';
import { useLocalStorage } from '@/hooks/useLocalStorage';
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

  /**
   * Display settings for table columns
   */
  displaySettings?: {
    setIsVisible?: boolean;
    collectorNumberIsVisible?: boolean;
    mtgcbNumberIsVisible?: boolean;
    rarityIsVisible?: boolean;
    powerIsVisible?: boolean;
    toughnessIsVisible?: boolean;
    loyaltyIsVisible?: boolean;
    priceIsVisible?: boolean;
  };
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
  ({ cards, isLoading = false, onCardClick, displaySettings }: CardTableProps) => {
    const dispatch = useDispatch();
    const currentSortBy = useSelector(selectSortBy) || 'releasedAt';
    const currentSortOrder = useSelector(selectSortOrder) || 'asc';
    const currentPriceType = usePriceType();

    // Load column visibility preferences from localStorage
    const [setIsVisible, setSetIsVisible] = useLocalStorage('tableSetIsVisible', true);
    const [collectorNumberIsVisible, setCollectorNumberIsVisible] = useLocalStorage(
      'tableCollectorNumberIsVisible',
      true,
    );
    const [mtgcbNumberIsVisible, setMtgcbNumberIsVisible] = useLocalStorage(
      'tableMtgcbNumberIsVisible',
      true,
    );
    const [rarityIsVisible, setRarityIsVisible] = useLocalStorage('tableRarityIsVisible', true);
    const [powerIsVisible, setPowerIsVisible] = useLocalStorage('tablePowerIsVisible', true);
    const [toughnessIsVisible, setToughnessIsVisible] = useLocalStorage(
      'tableToughnessIsVisible',
      true,
    );
    const [loyaltyIsVisible, setLoyaltyIsVisible] = useLocalStorage('tableLoyaltyIsVisible', true);
    const [tablePriceIsVisible, setTablePriceIsVisible] = useLocalStorage(
      'tablePriceIsVisible',
      true,
    );

    // Use either provided display settings or localStorage values
    const display = {
      setIsVisible:
        displaySettings?.setIsVisible !== undefined ? displaySettings.setIsVisible : setIsVisible,
      collectorNumberIsVisible:
        displaySettings?.collectorNumberIsVisible !== undefined
          ? displaySettings.collectorNumberIsVisible
          : collectorNumberIsVisible,
      mtgcbNumberIsVisible:
        displaySettings?.mtgcbNumberIsVisible !== undefined
          ? displaySettings.mtgcbNumberIsVisible
          : mtgcbNumberIsVisible,
      rarityIsVisible:
        displaySettings?.rarityIsVisible !== undefined
          ? displaySettings.rarityIsVisible
          : rarityIsVisible,
      powerIsVisible:
        displaySettings?.powerIsVisible !== undefined
          ? displaySettings.powerIsVisible
          : powerIsVisible,
      toughnessIsVisible:
        displaySettings?.toughnessIsVisible !== undefined
          ? displaySettings.toughnessIsVisible
          : toughnessIsVisible,
      loyaltyIsVisible:
        displaySettings?.loyaltyIsVisible !== undefined
          ? displaySettings.loyaltyIsVisible
          : loyaltyIsVisible,
      priceIsVisible:
        displaySettings?.priceIsVisible !== undefined
          ? displaySettings.priceIsVisible
          : tablePriceIsVisible,
    };

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
    const allTableHeaders: TableHeader[] = useMemo(
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

    // Filter the table headers based on visibility settings
    const tableHeaders = useMemo(() => {
      return allTableHeaders.filter((header) => {
        if (header.id === 'name') return true; // Always show name column
        if (header.id === 'releasedAt') return display.setIsVisible;
        if (header.id === 'collectorNumber') return display.collectorNumberIsVisible;
        if (header.id === 'mtgcbCollectorNumber') return display.mtgcbNumberIsVisible;
        if (header.id === 'rarityNumeric') return display.rarityIsVisible;
        if (header.id === 'powerNumeric') return display.powerIsVisible;
        if (header.id === 'toughnessNumeric') return display.toughnessIsVisible;
        if (header.id === 'loyaltyNumeric') return display.loyaltyIsVisible;
        if (
          header.id === 'market' ||
          header.id === 'low' ||
          header.id === 'average' ||
          header.id === 'high' ||
          header.id === 'foil'
        )
          return display.priceIsVisible;
        return true;
      });
    }, [allTableHeaders, display]);

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

    // Map header IDs to their indices in the table header array
    const headerIndicesMap = useMemo(() => {
      const map = new Map<string, number>();
      tableHeaders.forEach((header, index) => {
        if (header.id) {
          map.set(header.id, index);
        }
      });
      return map;
    }, [tableHeaders]);

    // Row content renderer for the TableVirtuoso
    const rowContent = React.useCallback(
      (index: number, card: CardItemProps) => {
        // Create an array to hold the cells for this row
        const cells = [];

        // Always add the name cell (first column)
        cells.push(
          <TableCell key="name" component="th" scope="row">
            <ClickableText>{card.name}</ClickableText>
          </TableCell>,
        );

        // Check if each column should be displayed and add corresponding cell
        if (display.setIsVisible && headerIndicesMap.has('releasedAt')) {
          cells.push(
            <TableCell key="set">{card.setName || (isLoading ? '' : 'Unknown')}</TableCell>,
          );
        }

        if (display.collectorNumberIsVisible && headerIndicesMap.has('collectorNumber')) {
          cells.push(
            <TableCell key="collectorNumber">
              {card.collectorNumber || (isLoading ? '' : 'N/A')}
            </TableCell>,
          );
        }

        if (display.mtgcbNumberIsVisible && headerIndicesMap.has('mtgcbCollectorNumber')) {
          cells.push(
            <TableCell key="mtgcbNumber">
              {card.mtgcbCollectorNumber || (isLoading ? '' : 'N/A')}
            </TableCell>,
          );
        }

        if (display.rarityIsVisible && headerIndicesMap.has('rarityNumeric')) {
          cells.push(<TableCell key="rarity">{card.rarity || (isLoading ? '' : 'N/A')}</TableCell>);
        }

        if (display.powerIsVisible && headerIndicesMap.has('powerNumeric')) {
          cells.push(
            <TableCell key="power" sx={{ textAlign: 'center' }}>
              {formatNumeric(card.powerNumeric)}
            </TableCell>,
          );
        }

        if (display.toughnessIsVisible && headerIndicesMap.has('toughnessNumeric')) {
          cells.push(
            <TableCell key="toughness" sx={{ textAlign: 'center' }}>
              {formatNumeric(card.toughnessNumeric)}
            </TableCell>,
          );
        }

        if (display.loyaltyIsVisible && headerIndicesMap.has('loyaltyNumeric')) {
          cells.push(
            <TableCell key="loyalty" sx={{ textAlign: 'center' }}>
              {formatNumeric(card.loyaltyNumeric)}
            </TableCell>,
          );
        }

        if (display.priceIsVisible && headerIndicesMap.has(currentPriceType as string)) {
          cells.push(
            <TableCell key="price">
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
            </TableCell>,
          );
        }

        return <>{cells}</>;
      },
      [display, headerIndicesMap, isLoading, preparePriceData, currentPriceType, formatNumeric],
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
  (prevProps: CardTableProps, nextProps: CardTableProps): boolean => {
    // Custom comparison for memo
    // Only re-render if these specific props change
    const displaySettingsEqual =
      (!prevProps.displaySettings && !nextProps.displaySettings) ||
      (prevProps.displaySettings &&
        nextProps.displaySettings &&
        JSON.stringify(prevProps.displaySettings) === JSON.stringify(nextProps.displaySettings));

    return Boolean(
      (prevProps.isLoading ?? false) === (nextProps.isLoading ?? false) &&
        prevProps.onCardClick === nextProps.onCardClick &&
        prevProps.cards === nextProps.cards &&
        displaySettingsEqual,
    );
  },
);

// For better debugging in React DevTools
CardTable.displayName = 'CardTable';

export default CardTable;
