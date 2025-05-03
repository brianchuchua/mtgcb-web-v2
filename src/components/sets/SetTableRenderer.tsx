'use client';

import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Box, TableCell, Tooltip, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';
import { TableColumn } from '@/components/common/VirtualizedTable';
import { Set } from '@/types/sets';
import { formatDate } from '@/utils/dateUtils';

export interface SetTableRendererProps {
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

// Set table helper hooks and components
export const useSetTableColumns = (
  { displaySettings }: SetTableRendererProps,
  currentSortBy: string,
): TableColumn<Set>[] => {
  // Define all possible columns
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
    if (column.id === 'releasedAt') return displaySettings.releaseDateIsVisible !== false;
    if (column.id === 'setType') return displaySettings.typeIsVisible !== false;
    if (column.id === 'category') return displaySettings.categoryIsVisible !== false;
    if (column.id === 'isDraftable') return displaySettings.isDraftableIsVisible !== false;

    return true;
  });
};

// Set row renderer - this renders the cells for each set
export const useSetRowRenderer = (
  displaySettings: SetTableRendererProps['displaySettings'],
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
            {set.iconUrl && (
              <img src={set.iconUrl} alt={set.code || ''} style={{ width: 20, height: 20 }} />
            )}
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

    // Release Date Cell
    if (displaySettings.releaseDateIsVisible !== false) {
      cells.push(<TableCell key="releasedAt">{formatDate(set.releasedAt)}</TableCell>);
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
export const useSetTableRenderers = (
  displaySettings: SetTableRendererProps['displaySettings'],
  currentSortBy: string,
  onSetClick?: (set: Set) => void,
) => {
  const columns = useSetTableColumns({ displaySettings }, currentSortBy);
  const renderRowContent = useSetRowRenderer(displaySettings, onSetClick);

  return { columns, renderRowContent };
};

// Styled components
const ClickableText = styled(Typography)(({ theme }) => ({
  fontWeight: 'medium',
  '&:hover': {
    textDecoration: 'underline',
  },
}));
