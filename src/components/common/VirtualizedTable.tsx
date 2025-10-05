'use client';

import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {
  Box,
  CircularProgress,
  IconButton,
  Paper,
  Popover,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import React from 'react';
import { TableVirtuoso } from 'react-virtuoso';

export interface ResponsiveWidth {
  xs?: string;
  sm?: string;
  md?: string;
  lg?: string;
  xl?: string;
  default: string;
}

export interface TableColumn<T> {
  id: string;
  label: string;
  width?: string | ResponsiveWidth;
  tooltip?: React.ReactNode;
  hasInfoIcon?: boolean;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
}

export interface VirtualizedTableProps<T> {
  items: T[];
  columns: TableColumn<T>[];
  renderRowContent: (index: number, item: T) => React.ReactNode;
  isLoading?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSortChange?: (columnId: string) => void;
  emptyMessage?: string;
  computeItemKey?: (index: number) => string | number;
  tableWidth?: number;
  getRowProps?: (item: T) => { isIncomplete?: boolean };
}

const VirtualizedTable = <T,>({
  items,
  columns,
  renderRowContent,
  isLoading = false,
  sortBy,
  sortOrder = 'asc',
  onSortChange,
  emptyMessage = 'No items found',
  computeItemKey,
  tableWidth,
  getRowProps,
}: VirtualizedTableProps<T>) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const [activeTooltip, setActiveTooltip] = React.useState<string | null>(null);

  // Theme and responsive setup
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const isSm = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isMd = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isLg = useMediaQuery(theme.breakpoints.between('lg', 'xl'));
  const isXl = useMediaQuery(theme.breakpoints.up('xl'));

  // Helper to get responsive width
  const getResponsiveWidth = (width: string | ResponsiveWidth | undefined): string => {
    if (!width) return 'auto';
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

  // Handle sort
  const handleSortClick = (columnId: string) => {
    if (onSortChange) {
      onSortChange(columnId);
    }
  };

  // Handle info icon click
  const handleInfoClick = (event: React.MouseEvent<HTMLElement>, columnId: string) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setActiveTooltip(columnId);
  };

  const handleInfoClose = () => {
    setAnchorEl(null);
    setActiveTooltip(null);
  };

  // Empty state rendering
  const hasNoItems = !isLoading && (!items || items.length === 0);
  if (hasNoItems) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <Typography variant="h6">{emptyMessage}</Typography>
      </Box>
    );
  }

  // Calculate table dimensions
  const totalTableWidth = columns.reduce((total, column) => {
    if (column.width) {
      const responsiveWidth = getResponsiveWidth(column.width);
      const widthNum = parseInt(responsiveWidth, 10);
      if (!isNaN(widthNum)) {
        return total + widthNum;
      }
    }
    return total + 100; // Default width
  }, 0);

  const finalTableWidth = tableWidth || Math.max(totalTableWidth + 50, 350); // Minimum width

  // Custom table row for virtualization
  const CustomTableRow = (props: any) => {
    const { index, item, style, ...restProps } = props;
    // Use the item prop that's passed by react-virtuoso, not items[index]
    const rowProps = getRowProps && item ? getRowProps(item) : {};
    // Extract the data-index from the data attributes to determine odd/even
    const dataIndex = props['data-index'];
    const isOddRow = dataIndex !== undefined ? parseInt(dataIndex, 10) % 2 === 1 : false;

    return <StyledTableRow {...restProps} style={style} isIncomplete={rowProps.isIncomplete} isOddRow={isOddRow} />;
  };

  // Table virtualization components
  const VirtuosoTableComponents = {
    Scroller: React.forwardRef<HTMLDivElement, any>((props, ref) => (
      <TableContainer
        component={Paper}
        {...props}
        ref={ref}
        sx={{
          width: `${finalTableWidth}px`,
          maxWidth: '100%',
          overflowX: 'auto',
          overflowY: 'hidden',
          ...(props.sx || {}),
        }}
      />
    )),
    Table: (props: React.ComponentProps<typeof Table> & { sx?: any }) => (
      <Table
        {...props}
        size="small"
        aria-label="virtualized table"
        sx={{
          borderCollapse: 'separate',
          width: '100%',
          ...(props.sx || {}),
        }}
      />
    ),
    TableHead,
    TableRow: CustomTableRow,
    TableBody: React.forwardRef<HTMLTableSectionElement>((props, ref) => <TableBody {...props} ref={ref} />),
  };

  // Fixed header content
  const fixedHeaderContent = () => {
    return (
      <TableRow>
        {columns.map((column) => {
          const responsiveWidth = column.width ? getResponsiveWidth(column.width) : undefined;
          const isSortable = column.sortable !== false;

          return (
            <TableCell
              key={column.id}
              width={responsiveWidth}
              align={column.align || 'left'}
              sx={{
                minWidth: responsiveWidth,
                width: responsiveWidth,
                maxWidth: responsiveWidth,
                '& .MuiTableSortLabel-root': {
                  width: '100%',
                  justifyContent: column.align === 'center' ? 'center' : 'flex-start',
                  '& .MuiTableSortLabel-icon': {
                    opacity: 0,
                    position: column.align === 'center' ? 'absolute' : 'static',
                    right: 0,
                  },
                  '&.Mui-active .MuiTableSortLabel-icon': {
                    opacity: 1,
                    position: 'static',
                  },
                },
              }}
            >
              {isSortable && onSortChange ? (
                <TableSortLabel
                  active={sortBy === column.id}
                  direction={sortBy === column.id ? sortOrder : 'asc'}
                  onClick={() => handleSortClick(column.id)}
                  hideSortIcon={column.align === 'center' && sortBy !== column.id}
                  sx={{
                    display: 'flex',
                    width: '100%',
                    justifyContent: column.align === 'center' ? 'center' : 'flex-start',
                  }}
                >
                  {column.label}
                  {column.tooltip && column.hasInfoIcon && (
                    <IconButton
                      size="small"
                      onClick={(e) => handleInfoClick(e, column.id)}
                      sx={{
                        ml: 0.5,
                        padding: 0,
                        color: 'action.disabled',
                        '&:hover': {
                          backgroundColor: 'transparent',
                          color: 'primary.main',
                        },
                      }}
                    >
                      <InfoOutlinedIcon sx={{ fontSize: '0.875rem' }} />
                    </IconButton>
                  )}
                </TableSortLabel>
              ) : (
                column.label
              )}
            </TableCell>
          );
        })}
      </TableRow>
    );
  };

  const tableOpacity = isLoading ? 0.6 : 1;

  const activeColumn = columns.find((col) => col.id === activeTooltip);

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
        data={items}
        components={VirtuosoTableComponents}
        fixedHeaderContent={fixedHeaderContent}
        itemContent={renderRowContent}
        useWindowScroll
        increaseViewportBy={200}
        computeItemKey={computeItemKey || ((index) => index.toString())}
        totalCount={items.length}
        overscan={50}
      />

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleInfoClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <Box sx={{ p: 2, maxWidth: 300 }}>
          <Typography variant="body2" component="div">
            {activeColumn?.tooltip}
          </Typography>
        </Box>
      </Popover>
    </Box>
  );
};

const StyledTableRow = styled(TableRow, {
  shouldForwardProp: (prop) => prop !== 'isIncomplete' && prop !== 'isOddRow',
})<{ isIncomplete?: boolean; isOddRow?: boolean }>(({ theme, isIncomplete, isOddRow }) => ({
  transition: 'background-color 0.2s ease, opacity 0.2s ease',
  position: 'relative',
  ...(isOddRow && {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  }),
  ...(isIncomplete && {
    opacity: 0.85,
    backgroundImage: `repeating-linear-gradient(
      45deg,
      transparent,
      transparent 10px,
      rgba(255, 152, 0, 0.05) 10px,
      rgba(255, 152, 0, 0.05) 20px
    )`,
    backgroundSize: '28.28px 28.28px',
    backgroundPosition: '0 0',
    backgroundAttachment: 'fixed',
    '&:hover': {
      opacity: 1,
    },
  }),
}));

export default VirtualizedTable;
