'use client';

import { useMemo } from 'react';
import { Typography, TypographyProps } from '@mui/material';
import { usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import {
  selectViewContentType,
  selectOneResultPerCardName,
  selectSelectedGoalId,
  selectShowGoals,
  selectSelectedLocationId,
  selectIncludeChildLocations
} from '@/redux/slices/browse';
import { useCardSearchParams, useSetSearchParams } from '@/hooks/useBrowseSearchParams';
import { useIsCollectionContext } from '@/hooks/useIsCollectionContext';
import { formatSearchDescription } from '@/utils/search/formatSearchDescription';

interface SearchDescriptionProps extends Omit<TypographyProps, 'children'> {
  forceView?: 'cards' | 'sets';
}

export function SearchDescription({ forceView, ...typographyProps }: SearchDescriptionProps) {
  const pathname = usePathname();
  const viewFromRedux = useSelector(selectViewContentType);
  const contentType = forceView ?? viewFromRedux;
  const cardSearchParams = useCardSearchParams();
  const setSearchParams = useSetSearchParams();
  const oneResultPerCardName = useSelector(selectOneResultPerCardName);

  // Get raw values from Redux
  const rawSelectedGoalId = useSelector(selectSelectedGoalId);
  const rawSelectedLocationId = useSelector(selectSelectedLocationId);
  const showGoals = useSelector(selectShowGoals);
  const includeChildLocations = useSelector(selectIncludeChildLocations);

  // Determine if we're in a collection context
  const isCollection = useIsCollectionContext();

  // Only show goal/location in description when in collection context
  // This prevents showing "for goal X in location Y" when browsing without a userId
  const displayGoalId = isCollection ? rawSelectedGoalId : null;
  const displayLocationId = isCollection ? rawSelectedLocationId : null;

  // Determine if we're on a specific set page
  const isSetPage = useMemo(() => {
    return pathname?.includes('/browse/sets/') ||
      (pathname?.includes('/collections/') && pathname?.split('/').length > 3) ||
      false;
  }, [pathname]);

  const searchParams = contentType === 'cards' ? cardSearchParams : setSearchParams;

  const description = useMemo(() => {
    return formatSearchDescription(
      searchParams,
      contentType,
      oneResultPerCardName,
      displayGoalId,          // Use filtered value
      showGoals,
      displayLocationId,      // Use filtered value
      includeChildLocations,
      isSetPage
    );
  }, [searchParams, contentType, oneResultPerCardName, displayGoalId, showGoals, displayLocationId, includeChildLocations, isSetPage]);
  
  return (
    <Typography 
      variant="body2" 
      color="text.secondary"
      sx={{ px: 2, py: 0.5, textAlign: 'center' }}
      {...typographyProps}
    >
      Searching {description}
    </Typography>
  );
}