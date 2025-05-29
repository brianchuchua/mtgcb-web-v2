'use client';

import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Box, TableCell, Tooltip, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';
import { CollectionProgressBar } from './CollectionProgressBar';
import { TableColumn } from '@/components/common/VirtualizedTable';
import SetIcon from '@/components/sets/SetIcon';
import { Set } from '@/types/sets';
import { formatISODate } from '@/utils/dateUtils';

export interface CollectionSetTableRendererProps {
  displaySettings: {
    codeIsVisible?: boolean;
    cardCountIsVisible?: boolean;
    releaseDateIsVisible?: boolean;
    typeIsVisible?: boolean;
    categoryIsVisible?: boolean;
    isDraftableIsVisible?: boolean;
    completionIsVisible?: boolean;
    costToCompleteIsVisible?: boolean;
    valueIsVisible?: boolean;
  };
}

// Format set type to be more readable
const formatSetType = (type: string | null): string => {
  if (!type) return 'Unknown';
  return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ');
};

// Collection set table helper hooks and components
export const useCollectionSetTableColumns = (
  { displaySettings }: CollectionSetTableRendererProps,
  currentSortBy: string,
): TableColumn<Set>[] => {
  // Define all possible columns including collection-specific ones
  const allColumns: TableColumn<Set>[] = [
    {
      id: 'code',
      label: 'Code',
      width: { default: '80px' },
      align: 'center',
      sortable: true,
    },
    {
      id: 'name',
      label: 'Set Name',
      width: {
        xs: '150px',
        sm: '200px',
        md: '250px',
        default: '300px',
      },
      sortable: true,
    },
    {
      id: 'cardCount',
      label: 'Cards',
      width: { default: '90px' },
      hasInfoIcon: true,
      sortable: true,
    },
    {
      id: 'percentageCollected',
      label: 'Completion',
      width: { default: '110px' },
      align: 'center',
      sortable: true,
    },
    {
      id: 'totalValue',
      label: 'Value',
      width: { default: '100px' },
      align: 'right',
      sortable: true,
    },
    {
      id: 'costToComplete.oneOfEachCard',
      label: '$ to Complete',
      width: { default: '150px' },
      align: 'right',
      sortable: true,
    },
    {
      id: 'releasedAt',
      label: 'Release Date',
      width: { default: '140px' },
      hasInfoIcon: true,
      sortable: true,
    },
    {
      id: 'setType',
      label: 'Type',
      width: { default: '120px' },
      sortable: true,
    },
    {
      id: 'category',
      label: 'Category',
      width: { default: '120px' },
      sortable: true,
    },
    {
      id: 'isDraftable',
      label: 'Draftable',
      width: { default: '100px' },
      align: 'center',
      sortable: true,
    },
  ];

  // Filter columns based on visibility settings
  return allColumns.filter((column) => {
    if (column.id === 'code') return displaySettings.codeIsVisible !== false;
    if (column.id === 'name') return true; // Always show name
    if (column.id === 'cardCount') return displaySettings.cardCountIsVisible !== false;
    if (column.id === 'percentageCollected') return displaySettings.completionIsVisible !== false;
    if (column.id === 'totalValue') return displaySettings.valueIsVisible !== false;
    if (column.id === 'costToComplete.oneOfEachCard') return displaySettings.costToCompleteIsVisible !== false;
    if (column.id === 'releasedAt') return displaySettings.releaseDateIsVisible !== false;
    if (column.id === 'setType') return displaySettings.typeIsVisible !== false;
    if (column.id === 'category') return displaySettings.categoryIsVisible !== false;
    if (column.id === 'isDraftable') return displaySettings.isDraftableIsVisible !== false;

    return true;
  });
};

// Collection set row renderer - this renders the cells for each set
export const useCollectionSetRowRenderer = (
  displaySettings: CollectionSetTableRendererProps['displaySettings'],
  onSetClick?: (set: Set) => void,
) => {
  const pathname = usePathname();
  
  const renderSetRow = (index: number, set: Set) => {
    // Extract userId from the pathname for collection URLs
    const collectionMatch = pathname?.match(/^\/collections\/(\d+)/);
    const userId = collectionMatch ? collectionMatch[1] : null;
    const setUrl = userId ? `/collections/${userId}/${set.slug}` : `/browse/sets/${set.slug}`;
    
    // Create a collection of cells based on visible columns
    const cells = [];

    // Code Cell
    if (displaySettings.codeIsVisible !== false) {
      cells.push(
        <TableCell key="code" align="center">
          <Link
            href={setUrl}
            style={{
              color: 'inherit',
              textDecoration: 'none',
            }}
            onClick={(e) => e.stopPropagation()} // Prevent row click when clicking link
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              {set.code && <SetIcon code={set.code} size="2x" fixedWidth />}
              <SetLinkText>{set.code || 'N/A'}</SetLinkText>
            </Box>
          </Link>
        </TableCell>,
      );
    }

    // Set Name Cell (always shown)
    cells.push(
      <TableCell key="name" component="th" scope="row">
        <Link
          href={setUrl}
          style={{
            color: 'inherit',
            textDecoration: 'none',
          }}
          onClick={(e) => e.stopPropagation()} // Prevent row click when clicking link
        >
          <ClickableText>{set.name}</ClickableText>
        </Link>
      </TableCell>,
    );

    // Card Count Cell
    if (displaySettings.cardCountIsVisible !== false) {
      cells.push(
        <TableCell key="cardCount" align="right">
          {set.cardCount && set.uniquePrintingsCollectedInSet !== undefined ? (
            <Typography variant="body2">
              {set.uniquePrintingsCollectedInSet.toLocaleString()}/{parseInt(set.cardCount).toLocaleString()}
            </Typography>
          ) : set.cardCount ? (
            parseInt(set.cardCount).toLocaleString()
          ) : (
            'N/A'
          )}
        </TableCell>,
      );
    }

    // Percentage Collected Cell (collection-specific)
    if (displaySettings.completionIsVisible !== false) {
      cells.push(
        <TableCell key="percentageCollected" align="center">
          {set.percentageCollected !== undefined ? (
            <CollectionProgressBar
              percentage={set.percentageCollected}
              height={16}
              showLabel={true}
              labelFormat="short"
              minWidth="80px"
              maxWidth="100px"
            />
          ) : (
            <Typography variant="body2" color="text.secondary">
              N/A
            </Typography>
          )}
        </TableCell>,
      );
    }

    // Total Value Cell (collection-specific)
    if (displaySettings.valueIsVisible !== false) {
      cells.push(
        <TableCell key="totalValue" align="right">
          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
            {set.totalValue !== undefined ? `$${set.totalValue.toFixed(2)}` : 'N/A'}
          </Typography>
        </TableCell>,
      );
    }

    // Cost to Complete Cell (collection-specific)
    if (displaySettings.costToCompleteIsVisible !== false) {
      cells.push(
        <TableCell key="costToComplete" align="right">
          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
            {set.costToComplete?.oneOfEachCard !== undefined
              ? `$${set.costToComplete.oneOfEachCard.toFixed(2)}`
              : 'N/A'}
          </Typography>
        </TableCell>,
      );
    }

    // Release Date Cell
    if (displaySettings.releaseDateIsVisible !== false) {
      cells.push(<TableCell key="releasedAt">{formatISODate(set.releasedAt)}</TableCell>);
    }

    // Set Type Cell
    if (displaySettings.typeIsVisible !== false) {
      cells.push(<TableCell key="setType">{formatSetType(set.setType)}</TableCell>);
    }

    // Category Cell
    if (displaySettings.categoryIsVisible !== false) {
      cells.push(<TableCell key="category">{set.category || 'N/A'}</TableCell>);
    }

    // Draftable Cell
    if (displaySettings.isDraftableIsVisible !== false) {
      cells.push(
        <TableCell key="isDraftable" align="center">
          {set.isDraftable ? 'Yes' : 'No'}
        </TableCell>,
      );
    }

    return <>{cells}</>;
  };

  return renderSetRow;
};

// Export a combined hook for ease of use
export const useCollectionSetTableRenderers = (
  displaySettings: CollectionSetTableRendererProps['displaySettings'],
  currentSortBy: string,
  onSetClick?: (set: Set) => void,
) => {
  const columns = useCollectionSetTableColumns({ displaySettings }, currentSortBy);
  const renderRowContent = useCollectionSetRowRenderer(displaySettings, onSetClick);

  return { columns, renderRowContent };
};

// Styled components
const ClickableText = styled(Typography)(({ theme }) => ({
  fontWeight: 'medium',
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
