'use client';

import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Box, TableCell, Tooltip, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';
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
      label: 'Cost to Complete',
      width: { default: '140px' },
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
    if (column.id === 'percentageCollected') return true; // Always show for collections
    if (column.id === 'totalValue') return true; // Always show for collections
    if (column.id === 'costToComplete.oneOfEachCard') return true; // Always show for collections
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
  const renderSetRow = (index: number, set: Set) => {
    // Create a collection of cells based on visible columns
    const cells = [];

    // Code Cell
    if (displaySettings.codeIsVisible !== false) {
      cells.push(
        <TableCell key="code" align="center">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            {set.code && <SetIcon code={set.code} size="2x" fixedWidth />}
            {set.code || 'N/A'}
          </Box>
        </TableCell>,
      );
    }

    // Set Name Cell (always shown)
    cells.push(
      <TableCell key="name" component="th" scope="row">
        <ClickableText>{set.name}</ClickableText>
      </TableCell>,
    );

    // Card Count Cell
    if (displaySettings.cardCountIsVisible !== false) {
      cells.push(
        <TableCell key="cardCount" align="right">
          {set.cardCount ? parseInt(set.cardCount).toLocaleString() : 'N/A'}
        </TableCell>,
      );
    }

    // Percentage Collected Cell (collection-specific)
    cells.push(
      <TableCell key="percentageCollected" align="center">
        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
          {set.percentageCollected !== undefined ? `${Math.round(set.percentageCollected)}%` : 'N/A'}
        </Typography>
      </TableCell>,
    );

    // Total Value Cell (collection-specific)
    cells.push(
      <TableCell key="totalValue" align="right">
        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
          {set.totalValue !== undefined 
            ? `$${set.totalValue.toFixed(2)}`
            : 'N/A'}
        </Typography>
      </TableCell>,
    );

    // Cost to Complete Cell (collection-specific)
    cells.push(
      <TableCell key="costToComplete" align="right">
        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
          {set.costToComplete?.oneOfEachCard !== undefined 
            ? `$${set.costToComplete.oneOfEachCard.toFixed(2)}`
            : 'N/A'}
        </Typography>
      </TableCell>,
    );

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