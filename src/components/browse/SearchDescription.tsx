'use client';

import { useMemo } from 'react';
import { Typography, TypographyProps } from '@mui/material';
import { usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import { 
  selectCardSearchParams, 
  selectSetSearchParams, 
  selectViewContentType, 
  selectOneResultPerCardName,
  selectSelectedGoalId,
  selectShowGoals,
  selectSelectedLocationId,
  selectIncludeChildLocations
} from '@/redux/slices/browse';
import { formatSearchDescription } from '@/utils/search/formatSearchDescription';

interface SearchDescriptionProps extends Omit<TypographyProps, 'children'> {
  forceView?: 'cards' | 'sets';
}

export function SearchDescription({ forceView, ...typographyProps }: SearchDescriptionProps) {
  const pathname = usePathname();
  const viewFromRedux = useSelector(selectViewContentType);
  const contentType = forceView ?? viewFromRedux;
  const cardSearchParams = useSelector(selectCardSearchParams);
  const setSearchParams = useSelector(selectSetSearchParams);
  const oneResultPerCardName = useSelector(selectOneResultPerCardName);
  const selectedGoalId = useSelector(selectSelectedGoalId);
  const showGoals = useSelector(selectShowGoals);
  const selectedLocationId = useSelector(selectSelectedLocationId);
  const includeChildLocations = useSelector(selectIncludeChildLocations);
  
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
      selectedGoalId,
      showGoals,
      selectedLocationId,
      includeChildLocations,
      isSetPage
    );
  }, [searchParams, contentType, oneResultPerCardName, selectedGoalId, showGoals, selectedLocationId, includeChildLocations, isSetPage]);
  
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