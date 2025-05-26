'use client';

import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Box, TableCell, Tooltip, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import Link from 'next/link';
import React, { useEffect, useRef } from 'react';
import { CardItemProps } from './CardItem';
import CardPrice from './CardPrice';
import { ResponsiveWidth, TableColumn } from '@/components/common/VirtualizedTable';
import { PriceType } from '@/types/pricing';
import { generateTCGPlayerLink } from '@/utils/affiliateLinkBuilder';
import { getCardImageUrl } from '@/utils/cards/getCardImageUrl';

export interface CardTableRendererProps {
  priceType: PriceType;
  displaySettings: {
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
    quantityIsVisible?: boolean;
  };
}

// Card table helper hooks and components
export const useCardTableColumns = (
  { priceType, displaySettings }: CardTableRendererProps,
  currentSortBy: string,
): TableColumn<CardItemProps>[] => {
  // Tooltip components
  const ReleaseDateTooltip = () => (
    <div>
      <div>Sort by set release date</div>
      <div>Sets are displayed by name, but sorted chronologically</div>
    </div>
  );

  const PriceTooltip = () => (
    <div>
      <div>Sort by {priceType} price</div>
      <div>Changes to the price type in settings will update this sort</div>
    </div>
  );

  const RarityTooltip = () => (
    <div>
      <div>Sort by rarity</div>
      <div>Common → Uncommon → Rare → Mythic → Special</div>
    </div>
  );

  const MtgcbNumberTooltip = () => (
    <div>
      <div>Sort by MTG CB Collector Number</div>
      <div>Custom sequential numbering system used by MTG Collection Builder</div>
    </div>
  );

  const ManaCostTooltip = () => (
    <div>
      <div>Sort by mana value</div>
      <div>Shows the mana symbols, but sorts by converted mana cost</div>
    </div>
  );

  // Tooltip components for quantity columns
  const QuantityRegTooltip = () => (
    <div>
      <div>Sort by regular quantity</div>
      <div>Number of non-foil copies in your collection</div>
    </div>
  );

  const QuantityFoilTooltip = () => (
    <div>
      <div>Sort by foil quantity</div>
      <div>Number of foil copies in your collection</div>
    </div>
  );

  // Define all possible columns
  const allColumns: TableColumn<CardItemProps>[] = [
    {
      id: 'collectorNumber',
      label: '#',
      width: { default: '60px' },
      sortable: true,
    },
    {
      id: 'mtgcbCollectorNumber',
      label: 'M#',
      width: { default: '60px' },
      tooltip: <MtgcbNumberTooltip />,
      hasInfoIcon: true,
      sortable: true,
    },
    {
      id: 'name',
      label: 'Name',
      width: {
        xs: '150px',
        sm: '200px',
        md: '250px',
        default: '300px',
      },
      sortable: true,
    },
    {
      id: 'releasedAt',
      label: 'Set',
      width: {
        xs: '120px',
        sm: '150px',
        md: '200px',
        default: '250px',
      },
      tooltip: <ReleaseDateTooltip />,
      hasInfoIcon: true,
      sortable: true,
    },
    {
      id: 'rarityNumeric',
      label: 'Rarity',
      width: { default: '100px' },
      tooltip: <RarityTooltip />,
      hasInfoIcon: true,
      sortable: true,
    },
    {
      id: 'type',
      label: 'Type',
      width: {
        xs: '120px',
        sm: '150px',
        default: '250px',
      },
      sortable: true,
    },
    {
      id: 'artist',
      label: 'Artist',
      width: {
        xs: '100px',
        sm: '120px',
        default: '150px',
      },
      sortable: true,
    },
    {
      id: 'convertedManaCost',
      label: 'Mana',
      width: {
        xs: '90px',
        sm: '100px',
        md: '120px',
        default: '120px',
      },
      tooltip: <ManaCostTooltip />,
      hasInfoIcon: true,
      sortable: true,
    },
    {
      id: 'powerNumeric',
      label: 'Power',
      width: { default: '100px' },
      align: 'center',
      sortable: true,
    },
    {
      id: 'toughnessNumeric',
      label: 'Toughness',
      width: { default: '100px' },
      align: 'center',
      sortable: true,
    },
    {
      id: 'loyaltyNumeric',
      label: 'Loyalty',
      width: { default: '100px' },
      align: 'center',
      sortable: true,
    },
    {
      id: priceType,
      label: 'Price',
      width: {
        xs: '100px',
        sm: '150px',
        default: '200px',
      },
      tooltip: <PriceTooltip />,
      hasInfoIcon: true,
      sortable: true,
    },
    {
      id: 'quantityReg',
      label: 'Reg',
      width: { default: '60px' },
      align: 'center',
      tooltip: <QuantityRegTooltip />,
      hasInfoIcon: true,
      sortable: true,
    },
    {
      id: 'quantityFoil',
      label: 'Foil',
      width: { default: '60px' },
      align: 'center',
      tooltip: <QuantityFoilTooltip />,
      hasInfoIcon: true,
      sortable: true,
    },
  ];

  // Filter columns based on visibility settings
  return allColumns.filter((column) => {
    if (column.id === 'collectorNumber') return displaySettings.collectorNumberIsVisible;
    if (column.id === 'mtgcbCollectorNumber') return displaySettings.mtgcbNumberIsVisible;
    if (column.id === 'name') return true; // Always show name
    if (column.id === 'releasedAt') return displaySettings.setIsVisible;
    if (column.id === 'rarityNumeric') return displaySettings.rarityIsVisible;
    if (column.id === 'type') return displaySettings.typeIsVisible;
    if (column.id === 'artist') return displaySettings.artistIsVisible;
    if (column.id === 'convertedManaCost') return displaySettings.manaCostIsVisible;
    if (column.id === 'powerNumeric') return displaySettings.powerIsVisible;
    if (column.id === 'toughnessNumeric') return displaySettings.toughnessIsVisible;
    if (column.id === 'loyaltyNumeric') return displaySettings.loyaltyIsVisible;

    const isPriceColumn =
      column.id === 'market' ||
      column.id === 'low' ||
      column.id === 'average' ||
      column.id === 'high' ||
      column.id === 'foil';

    if (isPriceColumn) return displaySettings.priceIsVisible;
    
    if (column.id === 'quantityReg' || column.id === 'quantityFoil') {
      return displaySettings.quantityIsVisible ?? false;
    }

    return true;
  });
};

export const useCardPreviewEffect = (cards: CardItemProps[]) => {
  // Refs for preview functionality
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const hoverCardRef = useRef<HTMLDivElement | null>(null);
  const currentCardRef = useRef<string | null>(null);
  const previewImageRef = useRef<HTMLImageElement | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);
  const errorRef = useRef<HTMLDivElement | null>(null);

  // Initialize and handle tooltip system for the virtualized table
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
          const isCardPreviewVisible = hoverCardRef.current && hoverCardRef.current.style.display !== 'none';
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

  return { showCardPreview, hideCardPreview };
};

// Card row renderer - this is what actually renders the cells for each card
export const useCardRowRenderer = (
  priceType: PriceType,
  displaySettings: CardTableRendererProps['displaySettings'],
  onCardClick?: (cardId: string) => void,
) => {
  const { showCardPreview, hideCardPreview } = useCardPreviewEffect([]);

  const renderCardRow = (index: number, card: CardItemProps) => {
    // Create a collection of cells based on visible columns
    const cells = [];

    // Collector Number Cell
    if (displaySettings.collectorNumberIsVisible) {
      cells.push(<TableCell key="collectorNumber">{card.collectorNumber || 'N/A'}</TableCell>);
    }

    // MTG CB Number Cell
    if (displaySettings.mtgcbNumberIsVisible) {
      cells.push(<TableCell key="mtgcbNumber">{card.mtgcbCollectorNumber || 'N/A'}</TableCell>);
    }

    // Card Name Cell (always shown)
    cells.push(
      <TableCell
        key="name"
        component="th"
        scope="row"
        onMouseEnter={() => showCardPreview(card)}
        onMouseLeave={hideCardPreview}
      >
        <ClickableText>{card.name}</ClickableText>
      </TableCell>,
    );

    // Set Cell
    if (displaySettings.setIsVisible) {
      cells.push(
        <TableCell key="set">
          {card.setName && card.setSlug ? (
            <Link
              href={`/browse/sets/${card.setSlug}`}
              style={{
                color: 'inherit',
                textDecoration: 'none',
              }}
              onClick={(e) => e.stopPropagation()} // Prevent row click when clicking set link
            >
              <SetLinkText>
                {card.setName}
              </SetLinkText>
            </Link>
          ) : (
            card.setName || 'Unknown'
          )}
        </TableCell>
      );
    }

    // Rarity Cell
    if (displaySettings.rarityIsVisible) {
      cells.push(<TableCell key="rarity">{formatRarity(card.rarity) || 'N/A'}</TableCell>);
    }

    // Type Cell
    if (displaySettings.typeIsVisible) {
      cells.push(<TableCell key="type">{card.type || 'N/A'}</TableCell>);
    }

    // Artist Cell
    if (displaySettings.artistIsVisible) {
      cells.push(<TableCell key="artist">{card.artist || 'N/A'}</TableCell>);
    }

    // Mana Cost Cell
    if (displaySettings.manaCostIsVisible) {
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
            {formatManaSymbols(card.manaCost) || ''}
          </Box>
        </TableCell>,
      );
    }

    // Power Cell
    if (displaySettings.powerIsVisible) {
      cells.push(
        <TableCell key="power" sx={{ textAlign: 'center' }}>
          {formatNumeric(card.powerNumeric)}
        </TableCell>,
      );
    }

    // Toughness Cell
    if (displaySettings.toughnessIsVisible) {
      cells.push(
        <TableCell key="toughness" sx={{ textAlign: 'center' }}>
          {formatNumeric(card.toughnessNumeric)}
        </TableCell>,
      );
    }

    // Loyalty Cell
    if (displaySettings.loyaltyIsVisible) {
      cells.push(
        <TableCell key="loyalty" sx={{ textAlign: 'center' }}>
          {formatNumeric(card.loyaltyNumeric)}
        </TableCell>,
      );
    }

    // Price Cell
    if (displaySettings.priceIsVisible) {
      cells.push(
        <TableCell key="price">
          <PriceLink
            href={generateTCGPlayerLink('tcgplayerId' in card ? card.tcgplayerId : undefined, card.name)}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()} // Prevent row click when clicking price
          >
            <CardPrice prices={preparePriceData(card) || null} isLoading={false} priceType={priceType} centered={false} />
          </PriceLink>
        </TableCell>,
      );
    }

    // Quantity Cells
    if (displaySettings.quantityIsVisible) {
      cells.push(
        <TableCell key="quantityReg" sx={{ textAlign: 'center' }}>
          {card.quantityReg !== undefined ? card.quantityReg : '-'}
        </TableCell>,
      );
      cells.push(
        <TableCell key="quantityFoil" sx={{ textAlign: 'center' }}>
          {card.quantityFoil !== undefined ? card.quantityFoil : '-'}
        </TableCell>,
      );
    }

    return <>{cells}</>;
  };

  return renderCardRow;
};

// Utility Functions
function formatNumeric(value: string | null | undefined): string {
  if (value === null || value === undefined) return '';

  const parsed = parseFloat(value);
  const isValidNumber = !isNaN(parsed);
  if (isValidNumber) {
    return Math.floor(parsed).toString();
  }
  return value;
}

function formatRarity(rarity: string | null | undefined): string {
  if (!rarity) return '';
  return rarity.charAt(0).toUpperCase() + rarity.slice(1).toLowerCase();
}

/**
 * Format a card's prices into a standardized structure
 */
function preparePriceData(card: CardItemProps) {
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
}

/**
 * Format mana symbols for display
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

// Styled components
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

const SetLinkText = styled(Typography)(({ theme }) => ({
  '&:hover': {
    textDecoration: 'underline',
    color: theme.palette.primary.main,
  },
  cursor: 'pointer',
}));
