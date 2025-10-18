'use client';

import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { Button, Divider, Paper, SelectChangeEvent, Stack, styled, useMediaQuery, useTheme } from '@mui/material';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useDashboardContext } from '@/components/layout/Dashboard/context/DashboardContext';
import GoalCompletionSelector from '@/features/browse/GoalCompletionSelector';
import GoalSelector from '@/features/browse/GoalSelector';
import LocationSelector from '@/features/browse/LocationSelector';
import AdvancedFilters from '@/features/browse/AdvancedFilters';
import { useViewModeToggle } from '@/hooks/useViewModeToggle';
import {
  usePreferredCardsSortBy,
  usePreferredCardsSortOrder,
  usePreferredSetsSortBy,
  usePreferredSetsSortOrder,
  usePreferredOneResultPerCardName,
  usePreferredShowSubsets,
  usePreferredIncludeSubsetsInSets,
} from '@/hooks/useBrowsePreferences';
import {
  resetSearch,
  selectArtist,
  selectCardSearchName,
  selectIncludeSubsetsInSets,
  selectOneResultPerCardName,
  selectOracleText,
  selectSelectedGoalId,
  selectSetCode,
  selectSetSearchName,
  selectShowSubsets,
  selectSortBy,
  selectSortOrder,
  selectViewContentType,
  setIncludeSubsetsInSet,
  setOneResultPerCardName,
  setShowSubsets,
  setSortBy,
  setSortOrder,
} from '@/redux/slices/browse';
import { SortByOption, SortOrderOption } from '@/types/browse';
import CardSearchFields from './components/CardSearchFields';
import ContentTypeToggle from './components/ContentTypeToggle';
import MobileResultsButton from './components/MobileResultsButton';
import SetSearchFields from './components/SetSearchFields';
import SortControls from './components/SortControls';
import { useBrowseFormState } from './hooks/useBrowseFormState';
import { useBrowseUrlContext } from './hooks/useBrowseUrlContext';
import { usePriceTypeSync } from './hooks/usePriceTypeSync';
import { useSyncLocalState } from './hooks/useSyncLocalState';
import { getCardSortOptions, getSetSortOptions } from './utils/sortOptions';

const BrowseSearchForm: React.FC = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { setMobileOpen } = useDashboardContext();
  const [statResetTrigger, setStatResetTrigger] = React.useState(0);

  const contentType = useSelector(selectViewContentType);
  const reduxOneResultPerCardName = useSelector(selectOneResultPerCardName) || false;
  const reduxShowSubsets = useSelector(selectShowSubsets);
  const reduxIncludeSubsetsInSet = useSelector(selectIncludeSubsetsInSets);
  const reduxSortBy = useSelector(selectSortBy) || 'releasedAt';
  const reduxSortOrder = useSelector(selectSortOrder) || 'asc';
  const selectedGoalId = useSelector(selectSelectedGoalId);

  const { pathname, isSetPage, isCollectionPage, isCollectionSetPage, userId } = useBrowseUrlContext();

  // localStorage hooks for persisting user preferences
  const [, setPreferredCardsSortBy] = usePreferredCardsSortBy();
  const [, setPreferredCardsSortOrder] = usePreferredCardsSortOrder();
  const [, setPreferredSetsSortBy] = usePreferredSetsSortBy();
  const [, setPreferredSetsSortOrder] = usePreferredSetsSortOrder();
  const [, setPreferredOnePerCard] = usePreferredOneResultPerCardName();
  const [, setPreferredShowSubsets] = usePreferredShowSubsets();
  const [, setPreferredIncludeSubsets] = usePreferredIncludeSubsetsInSets();

  const {
    localCardName,
    localSetName,
    localSetCode,
    localOracleText,
    localArtist,
    setLocalCardName,
    setLocalSetName,
    setLocalSetCode,
    setLocalOracleText,
    setLocalArtist,
    handleCardNameChange,
    handleSetNameChange,
    handleSetCodeChange,
    handleOracleChange,
    handleArtistChange,
  } = useBrowseFormState();

  const { displayPriceType, isPriceMismatched, handlePriceSortChange } = usePriceTypeSync();

  useSyncLocalState({
    reduxCardName: useSelector(selectCardSearchName) || '',
    reduxSetName: useSelector(selectSetSearchName) || '',
    reduxSetCode: useSelector(selectSetCode) || '',
    reduxOracleText: useSelector(selectOracleText) || '',
    reduxArtist: useSelector(selectArtist) || '',
    setLocalCardName,
    setLocalSetName,
    setLocalSetCode,
    setLocalOracleText,
    setLocalArtist,
  });

  const { handleViewModeChange } = useViewModeToggle();

  const handleCardsClick = () => {
    if (contentType !== 'cards') {
      handleViewModeChange('cards');
    }
  };

  const handleSetsClick = () => {
    if (contentType !== 'sets') {
      handleViewModeChange('sets');
    }
  };

  const handleOneResultPerCardNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    dispatch(setOneResultPerCardName(checked));
    setPreferredOnePerCard(checked); // Save to localStorage
  };

  const handleShowSubsetsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    dispatch(setShowSubsets(checked));
    setPreferredShowSubsets(checked); // Save to localStorage
  };

  const handleIncludeSubsetsInSetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    dispatch(setIncludeSubsetsInSet(checked));
    setPreferredIncludeSubsets(checked); // Save to localStorage
  };

  const handleSortByChange = (e: SelectChangeEvent<SortByOption>) => {
    const newSortBy = e.target.value as SortByOption;
    dispatch(setSortBy(newSortBy));
    handlePriceSortChange(newSortBy);

    // Save to localStorage based on current view
    if (contentType === 'cards') {
      setPreferredCardsSortBy(newSortBy);
    } else {
      setPreferredSetsSortBy(newSortBy);
    }
  };

  const handleSortOrderChange = (e: SelectChangeEvent<SortOrderOption>) => {
    const newSortOrder = e.target.value as SortOrderOption;
    dispatch(setSortOrder(newSortOrder));

    // Save to localStorage based on current view
    if (contentType === 'cards') {
      setPreferredCardsSortOrder(newSortOrder);
    } else {
      setPreferredSetsSortOrder(newSortOrder);
    }
  };

  const handleResetSearch = () => {
    dispatch(resetSearch());
    setStatResetTrigger((prev) => prev + 1);
  };

  const handleSeeResults = () => {
    setMobileOpen(false);
  };

  const getSortOptions = () => {
    if (contentType === 'cards') {
      return getCardSortOptions(isPriceMismatched, isCollectionPage);
    } else {
      return getSetSortOptions(isCollectionPage);
    }
  };

  return (
    <FormWrapper>
      <Form sx={{ paddingTop: 0.5 }}>
        <Stack spacing={1.5}>
          {isMobile && <MobileResultsButton onClick={handleSeeResults} />}

          {!isSetPage && (
            <ContentTypeToggle contentType={contentType} onCardsClick={handleCardsClick} onSetsClick={handleSetsClick} />
          )}

          <Button variant="outlined" startIcon={<RestartAltIcon />} onClick={handleResetSearch}>
            Reset Search
          </Button>

          <Divider />

          {isCollectionPage && userId && (
            <>
              <GoalSelector userId={userId} />
              <GoalCompletionSelector />
              {contentType === 'cards' && <LocationSelector userId={userId} />}
            </>
          )}

          {contentType === 'cards' ? (
            <CardSearchFields
              localCardName={localCardName}
              localOracleText={localOracleText}
              localArtist={localArtist}
              handleCardNameChange={handleCardNameChange}
              handleOracleChange={handleOracleChange}
              handleArtistChange={handleArtistChange}
              reduxOneResultPerCardName={reduxOneResultPerCardName}
              handleOneResultPerCardNameChange={handleOneResultPerCardNameChange}
              reduxIncludeSubsetsInSet={reduxIncludeSubsetsInSet}
              handleIncludeSubsetsInSetChange={handleIncludeSubsetsInSetChange}
              isSetPage={isSetPage}
              isCollectionPage={isCollectionPage}
              isCollectionSetPage={isCollectionSetPage}
              statResetTrigger={statResetTrigger}
              selectedGoalId={selectedGoalId}
            />
          ) : (
            <SetSearchFields
              localSetName={localSetName}
              localSetCode={localSetCode}
              handleSetNameChange={handleSetNameChange}
              handleSetCodeChange={handleSetCodeChange}
              reduxShowSubsets={reduxShowSubsets}
              handleShowSubsetsChange={handleShowSubsetsChange}
              reduxIncludeSubsetsInSet={reduxIncludeSubsetsInSet}
              handleIncludeSubsetsInSetChange={handleIncludeSubsetsInSetChange}
              isCollectionPage={isCollectionPage}
            />
          )}

          <SortControls
            sortBy={reduxSortBy}
            sortOrder={reduxSortOrder}
            onSortByChange={handleSortByChange}
            onSortOrderChange={handleSortOrderChange}
            sortOptions={getSortOptions()}
          />

          {contentType === 'cards' && <AdvancedFilters resetTrigger={statResetTrigger} />}
        </Stack>
      </Form>
    </FormWrapper>
  );
};

const FormWrapper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(0),
  margin: theme.spacing(1),
}));

const Form = styled('form')({
  width: '100%',
});

export default BrowseSearchForm;