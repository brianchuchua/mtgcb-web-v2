'use client';

import React, { useCallback, useMemo } from 'react';
import {
  Box,
  Button,
  FormControl,
  IconButton,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import LastPageIcon from '@mui/icons-material/LastPage';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import GridViewIcon from '@mui/icons-material/GridView';
import TableRowsIcon from '@mui/icons-material/TableRows';

export interface CardGalleryPaginationProps {
  /**
   * Current page number (1-based)
   */
  currentPage: number;

  /**
   * Total number of pages
   */
  totalPages: number;

  /**
   * Number of items per page
   */
  pageSize: number;

  /**
   * Available page size options
   */
  pageSizeOptions?: number[];

  /**
   * Total number of items across all pages
   */
  totalItems: number;

  /**
   * Current view mode
   */
  viewMode: 'grid' | 'table';

  /**
   * Called when the page changes
   */
  onPageChange: (page: number) => void;

  /**
   * Called when the page size changes
   */
  onPageSizeChange: (pageSize: number) => void;

  /**
   * Called when the view mode changes
   */
  onViewModeChange: (viewMode: 'grid' | 'table') => void;

  /**
   * Whether this is on the bottom of the page (shows back to top button)
   */
  isOnBottom?: boolean;

  /**
   * Whether data is currently loading
   */
  isLoading?: boolean;
}

// Create separate memoized components for sub-sections
const ViewModeToggle = React.memo(({ 
  viewMode, 
  onViewModeChange,
  isSmallMobile
}: {
  viewMode: 'grid' | 'table';
  onViewModeChange: (mode: 'grid' | 'table') => void;
  isSmallMobile: boolean;
}) => {
  // Memoize handlers
  const handleGridClick = useCallback(() => {
    onViewModeChange('grid');
  }, [onViewModeChange]);
  
  const handleTableClick = useCallback(() => {
    onViewModeChange('table');
  }, [onViewModeChange]);

  return (
    <ViewModeToggleGroup>
      <Tooltip title="Grid view">
        <Button
          variant={viewMode === 'grid' ? 'contained' : 'outlined'}
          size="small"
          onClick={handleGridClick}
          startIcon={<GridViewIcon />}
        >
          {!isSmallMobile && 'Grid'}
        </Button>
      </Tooltip>
      <Tooltip title="Table view">
        <Button
          variant={viewMode === 'table' ? 'contained' : 'outlined'}
          size="small"
          onClick={handleTableClick}
          startIcon={<TableRowsIcon />}
        >
          {!isSmallMobile && 'Table'}
        </Button>
      </Tooltip>
    </ViewModeToggleGroup>
  );
});

ViewModeToggle.displayName = 'ViewModeToggle';

const PageSizeControl = React.memo(({ 
  pageSize, 
  onPageSizeChange,
  pageSizeOptions
}: {
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions: number[];
}) => {
  // Memoize handler
  const handlePageSizeChange = useCallback((event: SelectChangeEvent<number>) => {
    const newPageSize = Number(event.target.value);
    onPageSizeChange(newPageSize);
  }, [onPageSizeChange]);

  return (
    <PageSizeSelector>
      <Typography variant="body2" color="text.secondary" sx={{ mr: 1, whiteSpace: 'nowrap' }}>
        Cards per page:
      </Typography>
      <FormControl size="small" variant="outlined">
        <Select
          value={pageSize}
          onChange={handlePageSizeChange}
          renderValue={(value) => <>{value}</>} 
          inputProps={{ 'aria-label': 'Cards per page' }}
          sx={{ minWidth: 70 }}
        >
          {pageSizeOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </PageSizeSelector>
  );
});

PageSizeControl.displayName = 'PageSizeControl';

const NavigationControls = React.memo(({
  currentPage,
  totalPages,
  onPageChange,
  isLoading,
  isSmallMobile
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
  isSmallMobile: boolean;
}) => {
  // Memoize handlers
  const handleFirstPage = useCallback(() => {
    onPageChange(1);
  }, [onPageChange]);
  
  const handlePreviousPage = useCallback(() => {
    onPageChange(currentPage - 1);
  }, [onPageChange, currentPage]);
  
  const handleNextPage = useCallback(() => {
    onPageChange(currentPage + 1);
  }, [onPageChange, currentPage]);
  
  const handleLastPage = useCallback(() => {
    onPageChange(totalPages);
  }, [onPageChange, totalPages]);

  // Memoize page numbers array
  const pageNumbers = useMemo(() => {
    const visiblePages = isSmallMobile ? 3 : 5;
    const result: number[] = [];
    
    // Calculate start and end page numbers
    let startPage = Math.max(1, currentPage - Math.floor(visiblePages / 2));
    let endPage = Math.min(totalPages, startPage + visiblePages - 1);
    
    // Adjust if we're near the end
    if (endPage - startPage + 1 < visiblePages) {
      startPage = Math.max(1, endPage - visiblePages + 1);
    }
    
    // Generate the array of page numbers
    for (let i = startPage; i <= endPage; i++) {
      result.push(i);
    }
    
    return result;
  }, [currentPage, totalPages, isSmallMobile]);

  return (
    <PaginationControls>
      {/* First page button */}
      <Tooltip title="First page">
        <span>
          <IconButton
            onClick={handleFirstPage}
            disabled={currentPage === 1 || isLoading}
            size="small"
            color="primary"
          >
            <FirstPageIcon />
          </IconButton>
        </span>
      </Tooltip>

      {/* Previous page button */}
      <Tooltip title="Previous page">
        <span>
          <IconButton
            onClick={handlePreviousPage}
            disabled={currentPage === 1 || isLoading}
            size="small"
            color="primary"
          >
            <ChevronLeftIcon />
          </IconButton>
        </span>
      </Tooltip>

      {/* Page number buttons - only show on non-mobile */}
      {!isSmallMobile && (
        <PageNumbers>
          {pageNumbers.map((page) => {
            // Memoize click handler for each page button
            const handlePageClick = () => onPageChange(page);
            
            return (
              <PageButton
                key={page}
                variant={currentPage === page ? 'contained' : 'outlined'}
                onClick={handlePageClick}
                disabled={isLoading}
                size="small"
                current={currentPage === page}
              >
                {page}
              </PageButton>
            );
          })}
        </PageNumbers>
      )}

      {/* Next page button */}
      <Tooltip title="Next page">
        <span>
          <IconButton
            onClick={handleNextPage}
            disabled={currentPage === totalPages || isLoading}
            size="small"
            color="primary"
          >
            <ChevronRightIcon />
          </IconButton>
        </span>
      </Tooltip>

      {/* Last page button */}
      <Tooltip title="Last page">
        <span>
          <IconButton
            onClick={handleLastPage}
            disabled={currentPage === totalPages || isLoading}
            size="small"
            color="primary"
          >
            <LastPageIcon />
          </IconButton>
        </span>
      </Tooltip>
    </PaginationControls>
  );
});

NavigationControls.displayName = 'NavigationControls';

/**
 * A responsive pagination component for the card gallery
 */
export const CardGalleryPagination = React.memo(({
  currentPage,
  totalPages,
  pageSize,
  pageSizeOptions = [20, 50, 100, 200],
  totalItems,
  viewMode,
  onPageChange,
  onPageSizeChange,
  onViewModeChange,
  isOnBottom = false,
  isLoading = false,
}: CardGalleryPaginationProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Calculate the range of items being shown
  const startItem = useMemo(() => 
    Math.min(totalItems, (currentPage - 1) * pageSize + 1),
    [totalItems, currentPage, pageSize]
  );
  
  const endItem = useMemo(() => 
    Math.min(totalItems, currentPage * pageSize),
    [totalItems, currentPage, pageSize]
  );

  // Handle scrolling back to top - memoize to prevent recreation
  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <PaginationContainer>
      {!isOnBottom ? (
        // Top pagination with all controls in a single row on desktop
        <TopPaginationLayout>
          {/* Left section with item range info */}
          <LeftSection>
            {/* Item range display */}
            <ItemRangeInfo>
              {!isLoading && (
                <Typography variant="body2" color="text.secondary">
                  Showing {startItem}-{endItem} of {totalItems} cards
                </Typography>
              )}
            </ItemRangeInfo>
          </LeftSection>

          {/* Center section with pagination controls */}
          <CenterSection>
            {/* Pagination controls */}
            <NavigationControls 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
              isLoading={isLoading}
              isSmallMobile={isSmallMobile}
            />

            {/* Page indicator on mobile */}
            {isSmallMobile && (
              <PageIndicator>
                <Typography variant="body2" color="text.secondary">
                  Page {currentPage} of {totalPages}
                </Typography>
              </PageIndicator>
            )}
          </CenterSection>

          {/* Right section with page size selector and view mode toggles */}
          <RightSection>
            <ControlsGroup>
              {/* Page size selector */}
              <PageSizeControl 
                pageSize={pageSize}
                onPageSizeChange={onPageSizeChange}
                pageSizeOptions={pageSizeOptions}
              />
              
              {/* View mode toggles */}
              <ViewModeToggle 
                viewMode={viewMode} 
                onViewModeChange={onViewModeChange}
                isSmallMobile={isSmallMobile}
              />
            </ControlsGroup>
          </RightSection>
        </TopPaginationLayout>
      ) : (
        // Bottom pagination - simpler layout
        <BottomPaginationLayout>
          {/* Pagination controls */}
          <NavigationControls 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            isLoading={isLoading}
            isSmallMobile={isSmallMobile}
          />

          {/* Page indicator on mobile */}
          {isSmallMobile && (
            <PageIndicator>
              <Typography variant="body2" color="text.secondary">
                Page {currentPage} of {totalPages}
              </Typography>
            </PageIndicator>
          )}

          {/* Back to top button */}
          <BackToTopButton>
            <Button
              variant="text"
              size="small"
              onClick={scrollToTop}
              color="primary"
            >
              Back to top
            </Button>
          </BackToTopButton>
        </BottomPaginationLayout>
      )}
    </PaginationContainer>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo
  // Only re-render when these specific props change
  return (
    prevProps.currentPage === nextProps.currentPage &&
    prevProps.totalPages === nextProps.totalPages &&
    prevProps.pageSize === nextProps.pageSize &&
    prevProps.totalItems === nextProps.totalItems &&
    prevProps.viewMode === nextProps.viewMode &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.isOnBottom === nextProps.isOnBottom &&
    prevProps.onPageChange === nextProps.onPageChange &&
    prevProps.onPageSizeChange === nextProps.onPageSizeChange &&
    prevProps.onViewModeChange === nextProps.onViewModeChange
  );
});

// For better debugging in React DevTools
CardGalleryPagination.displayName = 'CardGalleryPagination';

// Styled components
const PaginationContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
  width: '100%',
}));

const TopPaginationLayout = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
  [theme.breakpoints.down('md')]: {
    flexDirection: 'column',
    gap: theme.spacing(2),
  },
}));

const BottomPaginationLayout = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(1),
  width: '100%',
}));

const LeftSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  [theme.breakpoints.down('md')]: {
    width: '100%',
    order: 1,
  },
}));

const CenterSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  [theme.breakpoints.down('md')]: {
    width: '100%',
    order: 3,
    marginTop: theme.spacing(1),
  },
}));

const RightSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  [theme.breakpoints.down('md')]: {
    width: '100%',
    order: 2,
    justifyContent: 'flex-start',
  },
}));

const ControlsGroup = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: '100%',
    gap: theme.spacing(1),
  },
}));

const ViewModeToggleGroup = styled(Stack)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  gap: theme.spacing(1),
}));

const ItemRangeInfo = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
}));

const PageSizeSelector = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
}));

const PaginationControls = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(0.5),
}));

const PageNumbers = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(0.5),
}));

const PageButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== 'current',
})<{ current?: boolean }>(({ theme, current }) => ({
  minWidth: '36px',
  width: '36px',
  height: '36px',
  padding: 0,
}));

const PageIndicator = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  width: '100%',
  marginTop: theme.spacing(1),
}));

const BackToTopButton = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  marginTop: theme.spacing(1),
}));

export default CardGalleryPagination;