'use client';

import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Box, Link, Typography } from '@mui/material';
import NextLink from 'next/link';
import React, { useCallback, useEffect, useState } from 'react';
import { Pagination } from '@/components/pagination';
import SetIcon from '@/components/sets/SetIcon';
import { CardsProps } from '@/features/browse/types/browseController';
import { useIndependentBrowseController } from '@/features/browse/useIndependentBrowseController';
import { CardGrid, CardTable, ErrorBanner } from '@/features/browse/views';
import capitalize from '@/utils/capitalize';
import { formatISODate } from '@/utils/dateUtils';

interface SubsetSectionProps {
  subset: any;
  searchParams: any;
  onRegisterToggle?: (toggleFn: () => void) => void;
  isOwnCollection?: boolean;
  userId?: number;
}

export default React.forwardRef<HTMLDivElement, SubsetSectionProps>(function SubsetSection(
  { subset, searchParams, onRegisterToggle, isOwnCollection = false, userId },
  ref,
) {
  const [isActive, setIsActive] = useState(false);

  // Use independent controller that doesn't interfere with main set
  const browseController = useIndependentBrowseController({
    setId: subset.id,
    enabled: isActive,
    searchParams: searchParams,
    userId: userId,
  });

  const handleToggleSubset = useCallback(() => {
    setIsActive(!isActive);
  }, [isActive]);

  const handleLinkClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the toggle from firing
  }, []);

  // Register the toggle function with parent on mount
  useEffect(() => {
    if (onRegisterToggle) {
      onRegisterToggle(() => {
        if (!isActive) {
          setIsActive(true);
        }
      });
    }
  }, [onRegisterToggle, isActive]);

  const formatSetCategoryAndType = (set: any) => {
    const category = set.category ? capitalize(set.category) : null;
    const type = set.setType ? capitalize(set.setType) : null;

    if (category && type) return `${category} Set - ${type}`;
    if (category) return `${category} Set`;
    if (type) return type;
    return 'Special Set';
  };

  const isCardGridView = isActive && browseController.view === 'cards' && browseController.viewMode === 'grid';
  const isCardTableView = isActive && browseController.view === 'cards' && browseController.viewMode === 'table';
  const cardsProps = browseController.cardsProps as CardsProps;

  return (
    <Box ref={ref} sx={{ mb: 1, borderRadius: 2, overflow: 'hidden' }}>
      <Box
        sx={{
          p: 2,
          mb: 1,
          backgroundColor: '#22262c',
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        }}
        onClick={handleToggleSubset}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {subset.code && (
            <Link
              component={NextLink}
              href={`/browse/sets/${subset.slug}`}
              onClick={handleLinkClick}
              sx={{
                display: 'flex',
                '&:hover': {
                  opacity: 0.8,
                },
                textDecoration: 'none',
              }}
            >
              <SetIcon code={subset.code} size="2x" fixedWidth />
            </Link>
          )}
          <Box sx={{ flex: 1 }}>
            <Typography fontWeight="500">
              <Link
                component={NextLink}
                href={`/browse/sets/${subset.slug}`}
                onClick={handleLinkClick}
                sx={{
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'inline',
                  '&:hover': {
                    textDecoration: 'underline',
                    color: 'primary.main',
                  },
                }}
              >
                {subset.name}
              </Link>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatSetCategoryAndType(subset)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {subset.releasedAt && formatISODate(subset.releasedAt)} •{' '}
              {subset.cardCount ? `${subset.cardCount} cards` : 'N/A'}
            </Typography>
          </Box>
          {isActive ? <ExpandLessIcon color="primary" /> : <ExpandMoreIcon color="primary" />}
        </Box>
      </Box>

      {isActive && (
        <Box>
          <Pagination {...browseController.paginationProps} hideContentTypeToggle={true} />

          {browseController.error ? (
            <ErrorBanner type={browseController.view} />
          ) : (
            <>
              {isCardGridView && <CardGrid {...cardsProps} isOwnCollection={isOwnCollection} />}
              {isCardTableView && <CardTable {...cardsProps} isOwnCollection={isOwnCollection} />}
            </>
          )}

          <Pagination {...browseController.paginationProps} position="bottom" hideContentTypeToggle={true} />
        </Box>
      )}
    </Box>
  );
});
