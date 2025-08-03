'use client';

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import GridViewIcon from '@mui/icons-material/GridView';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import LastPageIcon from '@mui/icons-material/LastPage';
import SearchIcon from '@mui/icons-material/Search';
import TableRowsIcon from '@mui/icons-material/TableRows';
import {
  Box,
  Button,
  FormControl,
  IconButton,
  InputLabel,
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
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import CardSettingsPanel, { CardSettingGroup } from '@/components/cards/CardSettingsPanel';
import { useDashboardContext } from '@/components/layout/Dashboard/context/DashboardContext';
import SubsetDropdown from './SubsetDropdown';
import { useCardSettingGroups } from '@/hooks/useCardSettingGroups';

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  pageSize,
  pageSizeOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 16, 20, 24, 25, 50, 100, 200, 300, 400, 500],
  totalItems,
  viewMode,
  onPageChange,
  onPageSizeChange,
  onViewModeChange,
  position = 'top',
  isLoading = false,
  isInitialLoading = false,
  contentType = 'cards',
  settingGroups,
  subsets = [],
  onSubsetSelect,
  additionalAction,
  hideViewModeToggle = false,
  customItemName,
  hideSearchButton = false,
  hideSettingsPanel = false,
}) => {
  const theme = useTheme();
  const [localCurrentPage, setLocalCurrentPage] = useState(currentPage);
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const isOnBottom = position === 'bottom';

  useEffect(() => {
    setLocalCurrentPage(currentPage);
  }, [currentPage]);

  const handlePageChange = useCallback(
    (page: number) => {
      setLocalCurrentPage(page);
      onPageChange(page);
    },
    [onPageChange],
  );

  const startItem = useMemo(
    () => Math.min(totalItems, (localCurrentPage - 1) * pageSize + 1),
    [totalItems, localCurrentPage, pageSize],
  );

  const endItem = useMemo(
    () => Math.min(totalItems, localCurrentPage * pageSize),
    [totalItems, localCurrentPage, pageSize],
  );

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <PaginationContainer data-testid={`pagination-${position}`}>
      {!isOnBottom ? (
        <TopPaginationLayout>
          <LeftSection>
            {!isSmallScreen && !isLoading && (
              <ItemRangeDisplay
                startItem={startItem}
                endItem={endItem}
                totalItems={totalItems}
                contentType={contentType}
                isSmallScreen={false}
                customItemName={customItemName}
              />
            )}
          </LeftSection>

          <CenterSection>
            {!isSmallScreen && (
              <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                <NavigationControls
                  currentPage={localCurrentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  isLoading={isLoading}
                  isSmallScreen={isSmallScreen}
                />
              </Box>
            )}

            {isSmallScreen && (
              <MobileControlsRow>
                <PaginationControlsGroup>
                  <NavigationControls
                    currentPage={localCurrentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    isLoading={isLoading}
                    isSmallScreen={isSmallScreen}
                  />

                  <MobileInfoRow>
                    {!isLoading && (
                      <ItemRangeDisplay
                        startItem={startItem}
                        endItem={endItem}
                        totalItems={totalItems}
                        contentType={contentType}
                        isSmallScreen={true}
                        customItemName={customItemName}
                      />
                    )}
                  </MobileInfoRow>
                </PaginationControlsGroup>

                <RightControlsGroup>
                  <PageSizeControl
                    pageSize={pageSize}
                    onPageSizeChange={onPageSizeChange}
                    pageSizeOptions={pageSizeOptions}
                    viewMode={viewMode}
                    contentType={contentType}
                    customSettingGroups={settingGroups}
                    subsets={subsets}
                    onSubsetSelect={onSubsetSelect}
                    customItemName={customItemName}
                    hideSettingsPanel={hideSettingsPanel}
                  />

                  {(!hideViewModeToggle || additionalAction) && (
                    <Box sx={{ mt: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        {!hideViewModeToggle && (
                          <ViewModeToggle
                            viewMode={viewMode}
                            onViewModeChange={onViewModeChange}
                            isSmallScreen={isSmallScreen}
                            isLoading={isLoading}
                            isInitialLoading={isInitialLoading}
                          />
                        )}
                        {additionalAction}
                      </Stack>
                    </Box>
                  )}
                </RightControlsGroup>
              </MobileControlsRow>
            )}

            {!isSmallScreen && (!hideViewModeToggle || additionalAction) && (
              <ViewToggleContainer>
                <Stack direction="row" spacing={1} alignItems="center">
                  {!hideViewModeToggle && (
                    <ViewModeToggle
                      viewMode={viewMode}
                      onViewModeChange={onViewModeChange}
                      isSmallScreen={isSmallScreen}
                      isLoading={isLoading}
                      isInitialLoading={isInitialLoading}
                    />
                  )}
                  {additionalAction}
                </Stack>
              </ViewToggleContainer>
            )}

            {isSmallScreen && !hideSearchButton && <MobileSearchButton />}
          </CenterSection>

          <RightSection
            sx={{
              display: isSmallScreen ? 'none' : 'flex',
            }}
          >
            <PageSizeControl
              pageSize={pageSize}
              onPageSizeChange={onPageSizeChange}
              pageSizeOptions={pageSizeOptions}
              viewMode={viewMode}
              contentType={contentType}
              customSettingGroups={settingGroups}
              subsets={subsets}
              onSubsetSelect={onSubsetSelect}
              customItemName={customItemName}
              hideSettingsPanel={hideSettingsPanel}
            />
          </RightSection>
        </TopPaginationLayout>
      ) : (
        <BottomPaginationLayout>
          <BackToTopButton onClick={scrollToTop} isLoading={isLoading} />
        </BottomPaginationLayout>
      )}
    </PaginationContainer>
  );
};

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  pageSizeOptions?: number[];
  totalItems: number;
  viewMode: 'grid' | 'table';
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onViewModeChange: (viewMode: 'grid' | 'table') => void;
  position?: string;
  isLoading?: boolean;
  isInitialLoading?: boolean;
  contentType?: 'cards' | 'sets';
  settingGroups?: CardSettingGroup[];
  hideContentTypeToggle?: boolean;
  subsets?: any[];
  onSubsetSelect?: (subsetId: string) => void;
  additionalAction?: React.ReactNode;
  hideViewModeToggle?: boolean;
  customItemName?: string;
  hideSearchButton?: boolean;
  hideSettingsPanel?: boolean;
}

Pagination.displayName = 'Pagination';

interface ItemRangeDisplayProps {
  startItem: number;
  endItem: number;
  totalItems: number;
  contentType: 'cards' | 'sets';
  isSmallScreen: boolean;
  customItemName?: string;
}

const ItemRangeDisplay: React.FC<ItemRangeDisplayProps> = ({
  startItem,
  endItem,
  totalItems,
  contentType,
  isSmallScreen,
  customItemName,
}) => {
  if (isSmallScreen) {
    return (
      <Typography
        variant="body2"
        color="text.secondary"
        data-testid="page-info"
        sx={{
          fontSize: '0.825rem',
          whiteSpace: 'nowrap',
        }}
      >
        {startItem}-{endItem} of {totalItems} {customItemName || (contentType === 'cards' ? 'cards' : 'sets')}
      </Typography>
    );
  }

  return (
    <ItemRangeInfo data-testid="page-info">
      <Typography variant="body1" color="text.secondary">
        Showing {startItem}-{endItem} of {totalItems} {customItemName || (contentType === 'cards' ? 'cards' : 'sets')}
      </Typography>
    </ItemRangeInfo>
  );
};

interface BackToTopButtonProps {
  onClick: () => void;
  isLoading: boolean;
}

const BackToTopButton: React.FC<BackToTopButtonProps> = ({ onClick, isLoading }) => {
  return (
    <BackToTopButtonContainer>
      <Button
        variant="outlined"
        size="medium"
        onClick={onClick}
        color="primary"
        startIcon={<KeyboardArrowUpIcon />}
        sx={{
          px: 3,
          py: 0.75,
          borderRadius: 4,
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 2.0s',
        }}
      >
        Back to top
      </Button>
    </BackToTopButtonContainer>
  );
};

const MobileSearchButton: React.FC = () => {
  const { setMobileOpen, setMainSectionExpanded } = useDashboardContext();

  const handleSearchClick = useCallback(() => {
    setMainSectionExpanded(false);
    setMobileOpen(true);
  }, [setMobileOpen, setMainSectionExpanded]);

  return (
    <SearchButtonContainer>
      <Button
        variant="outlined"
        color="primary"
        size="medium"
        onClick={handleSearchClick}
        startIcon={<SearchIcon />}
        fullWidth
      >
        Open Search Options
      </Button>
    </SearchButtonContainer>
  );
};

MobileSearchButton.displayName = 'MobileSearchButton';

interface ViewModeToggleProps {
  viewMode: 'grid' | 'table';
  onViewModeChange: (mode: 'grid' | 'table') => void;
  isSmallScreen: boolean;
  isLoading?: boolean;
  isInitialLoading?: boolean;
}

const ViewModeToggle: React.FC<ViewModeToggleProps> = ({
  viewMode,
  onViewModeChange,
  isSmallScreen,
  isLoading = false,
  isInitialLoading = false,
}) => {
  const [isFullyLoaded, setIsFullyLoaded] = useState(!isInitialLoading);

  useEffect(() => {
    if (isInitialLoading) {
      setIsFullyLoaded(false);
    } else if (!isFullyLoaded) {
      const timer = setTimeout(() => setIsFullyLoaded(true), 16);
      return () => clearTimeout(timer);
    }
  }, [isInitialLoading, isFullyLoaded]);

  const handleGridClick = useCallback(() => {
    onViewModeChange('grid');
  }, [onViewModeChange]);

  const handleTableClick = useCallback(() => {
    onViewModeChange('table');
  }, [onViewModeChange]);

  return (
    <ViewModeToggleGroup>
      <Tooltip title="Grid view">
        <span>
          <Button
            variant={!isFullyLoaded ? 'outlined' : viewMode === 'grid' ? 'contained' : 'outlined'}
            size="small"
            onClick={handleGridClick}
            startIcon={!isSmallScreen ? <GridViewIcon /> : undefined}
            disabled={!isFullyLoaded}
            data-testid="view-mode-toggle-grid"
            sx={{ 
              opacity: isFullyLoaded ? 1 : 0.7,
              minWidth: isSmallScreen ? 'auto' : undefined,
              px: isSmallScreen ? 1 : undefined,
            }}
          >
            {isSmallScreen ? <GridViewIcon /> : 'Grid'}
          </Button>
        </span>
      </Tooltip>
      <Tooltip title="Table view">
        <span>
          <Button
            variant={!isFullyLoaded ? 'outlined' : viewMode === 'table' ? 'contained' : 'outlined'}
            size="small"
            onClick={handleTableClick}
            startIcon={!isSmallScreen ? <TableRowsIcon /> : undefined}
            disabled={!isFullyLoaded}
            data-testid="view-mode-toggle-table"
            sx={{ 
              opacity: isFullyLoaded ? 1 : 0.7,
              minWidth: isSmallScreen ? 'auto' : undefined,
              px: isSmallScreen ? 1 : undefined,
            }}
          >
            {isSmallScreen ? <TableRowsIcon /> : 'Table'}
          </Button>
        </span>
      </Tooltip>
    </ViewModeToggleGroup>
  );
};

ViewModeToggle.displayName = 'ViewModeToggle';

interface PageSizeControlProps {
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions: number[];
  viewMode: 'grid' | 'table';
  contentType?: 'cards' | 'sets';
  customSettingGroups?: CardSettingGroup[];
  subsets?: any[];
  onSubsetSelect?: (subsetId: string) => void;
  customItemName?: string;
  hideSettingsPanel?: boolean;
}

const PageSizeControl: React.FC<PageSizeControlProps> = ({
  pageSize,
  onPageSizeChange,
  pageSizeOptions,
  viewMode,
  contentType = 'cards',
  customSettingGroups,
  subsets = [],
  onSubsetSelect,
  customItemName,
  hideSettingsPanel = false,
}) => {
  const cardSettingGroups = customSettingGroups || useCardSettingGroups(viewMode);
  const isSmallScreen = useMediaQuery('(max-width:899px)');
  const labelId = `${contentType}-per-page-label`;

  const handlePageSizeChange = useCallback(
    (event: SelectChangeEvent<number>) => {
      const newPageSize = Number(event.target.value);
      onPageSizeChange(newPageSize);
    },
    [onPageSizeChange],
  );

  return (
    <PageSizeSelector>
      <FormControl size="small" variant="outlined" sx={{ minWidth: 70 }}>
        <InputLabel id={labelId}>{customItemName ? customItemName.charAt(0).toUpperCase() + customItemName.slice(1) : (contentType === 'cards' ? 'Cards' : 'Sets')}</InputLabel>
        <Select
          labelId={labelId}
          value={pageSize}
          onChange={handlePageSizeChange}
          renderValue={(value) => <>{value}</>}
          label={customItemName ? customItemName.charAt(0).toUpperCase() + customItemName.slice(1) : (contentType === 'cards' ? 'Cards' : 'Sets')}
          sx={{ minWidth: 70 }}
        >
          {pageSizeOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {subsets.length > 0 && onSubsetSelect && (
        <SubsetDropdown subsets={subsets} onSubsetSelect={onSubsetSelect} />
      )}

      {!hideSettingsPanel && (
        <Box sx={{ ml: 1 }}>
          <CardSettingsPanel
            settingGroups={cardSettingGroups}
            panelId={`${contentType}${viewMode === 'grid' ? 'Gallery' : 'Table'}Settings`}
            contentType={contentType}
          />
        </Box>
      )}
    </PageSizeSelector>
  );
};

interface NavigationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
  isSmallScreen: boolean;
}

const NavigationControls: React.FC<NavigationControlsProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  isLoading,
  isSmallScreen,
}) => {
  const page = parseInt(String(currentPage), 10) || 1;

  const handleFirstPage = useCallback(() => {
    onPageChange(1);
  }, [onPageChange]);

  const handlePreviousPage = useCallback(() => {
    onPageChange(page - 1);
  }, [onPageChange, page]);

  const handleNextPage = useCallback(() => {
    onPageChange(page + 1);
  }, [onPageChange, page]);

  const handleLastPage = useCallback(() => {
    onPageChange(totalPages);
  }, [onPageChange, totalPages]);

  const pageNumbers = useMemo(() => {
    const visiblePages = isSmallScreen ? 3 : 5;
    const result: number[] = [];

    let startPage = Math.max(1, page - Math.floor(visiblePages / 2));
    let endPage = Math.min(totalPages, startPage + visiblePages - 1);

    if (endPage - startPage + 1 < visiblePages) {
      startPage = Math.max(1, endPage - visiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      result.push(i);
    }

    return result;
  }, [page, totalPages, isSmallScreen]);

  return (
    <PaginationControls>
      <Tooltip title="First page">
        <span>
          <IconButton 
            onClick={handleFirstPage} 
            disabled={page === 1 || isLoading} 
            size="small" 
            color="primary"
            data-testid="pagination-first"
          >
            <FirstPageIcon />
          </IconButton>
        </span>
      </Tooltip>

      <Tooltip title="Previous page">
        <span>
          <IconButton 
            onClick={handlePreviousPage} 
            disabled={page === 1 || isLoading} 
            size="small" 
            color="primary"
            data-testid="pagination-prev"
          >
            <ChevronLeftIcon />
          </IconButton>
        </span>
      </Tooltip>

      {!isSmallScreen && (
        <PageNumbers>
          {pageNumbers.map((pageNum) => (
            <PageButton
              key={pageNum}
              variant={page === pageNum ? 'contained' : 'outlined'}
              onClick={() => onPageChange(pageNum)}
              disabled={isLoading}
              size="small"
              current={page === pageNum}
            >
              {pageNum}
            </PageButton>
          ))}
        </PageNumbers>
      )}

      <Tooltip title="Next page">
        <span>
          <IconButton 
            onClick={handleNextPage} 
            disabled={page === totalPages || isLoading} 
            size="small" 
            color="primary"
            data-testid="pagination-next"
          >
            <ChevronRightIcon />
          </IconButton>
        </span>
      </Tooltip>

      <Tooltip title="Last page">
        <span>
          <IconButton 
            onClick={handleLastPage} 
            disabled={page === totalPages || isLoading} 
            size="small" 
            color="primary"
            data-testid="pagination-last"
          >
            <LastPageIcon />
          </IconButton>
        </span>
      </Tooltip>
    </PaginationControls>
  );
};

NavigationControls.displayName = 'NavigationControls';

const PaginationContainer = styled(Box)(({ theme }) => ({
  margin: `${theme.spacing(2)} auto`,

  [theme.breakpoints.down('md')]: {
    width: '98%',
  },
  [theme.breakpoints.down('sm')]: {
    width: '100%',
    margin: `${theme.spacing(0)} auto`,
    padding: theme.spacing(0, 0),
  },
}));

const TopPaginationLayout = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
  [theme.breakpoints.down('md')]: {
    flexDirection: 'column',
    alignItems: 'center',
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

const SearchButtonContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  marginTop: theme.spacing(1),
}));

const LeftSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  width: '240px',
  justifyContent: 'flex-start',
  [theme.breakpoints.down('md')]: {
    width: '100%',
    order: 1,
    justifyContent: 'center',
  },
}));

const CenterSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  flex: 1,
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
  width: '240px',
  [theme.breakpoints.down('md')]: {
    width: '100%',
    order: 2,
    justifyContent: 'center',
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

const PageSizeSelector = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  [theme.breakpoints.down('md')]: {
    justifyContent: 'center',
  },
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
})<{ current?: boolean }>(({ theme }) => ({
  minWidth: '36px',
  width: '36px',
  height: '36px',
  padding: 0,
}));

const MobileInfoRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  width: '100%',
  marginTop: theme.spacing(0.5),
}));

const BackToTopButtonContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  margin: theme.spacing(3, 0, 1, 0),
}));

const ViewToggleContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  marginTop: theme.spacing(1.5),
  [theme.breakpoints.down('md')]: {
    marginTop: theme.spacing(1),
  },
}));

const MobileControlsRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexDirection: 'row',
  width: '100%',
  gap: theme.spacing(2),
}));

const PaginationControlsGroup = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
}));

const RightControlsGroup = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
}));

export default Pagination;
