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
import { styled, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { TableVirtuoso } from 'react-virtuoso';
import { CardItemProps } from './CardItem';
import CardPrice from './CardPrice';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { usePriceType } from '@/hooks/usePriceType';
import { selectSortBy, selectSortOrder, setSortBy, setSortOrder } from '@/redux/slices/browseSlice';
import { SortByOption, SortOrderOption } from '@/types/browse';
import { generateTCGPlayerLink } from '@/utils/affiliateLinkBuilder';
import { getCardImageUrl } from '@/utils/cards/getCardImageUrl';

export interface CardTableProps {
  cards: CardItemProps[];
  isLoading?: boolean;
  onCardClick?: (cardId: string) => void;
  displaySettings?: {
    setIsVisible?: boolean;
    collectorNumberIsVisible?: boolean;
    mtgcbNumberIsVisible?: boolean;
    rarityIsVisible?: boolean;
    typeIsVisible?: boolean;
    artistIsVisible?: boolean;
    manaCostIsVisible?: boolean;
    powerIsVisible?: boolean;
    toughnessIsVisible?: boolean;
    loyaltyIsVisible?: boolean;
    priceIsVisible?: boolean;
  };
}

const CardTable = ({ cards, isLoading = false, onCardClick, displaySettings }: CardTableProps) => {
  const dispatch = useDispatch();
  const currentSortBy = useSelector(selectSortBy) || 'releasedAt';
  const currentSortOrder = useSelector(selectSortOrder) || 'asc';
  const currentPriceType = usePriceType();

  // Theme and responsive setup
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const isSm = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isMd = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isLg = useMediaQuery(theme.breakpoints.between('lg', 'xl'));
  const isXl = useMediaQuery(theme.breakpoints.up('xl'));

  // Refs for preview functionality
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const hoverCardRef = useRef<HTMLDivElement | null>(null);
  const currentCardRef = useRef<string | null>(null);
  const previewImageRef = useRef<HTMLImageElement | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);
  const errorRef = useRef<HTMLDivElement | null>(null);
  const prevCardsRef = useRef(cards || []);

  // Column visibility from localStorage
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
  const [typeIsVisible, setTypeIsVisible] = useLocalStorage('tableTypeIsVisible', true);
  const [artistIsVisible, setArtistIsVisible] = useLocalStorage('tableArtistIsVisible', false);
  const [manaCostIsVisible, setManaCostIsVisible] = useLocalStorage('tableManaCostIsVisible', true);
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

  // Create display settings object combining props and localStorage
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
    typeIsVisible:
      displaySettings?.typeIsVisible !== undefined ? displaySettings.typeIsVisible : typeIsVisible,
    artistIsVisible:
      displaySettings?.artistIsVisible !== undefined
        ? displaySettings.artistIsVisible
        : artistIsVisible,
    manaCostIsVisible:
      displaySettings?.manaCostIsVisible !== undefined
        ? displaySettings.manaCostIsVisible
        : manaCostIsVisible,
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

  // Initialize and handle tooltip system for the virtualized table
  const getResponsiveWidth = (width: string | ResponsiveWidth): string => {
    if (typeof width === 'string') {
      return width;
    }

    if (isXs && width.xs) return width.xs;
    if (isSm && width.sm) return width.sm;
    if (isMd && width.md) return width.md;
    if (isLg && width.lg) return width.lg;
    if (isXl && width.xl) return width.xl;

    return width.default;
  };

  // Tooltip components
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

  // Tooltip components
  const ManaCostTooltip = () => (
    <div>
      <div>Sort by mana value</div>
      <div>Shows the mana symbols, but sorts by converted mana cost</div>
    </div>
  );

  // Define sorting headers
  const allTableHeaders = [
    {
      label: '#',
      id: 'collectorNumber',
      width: { default: '60px' },
    },
    {
      label: 'M#',
      id: 'mtgcbCollectorNumber',
      width: { default: '60px' },
      tooltip: <MtgcbNumberTooltip />,
      hasInfoIcon: true,
    },
    {
      label: 'Name',
      id: 'name',
      width: {
        xs: '150px',
        sm: '200px',
        md: '250px',
        default: '300px',
      },
    },
    {
      label: 'Set',
      id: 'releasedAt',
      width: {
        xs: '120px',
        sm: '150px',
        md: '200px',
        default: '250px',
      },
      tooltip: <ReleaseDateTooltip />,
      hasInfoIcon: true,
    },
    {
      label: 'Rarity',
      id: 'rarityNumeric',
      width: { default: '100px' },
      tooltip: <RarityTooltip />,
      hasInfoIcon: true,
    },
    {
      label: 'Type',
      id: 'type',
      width: {
        xs: '120px',
        sm: '150px',
        default: '250px',
      },
    },
    {
      label: 'Artist',
      id: 'artist',
      width: {
        xs: '100px',
        sm: '120px',
        default: '150px',
      },
    },
    {
      label: 'Mana',
      id: 'convertedManaCost',
      width: {
        xs: '90px',
        sm: '100px',
        md: '120px',
        default: '120px',
      },
      tooltip: <ManaCostTooltip />,
      hasInfoIcon: true,
    },
    {
      label: 'Power',
      id: 'powerNumeric',
      width: { default: '100px' },
      align: 'center',
    },
    {
      label: 'Toughness',
      id: 'toughnessNumeric',
      width: { default: '100px' },
      align: 'center',
    },
    {
      label: 'Loyalty',
      id: 'loyaltyNumeric',
      width: { default: '100px' },
      align: 'center',
    },
    {
      label: 'Price',
      id: currentPriceType as SortByOption,
      width: {
        xs: '100px',
        sm: '150px',
        default: '200px',
      },
      tooltip: <PriceTooltip />,
      hasInfoIcon: true,
    },
  ];

  // Filter headers based on visibility settings
  const tableHeaders = allTableHeaders.filter((header) => {
    if (header.id === 'collectorNumber') return display.collectorNumberIsVisible;
    if (header.id === 'mtgcbCollectorNumber') return display.mtgcbNumberIsVisible;
    if (header.id === 'name') return true; // Always show name
    if (header.id === 'releasedAt') return display.setIsVisible;
    if (header.id === 'rarityNumeric') return display.rarityIsVisible;
    if (header.id === 'type') return display.typeIsVisible;
    if (header.id === 'artist') return display.artistIsVisible;
    if (header.id === 'convertedManaCost') return display.manaCostIsVisible;
    if (header.id === 'powerNumeric') return display.powerIsVisible;
    if (header.id === 'toughnessNumeric') return display.toughnessIsVisible;
    if (header.id === 'loyaltyNumeric') return display.loyaltyIsVisible;

    const isPriceColumn =
      header.id === 'market' ||
      header.id === 'low' ||
      header.id === 'average' ||
      header.id === 'high' ||
      header.id === 'foil';

    if (isPriceColumn) return display.priceIsVisible;

    return true;
  });

  // Calculate table dimensions
  const totalTableWidth = tableHeaders.reduce((total, header) => {
    if (header.width) {
      const responsiveWidth = getResponsiveWidth(header.width);
      const widthNum = parseInt(responsiveWidth, 10);
      if (!isNaN(widthNum)) {
        return total + widthNum;
      }
    }
    return total + 100; // Default width
  }, 0);

  const finalTableWidth = Math.max(totalTableWidth, 800); // Minimum width

  // Card preview functionality
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const container = document.createElement('div');
    container.id = 'card-preview-container';
    container.style.position = 'fixed';
    container.style.zIndex = '9999';
    container.style.width = '299px';
    container.style.height = 'calc(299px * 1.393)';
    container.style.borderRadius = '5%';
    container.style.overflow = 'hidden';
    container.style.backgroundColor = '#1c2025';
    container.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    container.style.display = 'none';
    container.style.pointerEvents = 'none';
    document.body.appendChild(container);

    const loadingDiv = document.createElement('div');
    loadingDiv.style.position = 'absolute';
    loadingDiv.style.top = '0';
    loadingDiv.style.left = '0';
    loadingDiv.style.width = '100%';
    loadingDiv.style.height = '100%';
    loadingDiv.style.display = 'flex';
    loadingDiv.style.alignItems = 'center';
    loadingDiv.style.justifyContent = 'center';
    loadingDiv.style.backgroundColor = '#1c2025';

    const spinner = document.createElement('div');
    spinner.style.width = '40px';
    spinner.style.height = '40px';
    spinner.style.border = '4px solid #f3f3f3';
    spinner.style.borderTop = '4px solid #3f51b5';
    spinner.style.borderRadius = '50%';

    const keyframes = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    const style = document.createElement('style');
    style.textContent = keyframes;
    document.head.appendChild(style);

    spinner.style.animation = 'spin 1s linear infinite';
    loadingDiv.appendChild(spinner);
    container.appendChild(loadingDiv);

    const errorDiv = document.createElement('div');
    errorDiv.style.position = 'absolute';
    errorDiv.style.top = '0';
    errorDiv.style.left = '0';
    errorDiv.style.width = '100%';
    errorDiv.style.height = '100%';
    errorDiv.style.display = 'none';
    errorDiv.style.flexDirection = 'column';
    errorDiv.style.alignItems = 'center';
    errorDiv.style.justifyContent = 'center';
    errorDiv.style.backgroundColor = '#f9f9f9';
    errorDiv.style.borderRadius = '5%';

    const errorTitle = document.createElement('div');
    errorTitle.style.fontWeight = 'bold';
    errorTitle.style.fontSize = '16px';
    errorTitle.style.marginBottom = '8px';

    const errorMessage = document.createElement('div');
    errorMessage.textContent = 'Image not available';
    errorMessage.style.fontSize = '14px';
    errorMessage.style.opacity = '0.7';

    errorDiv.appendChild(errorTitle);
    errorDiv.appendChild(errorMessage);
    container.appendChild(errorDiv);

    const img = document.createElement('img');
    img.style.position = 'absolute';
    img.style.top = '0';
    img.style.left = '0';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'contain';
    img.style.display = 'none';

    img.onload = () => {
      img.style.display = 'block';
      loadingDiv.style.display = 'none';
      errorDiv.style.display = 'none';
    };

    img.onerror = () => {
      img.style.display = 'none';
      loadingDiv.style.display = 'none';
      errorDiv.style.display = 'flex';

      if (currentCardRef.current) {
        const card = cards.find((c) => c.id === currentCardRef.current);
        if (card) {
          errorTitle.textContent = card.name;
        }
      }
    };

    container.appendChild(img);

    hoverCardRef.current = container;
    previewImageRef.current = img;
    loadingRef.current = loadingDiv;
    errorRef.current = errorDiv;

    let ticking = false;

    const handleMouseMove = (e: MouseEvent) => {
      mousePositionRef.current = { x: e.clientX, y: e.clientY };

      if (!ticking) {
        window.requestAnimationFrame(() => {
          const isCardPreviewVisible =
            hoverCardRef.current && hoverCardRef.current.style.display !== 'none';
          if (isCardPreviewVisible) {
            const x = mousePositionRef.current.x + 50; // 50px to the right
            const y = mousePositionRef.current.y - 35; // 35px above

            hoverCardRef.current!.style.left = `${x}px`;
            hoverCardRef.current!.style.top = `${y}px`;
          }
          ticking = false;
        });

        ticking = true;
      }
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (hoverCardRef.current) {
        document.body.removeChild(hoverCardRef.current);
        hoverCardRef.current = null;
      }
      document.head.removeChild(style);
    };
  }, [cards]);

  // Card preview interaction handlers
  const showCardPreview = (card: CardItemProps) => {
    if (!hoverCardRef.current || !previewImageRef.current) return;

    const isDifferentCard = currentCardRef.current !== card.id;
    if (isDifferentCard) {
      currentCardRef.current = card.id;

      const borderRadius = card.setName === 'Limited Edition Alpha' ? '7%' : '5%';
      hoverCardRef.current.style.borderRadius = borderRadius;

      if (previewImageRef.current) {
        previewImageRef.current.style.display = 'none';
      }

      if (loadingRef.current) {
        loadingRef.current.style.display = 'flex';
      }

      if (errorRef.current) {
        errorRef.current.style.display = 'none';
      }

      hoverCardRef.current.style.display = 'block';

      const x = mousePositionRef.current.x + 50;
      const y = mousePositionRef.current.y - 35;
      hoverCardRef.current.style.left = `${x}px`;
      hoverCardRef.current.style.top = `${y}px`;

      previewImageRef.current.src = getCardImageUrl(card.id);
    } else if (hoverCardRef.current.style.display === 'none') {
      hoverCardRef.current.style.display = 'block';
    }
  };

  const hideCardPreview = () => {
    if (hoverCardRef.current) {
      hoverCardRef.current.style.display = 'none';
    }
  };

  // Sort and table interaction
  const handleCardClick = (cardId: string) => {
    if (onCardClick) {
      onCardClick(cardId);
    }
  };

  const handleSortClick = (headerId: SortByOption | null) => {
    if (!headerId) return;

    const isClickingCurrentSortColumn = headerId === currentSortBy;
    if (isClickingCurrentSortColumn) {
      const newOrder: SortOrderOption = currentSortOrder === 'asc' ? 'desc' : 'asc';
      dispatch(setSortOrder(newOrder));
    } else {
      dispatch(setSortBy(headerId));
      dispatch(setSortOrder('asc'));
    }
  };

  // Data formatting helpers
  const preparePriceData = (card: CardItemProps) => {
    const hasPriceObject = card.prices?.normal || card.prices?.foil;
    if (hasPriceObject) {
      return card.prices;
    }

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
  };

  const formatNumeric = (value: string | null | undefined): string => {
    if (value === null || value === undefined) return '';

    const parsed = parseFloat(value);
    const isValidNumber = !isNaN(parsed);
    if (isValidNumber) {
      return Math.floor(parsed).toString();
    }
    return value;
  };

  // State management - keep previous data for smooth transitions
  useEffect(() => {
    const hasCardsToStore = !isLoading && cards && cards.length > 0;
    if (hasCardsToStore) {
      prevCardsRef.current = cards;
    }
  }, [isLoading, cards]);

  const tableCards = isLoading ? prevCardsRef.current : cards || [];
  const tableOpacity = isLoading ? 0.6 : 1;
  const tablePointerEvents = isLoading ? 'none' : 'auto';

  // Map header IDs to their indices for efficient lookup
  const headerIndicesMap = tableHeaders.reduce((map, header, index) => {
    if (header.id) {
      map.set(header.id, index);
    }
    return map;
  }, new Map<string, number>());

  // Empty state rendering
  const hasNoCards = !isLoading && (!cards || cards.length === 0);
  if (hasNoCards) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <Typography variant="h6">No cards found</Typography>
      </Box>
    );
  }

  // Table components for virtualization
  const CustomTableRow = (props: any) => {
    const { index, item, ...restProps } = props;
    return (
      <StyledTableRow
        onClick={() => handleCardClick(item.id)}
        style={{ pointerEvents: tablePointerEvents }}
        {...restProps}
      />
    );
  };

  const VirtuosoTableComponents = {
    Scroller: React.forwardRef<HTMLDivElement>((props, ref) => (
      <TableContainer
        component={Paper}
        {...props}
        ref={ref}
        sx={{
          width: `${finalTableWidth}px`,
          maxWidth: '100%',
          overflowX: 'auto',
          overflowY: 'hidden',
          ...props.sx,
        }}
      />
    )),
    Table: (props: React.ComponentProps<typeof Table>) => (
      <Table
        {...props}
        size="small"
        aria-label="card table"
        sx={{
          borderCollapse: 'separate',
          width: `${finalTableWidth}px`,
          tableLayout: 'fixed',
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

  // Header content for the table
  const fixedHeaderContent = () => {
    return (
      <TableRow>
        {tableHeaders.map((header) => {
          const responsiveWidth = header.width ? getResponsiveWidth(header.width) : undefined;

          return (
            <TableCell
              key={header.label}
              width={responsiveWidth}
              align={header.align || 'left'}
              sx={{
                minWidth: responsiveWidth,
                width: responsiveWidth,
                '& .MuiTableSortLabel-root': {
                  width: '100%',
                  justifyContent: header.align === 'center' ? 'center' : 'flex-start',
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
          );
        })}
      </TableRow>
    );
  };

  // Row content renderer
  const rowContent = (index: number, card: CardItemProps) => {
    const cells = [];

    const shouldShowCollectorNumber =
      display.collectorNumberIsVisible && headerIndicesMap.has('collectorNumber');
    if (shouldShowCollectorNumber) {
      cells.push(
        <TableCell key="collectorNumber">
          {card.collectorNumber || (isLoading ? '' : 'N/A')}
        </TableCell>,
      );
    }

    const shouldShowMtgcbNumber =
      display.mtgcbNumberIsVisible && headerIndicesMap.has('mtgcbCollectorNumber');
    if (shouldShowMtgcbNumber) {
      cells.push(
        <TableCell key="mtgcbNumber">
          {card.mtgcbCollectorNumber || (isLoading ? '' : 'N/A')}
        </TableCell>,
      );
    }

    cells.push(
      <TableCell
        key="name"
        component="th"
        scope="row"
        onMouseEnter={() => !isLoading && showCardPreview(card)}
        onMouseLeave={hideCardPreview}
      >
        <ClickableText>{card.name}</ClickableText>
      </TableCell>,
    );

    const shouldShowSet = display.setIsVisible && headerIndicesMap.has('releasedAt');
    if (shouldShowSet) {
      cells.push(<TableCell key="set">{card.setName || (isLoading ? '' : 'Unknown')}</TableCell>);
    }

    const shouldShowRarity = display.rarityIsVisible && headerIndicesMap.has('rarityNumeric');
    if (shouldShowRarity) {
      cells.push(
        <TableCell key="rarity">{formatRarity(card.rarity) || (isLoading ? '' : 'N/A')}</TableCell>,
      );
    }

    const shouldShowType = display.typeIsVisible && headerIndicesMap.has('type');
    if (shouldShowType) {
      cells.push(<TableCell key="type">{card.type || (isLoading ? '' : 'N/A')}</TableCell>);
    }

    const shouldShowArtist = display.artistIsVisible && headerIndicesMap.has('artist');
    if (shouldShowArtist) {
      cells.push(<TableCell key="artist">{card.artist || (isLoading ? '' : 'N/A')}</TableCell>);
    }

    const shouldShowManaCost =
      display.manaCostIsVisible && headerIndicesMap.has('convertedManaCost');
    if (shouldShowManaCost) {
      cells.push(
        <TableCell
          key="manaCost"
          sx={{
            whiteSpace: 'nowrap',
            maxWidth: '120px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
            {formatManaSymbols(card.manaCost) || (isLoading ? '' : '')}
          </Box>
        </TableCell>,
      );
    }

    const shouldShowPower = display.powerIsVisible && headerIndicesMap.has('powerNumeric');
    if (shouldShowPower) {
      cells.push(
        <TableCell key="power" sx={{ textAlign: 'center' }}>
          {formatNumeric(card.powerNumeric)}
        </TableCell>,
      );
    }

    const shouldShowToughness =
      display.toughnessIsVisible && headerIndicesMap.has('toughnessNumeric');
    if (shouldShowToughness) {
      cells.push(
        <TableCell key="toughness" sx={{ textAlign: 'center' }}>
          {formatNumeric(card.toughnessNumeric)}
        </TableCell>,
      );
    }

    const shouldShowLoyalty = display.loyaltyIsVisible && headerIndicesMap.has('loyaltyNumeric');
    if (shouldShowLoyalty) {
      cells.push(
        <TableCell key="loyalty" sx={{ textAlign: 'center' }}>
          {formatNumeric(card.loyaltyNumeric)}
        </TableCell>,
      );
    }

    const shouldShowPrice =
      display.priceIsVisible && headerIndicesMap.has(currentPriceType as string);
    if (shouldShowPrice) {
      cells.push(
        <TableCell key="price">
          <PriceLink
            href={generateTCGPlayerLink(
              'tcgplayerId' in card ? card.tcgplayerId : undefined,
              card.name,
            )}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()} // Prevent row click when clicking price
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
  };

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
          height: 'calc(100vh - 250px)',
          minHeight: '400px',
          width: `${finalTableWidth}px`,
          maxWidth: '100%',
          transition: 'opacity 0.2s ease',
          opacity: tableOpacity,
          filter: isLoading ? 'blur(2px)' : 'none',
          margin: '0 auto',
        }}
        data={tableCards}
        components={VirtuosoTableComponents}
        fixedHeaderContent={fixedHeaderContent}
        itemContent={rowContent}
        useWindowScroll
        increaseViewportBy={200}
        computeItemKey={(index) => tableCards[index]?.id || index.toString()}
        totalCount={tableCards.length}
        overscan={50}
      />
    </Box>
  );
};

// Interfaces and types
interface ResponsiveWidth {
  xs?: string;
  sm?: string;
  md?: string;
  lg?: string;
  xl?: string;
  default: string;
}

// Styled components
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

// Utility functions
/**
 * Gets a human-readable name for a mana symbol
 */
function getSymbolName(symbol: string): string {
  // Handle half mana symbols
  if (symbol.startsWith('H')) {
    const color = symbol.substring(1);
    return `Half ${getSymbolName(color)}`;
  }

  switch (symbol.toLowerCase()) {
    case 'w':
      return 'White Mana';
    case 'u':
      return 'Blue Mana';
    case 'b':
      return 'Black Mana';
    case 'r':
      return 'Red Mana';
    case 'g':
      return 'Green Mana';
    case 'c':
      return 'Colorless Mana';
    case 'x':
      return 'X Mana';
    case 't':
      return 'Tap Symbol';
    case 'q':
      return 'Untap Symbol';
    case 's':
      return 'Snow Mana';
    case 'e':
      return 'Energy Counter';
    case 'p':
      return 'Phyrexian Mana';
    case '∞':
    case 'infinity':
      return 'Infinity Mana';
    case '½':
    case '1/2':
      return 'Half Generic Mana';
    default:
      // For generic mana costs (numbers)
      if (/^\d+$/.test(symbol)) {
        return `${symbol} Generic Mana`;
      }
      // For Phyrexian mana like w/p or c/p
      if (symbol.includes('/p')) {
        const color = symbol.split('/')[0];
        return `Phyrexian ${getSymbolName(color)}`;
      }
      // For hybrid mana like w/u
      if (symbol.includes('/')) {
        const [color1, color2] = symbol.split('/');
        return `Hybrid ${getSymbolName(color1)}/${getSymbolName(color2)}`;
      }
      return symbol;
  }
}

/**
 * Formats a mana cost string into mana symbols
 * Uses the manaFormatter utility but with smaller icons and margins
 */
function formatManaSymbols(manaCost: string | null | undefined): React.ReactNode {
  if (!manaCost) return null;

  // Regular expression to match mana symbols in the format {X}
  const symbolRegex = /\{([^}]+)\}/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  // Find all mana symbols and convert them to spans with appropriate classes
  while ((match = symbolRegex.exec(manaCost)) !== null) {
    const [fullMatch, symbol] = match;
    const startIndex = match.index;

    // Add any text before the current symbol
    if (startIndex > lastIndex) {
      parts.push(manaCost.substring(lastIndex, startIndex));
    }

    // Add the symbol with the appropriate class, using ms-1x for smaller size
    // and adding a small margin between symbols

    // Handle special cases with different class structures
    if (symbol.startsWith('H')) {
      // Half mana like {HW}
      const color = symbol.substring(1).toLowerCase();
      parts.push(
        <i
          key={`${symbol}-${startIndex}`}
          className={`ms ms-${color} ms-half ms-cost ms-1x`}
          style={{ margin: '1px' }}
          aria-label={`Half ${getSymbolName(color)}`}
        />,
      );
    } else if (symbol.includes('/p')) {
      // Phyrexian mana like {W/P} or {C/P}
      const color = symbol.split('/')[0].toLowerCase();
      // For colorless phyrexian, we use ms-cp
      parts.push(
        <i
          key={`${symbol}-${startIndex}`}
          className={`ms ms-${color}p ms-cost ms-1x`}
          style={{ margin: '1px' }}
          aria-label={getSymbolName(symbol)}
        />,
      );
    } else if (symbol.includes('/')) {
      // Hybrid mana like {W/U}
      // For hybrid, we use the format "ms-wu" for W/U hybrid
      const colors = symbol.toLowerCase().split('/').join('');
      parts.push(
        <i
          key={`${symbol}-${startIndex}`}
          className={`ms ms-${colors} ms-cost ms-1x`}
          style={{ margin: '1px' }}
          aria-label={getSymbolName(symbol)}
        />,
      );
    } else {
      // Regular mana symbol
      parts.push(
        <i
          key={`${symbol}-${startIndex}`}
          className={`ms ms-${symbol.toLowerCase()} ms-cost ms-1x`}
          style={{ margin: '1px' }}
          aria-label={getSymbolName(symbol)}
        />,
      );
    }

    lastIndex = startIndex + fullMatch.length;
  }

  // Add any remaining text
  if (lastIndex < manaCost.length) {
    parts.push(manaCost.substring(lastIndex));
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        maxWidth: '100%',
      }}
    >
      {parts}
    </span>
  );
}

function formatRarity(rarity: string | null | undefined): string {
  if (!rarity) return '';
  return rarity.charAt(0).toUpperCase() + rarity.slice(1).toLowerCase();
}

// For better debugging in React DevTools
CardTable.displayName = 'CardTable';

export default CardTable;
