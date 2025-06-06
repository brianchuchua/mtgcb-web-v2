'use client';

import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SearchIcon from '@mui/icons-material/Search';
import SortIcon from '@mui/icons-material/Sort';
import StyleIcon from '@mui/icons-material/Style';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
  Box,
  Button,
  Divider,
  FormControl,
  FormControlLabel,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Stack,
  Switch,
  TextField,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import debounce from 'lodash.debounce';
import { usePathname } from 'next/navigation';
import { useSnackbar } from 'notistack';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CardSelectSetting } from '@/components/cards/CardSettingsPanel';
import { useDashboardContext } from '@/components/layout/Dashboard/context/DashboardContext';
import ColorSelector from '@/features/browse/ColorSelector';
import CompletionStatusSelector from '@/features/browse/CompletionStatusSelector';
import RaritySelector from '@/features/browse/RaritySelector';
import SetCategorySelector from '@/features/browse/SetCategorySelector';
import SetSelector from '@/features/browse/SetSelector';
import SetTypeSelector from '@/features/browse/SetTypeSelector';
import StatSearch from '@/features/browse/StatSearch';
import TypeSelector from '@/features/browse/TypeSelector';
import { useCardSettingGroups } from '@/hooks/useCardSettingGroups';
import { usePriceType } from '@/hooks/usePriceType';
import {
  resetSearch,
  selectArtist,
  selectCardSearchName,
  selectIncludeSubsetsInSets,
  selectOneResultPerCardName,
  selectOracleText,
  selectSetCode,
  selectSetSearchName,
  selectShowSubsets,
  selectSortBy,
  selectSortOrder,
  selectViewContentType,
  setArtist,
  setCardSearchName,
  setIncludeSubsetsInSet,
  setOneResultPerCardName,
  setOracleText,
  setSetCode,
  setSetSearchName,
  setShowSubsets,
  setSortBy,
  setSortOrder,
  setViewContentType,
} from '@/redux/slices/browseSlice';
import { SortByOption, SortOrderOption } from '@/types/browse';
import { PriceType } from '@/types/pricing';

// TODO: This can use a component <> logic split like I did with the browse page
const BrowseSearchForm = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { setMobileOpen } = useDashboardContext();
  const { enqueueSnackbar } = useSnackbar();
  const initialCheckDone = useRef(false);
  const prevDisplayPriceType = useRef<string | null>(null);
  const initialRenderComplete = useRef(false);

  // Check if we're on a set-specific page
  const pathname = usePathname();
  const isSetPage =
    pathname?.includes('/browse/sets/') ||
    (pathname?.includes('/collections/') && pathname?.split('/').length > 3) ||
    false;

  // Check if this is a collection page (to show collection-specific sort options)
  const isCollectionPage = pathname?.startsWith('/collections/') || false;
  
  // Check if we're on a collection set page specifically (for subset tracking toggle)
  const isCollectionSetPage = pathname?.includes('/collections/') && pathname?.split('/').length > 3;

  // Get content type from Redux store
  const contentType = useSelector(selectViewContentType);

  // Get type-specific Redux state
  const reduxCardName = useSelector(selectCardSearchName) || '';
  const reduxSetName = useSelector(selectSetSearchName) || '';
  const reduxSetCode = useSelector(selectSetCode) || '';
  const reduxOracleText = useSelector(selectOracleText) || '';
  const reduxArtist = useSelector(selectArtist) || '';
  const reduxOneResultPerCardName = useSelector(selectOneResultPerCardName) || false;
  const reduxShowSubsets = useSelector(selectShowSubsets);
  const reduxIncludeSubsetsInSet = useSelector(selectIncludeSubsetsInSets);
  const reduxSortBy = useSelector(selectSortBy) || 'releasedAt';
  const reduxSortOrder = useSelector(selectSortOrder) || 'asc';

  // Local state for input fields - separate for cards and sets
  const [localCardName, setLocalCardName] = useState(reduxCardName);
  const [localSetName, setLocalSetName] = useState(reduxSetName);
  const [localSetCode, setLocalSetCode] = useState(reduxSetCode);
  const [localOracleText, setLocalOracleText] = useState(reduxOracleText);
  const [localArtist, setLocalArtist] = useState(reduxArtist);

  // Get the current display price type
  const displayPriceType = usePriceType();

  // Get the settings to be able to change display price type
  const cardSettings = useCardSettingGroups();
  const priceSettings = cardSettings?.[1]?.settings?.[0] as CardSelectSetting | undefined;
  const setDisplayPriceType = priceSettings?.setValue;

  // Sync card name state when redux value changes
  useEffect(() => {
    setLocalCardName(reduxCardName);
  }, [reduxCardName]);

  // Sync set name state when redux value changes
  useEffect(() => {
    setLocalSetName(reduxSetName);
  }, [reduxSetName]);

  // Sync set code state when redux value changes
  useEffect(() => {
    setLocalSetCode(reduxSetCode);
  }, [reduxSetCode]);

  // Sync oracle text when redux value changes
  useEffect(() => {
    setLocalOracleText(reduxOracleText);
  }, [reduxOracleText]);

  // Sync artist when redux value changes
  useEffect(() => {
    setLocalArtist(reduxArtist);
  }, [reduxArtist]);

  // Mark initial render as complete after a short delay
  useEffect(() => {
    if (!initialRenderComplete.current) {
      const timer = setTimeout(() => {
        initialRenderComplete.current = true;
      }, 100); // Small delay to ensure content is displayed before potential change
      return () => clearTimeout(timer);
    }
  }, []);

  // When display price type changes, check if current sort is a price sort and update if needed
  useEffect(() => {
    // Skip during initial render
    if (prevDisplayPriceType.current === null) {
      prevDisplayPriceType.current = displayPriceType;
      return;
    }

    // If display price type changed
    if (prevDisplayPriceType.current !== displayPriceType) {
      // Check if current sort is a price sort but not matching the new display price
      if (isPriceSort(reduxSortBy) && reduxSortBy !== displayPriceType && reduxSortBy !== 'foil') {
        // Update the sort to match the new display price
        dispatch(setSortBy(displayPriceType as SortByOption));
        enqueueSnackbar(`Changed your sort to ${displayPriceType} prices to match your display price setting.`, {
          variant: 'info',
        });
      }

      // Update previous value
      prevDisplayPriceType.current = displayPriceType;
    }
  }, [displayPriceType, reduxSortBy, dispatch, enqueueSnackbar]);

  // Check for price mismatch only on initial load cornercase - just show warning
  useEffect(() => {
    if (initialCheckDone.current) return;

    const isPriceSort =
      reduxSortBy === 'market' ||
      reduxSortBy === 'low' ||
      reduxSortBy === 'average' ||
      reduxSortBy === 'high' ||
      reduxSortBy === 'foil';

    if (isPriceSort && reduxSortBy !== displayPriceType && reduxSortBy !== 'foil') {
      enqueueSnackbar(
        `You're sorting by ${reduxSortBy} prices, but displaying ${displayPriceType} prices in the gallery. This may be confusing.`,
        {
          variant: 'warning',
          autoHideDuration: 8000,
        },
      );
    }

    initialCheckDone.current = true;
  }, [reduxSortBy, displayPriceType, enqueueSnackbar]);

  // Separate debounced handlers for cards and sets
  const debouncedCardNameDispatch = useCallback(
    debounce((value: string) => {
      dispatch(setCardSearchName(value));
    }, 300),
    [dispatch],
  );

  const debouncedSetNameDispatch = useCallback(
    debounce((value: string) => {
      dispatch(setSetSearchName(value));
    }, 300),
    [dispatch],
  );

  const debouncedSetCodeDispatch = useCallback(
    debounce((value: string) => {
      dispatch(setSetCode(value));
    }, 300),
    [dispatch],
  );

  const debouncedOracleDispatch = useCallback(
    debounce((value: string) => {
      dispatch(setOracleText(value));
    }, 300),
    [dispatch],
  );

  const debouncedArtistDispatch = useCallback(
    debounce((value: string) => {
      dispatch(setArtist(value));
    }, 300),
    [dispatch],
  );

  // Handlers for different content types
  const handleCardNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalCardName(newValue);
    debouncedCardNameDispatch(newValue);
  };

  const handleSetNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalSetName(newValue);
    debouncedSetNameDispatch(newValue);
  };

  const handleSetCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalSetCode(newValue);
    debouncedSetCodeDispatch(newValue);
  };

  const handleOracleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalOracleText(newValue);
    debouncedOracleDispatch(newValue);
  };

  const handleArtistChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalArtist(newValue);
    debouncedArtistDispatch(newValue);
  };

  const handleOneResultPerCardNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setOneResultPerCardName(e.target.checked));
  };

  const handleShowSubsetsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setShowSubsets(e.target.checked));
  };

  const handleIncludeSubsetsInSetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setIncludeSubsetsInSet(e.target.checked));
  };

  const handleSortByChange = (e: SelectChangeEvent<SortByOption>) => {
    const newSortBy = e.target.value as SortByOption;
    dispatch(setSortBy(newSortBy));

    // Check if this is a price-based sort that doesn't match display setting
    if (
      contentType === 'cards' &&
      isPriceSort(newSortBy) &&
      newSortBy !== displayPriceType &&
      newSortBy !== 'foil' &&
      setDisplayPriceType
    ) {
      // Update display price type to match sort selection
      const priceTypeValue = getPriceTypeEnum(newSortBy);
      setDisplayPriceType(priceTypeValue);

      enqueueSnackbar(`Changed your display price setting to ${newSortBy} to match your sort selection.`, {
        variant: 'info',
      });
    }
  };

  const handleSortOrderChange = (e: SelectChangeEvent<SortOrderOption>) => {
    dispatch(setSortOrder(e.target.value as SortOrderOption));
  };

  const handleResetSearch = () => {
    dispatch(resetSearch());
  };

  const handleSeeResults = () => {
    setMobileOpen(false);
  };

  // Direct click handlers for the toggle buttons
  const handleCardsClick = () => {
    if (contentType !== 'cards') {
      dispatch(setViewContentType('cards'));
    }
  };

  const handleSetsClick = () => {
    if (contentType !== 'sets') {
      dispatch(setViewContentType('sets'));
    }
  };

  // Helper function to convert string price type to enum value
  const getPriceTypeEnum = (priceType: string): number => {
    switch (priceType) {
      case 'market':
        return PriceType.Market as unknown as number;
      case 'low':
        return PriceType.Low as unknown as number;
      case 'average':
        return PriceType.Average as unknown as number;
      case 'high':
        return PriceType.High as unknown as number;
      default:
        return PriceType.Market as unknown as number;
    }
  };

  // Function to check if a sort option is price-related
  const isPriceSort = (option: string): boolean => {
    return option === 'market' || option === 'low' || option === 'average' || option === 'high' || option === 'foil';
  };

  // Function to determine if a price option is mismatched with the display setting
  const isPriceMismatched = (priceOption: string): boolean => {
    return isPriceSort(priceOption) && priceOption !== displayPriceType && priceOption !== 'foil';
  };

  // Special component to make tooltips work with disabled MenuItems
  const WarningTooltip = ({ priceType }: { priceType: string }) => (
    <Box
      component="span"
      onClick={(e) => e.stopPropagation()}
      sx={{
        display: 'inline-flex',
        marginLeft: 1,
        // This makes the span still interactive even when parent is disabled
        pointerEvents: 'auto',
      }}
    >
      <Tooltip title={`Selecting this will change your display price setting to ${priceType}`}>
        <WarningAmberIcon color="warning" fontSize="small" />
      </Tooltip>
    </Box>
  );

  // Render card-specific form fields
  const renderCardSearchFields = () => (
    <>
      <TextField
        fullWidth
        label="Card Name"
        value={localCardName}
        onChange={handleCardNameChange}
        placeholder="Search by card name"
        margin="dense"
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="disabled" />
              </InputAdornment>
            ),
          },
        }}
      />
      <TextField
        fullWidth
        label="Oracle Text"
        value={localOracleText}
        onChange={handleOracleChange}
        placeholder="Search card text"
        margin="dense"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Tooltip title={<OracleTextTooltip />} placement="right">
                <InfoOutlinedIcon color="disabled" sx={{ cursor: 'help' }} />
              </Tooltip>
            </InputAdornment>
          ),
        }}
      />
      <TextField
        fullWidth
        label="Artist"
        value={localArtist}
        onChange={handleArtistChange}
        placeholder="Search by artist name"
        margin="dense"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="disabled" />
            </InputAdornment>
          ),
        }}
      />
      <TypeSelector />
      <ColorSelector />
      <RaritySelector />
      {/* Hide SetSelector on set pages since we're already filtering by a specific set */}
      {!isSetPage && <SetSelector />}
      <Paper
        variant="outlined"
        sx={{
          borderColor: (theme) => theme.palette.grey[700],
          mt: 1.5,
          padding: '8px 8px 8px 1px', // Toggle overflows 7px on the right
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <FormControlLabel
          sx={{ margin: 0 }}
          control={
            <Switch
              checked={reduxOneResultPerCardName}
              onChange={handleOneResultPerCardNameChange}
              name="oneResultPerCardName"
              color="primary"
              size="small"
              sx={{ marginRight: '3px' }}
            />
          }
          label={<Box sx={{ display: 'flex', alignItems: 'center' }}>Hide duplicate printings</Box>}
        />
      </Paper>
      {/* Show includeSubsetsInSets toggle only on collection set pages */}
      {isCollectionSetPage && (
        <Paper
          variant="outlined"
          sx={{
            borderColor: (theme) => theme.palette.grey[700],
            mt: 1.5,
            padding: '8px 8px 8px 1px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <FormControlLabel
            sx={{ margin: 0 }}
            control={
              <Switch
                checked={reduxIncludeSubsetsInSet}
                onChange={handleIncludeSubsetsInSetChange}
                name="includeSubsetsInSets"
                color="primary"
                size="small"
                sx={{ marginRight: '3px' }}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                Track subsets with main set
                <Tooltip
                  title={
                    <div
                      dangerouslySetInnerHTML={{
                        __html:
                          'When enabled, the cost to complete will include subset cards in the calculation. <br /><br />Example: The cost to complete Tempest will include cards from Tempest Prerelease Promos and The List: Tempest.',
                      }}
                    />
                  }
                  placement="right"
                >
                  <InfoOutlinedIcon fontSize="small" sx={{ ml: 0.5, cursor: 'help', color: 'text.secondary' }} />
                </Tooltip>
              </Box>
            }
          />
        </Paper>
      )}
      <StatSearch />
    </>
  );

  // Render set-specific form fields
  const renderSetSearchFields = () => (
    <>
      <TextField
        fullWidth
        label="Set Name"
        value={localSetName}
        onChange={handleSetNameChange}
        placeholder="Search by set name"
        margin="dense"
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="disabled" />
              </InputAdornment>
            ),
          },
        }}
      />
      <TextField
        fullWidth
        label="Set Code"
        value={localSetCode}
        onChange={handleSetCodeChange}
        placeholder="Search by set code"
        margin="dense"
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="disabled" />
              </InputAdornment>
            ),
          },
        }}
      />
      <SetCategorySelector />
      <SetTypeSelector />
      {/* Only show completion status filter when viewing a collection */}
      {isCollectionPage && <CompletionStatusSelector />}
      <Paper
        variant="outlined"
        sx={{
          borderColor: (theme) => theme.palette.grey[700],
          mt: 1.5,
          padding: '8px 8px 8px 1px', // Toggle overflows 7px on the right
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <FormControlLabel
          sx={{ margin: 0 }}
          control={
            <Switch
              checked={reduxShowSubsets}
              onChange={handleShowSubsetsChange}
              name="showSubsets"
              color="primary"
              size="small"
              sx={{ marginRight: '3px' }}
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              Show subsets
              <Tooltip
                title={
                  <div
                    dangerouslySetInnerHTML={{
                      __html:
                        'Subsets are a piece of a larger set. <br /><br />Example: Tempest has subsets named Tempest Prerelease Promos and The List: Tempest.',
                    }}
                  />
                }
                placement="right"
              >
                <InfoOutlinedIcon fontSize="small" sx={{ ml: 0.5, cursor: 'help', color: 'text.secondary' }} />
              </Tooltip>
            </Box>
          }
        />
      </Paper>
      <Paper
        variant="outlined"
        sx={{
          borderColor: (theme) => theme.palette.grey[700],
          mt: 1.5,
          padding: '8px 8px 8px 1px', // Toggle overflows 7px on the right
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <FormControlLabel
          sx={{ margin: 0 }}
          control={
            <Switch
              checked={reduxIncludeSubsetsInSet}
              onChange={handleIncludeSubsetsInSetChange}
              name="includeSubsetsInSets"
              color="primary"
              size="small"
              sx={{ marginRight: '3px' }}
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              Track subsets with main set
              <Tooltip
                title={
                  <div
                    dangerouslySetInnerHTML={{
                      __html:
                        'When enabled, the cost to complete will include subset cards in the calculation. <br /><br />Example: The cost to complete Tempest will include cards from Tempest Prerelease Promos and The List: Tempest.',
                    }}
                  />
                }
                placement="right"
              >
                <InfoOutlinedIcon fontSize="small" sx={{ ml: 0.5, cursor: 'help', color: 'text.secondary' }} />
              </Tooltip>
            </Box>
          }
        />
      </Paper>
    </>
  );

  // Get sort options based on content type
  const getSortOptions = () => {
    if (contentType === 'cards') {
      const baseCardOptions = [
        <MenuItem key="name" value="name">
          Name
        </MenuItem>,
        <MenuItem key="releasedAt" value="releasedAt">
          Release Date
        </MenuItem>,
        <MenuItem key="collectorNumber" value="collectorNumber">
          Collector Number
        </MenuItem>,
        <MenuItem key="mtgcbCollectorNumber" value="mtgcbCollectorNumber">
          MTG CB Collector Number
        </MenuItem>,
        <MenuItem key="rarityNumeric" value="rarityNumeric">
          Rarity
        </MenuItem>,
        <MenuItem key="powerNumeric" value="powerNumeric">
          Power
        </MenuItem>,
        <MenuItem key="toughnessNumeric" value="toughnessNumeric">
          Toughness
        </MenuItem>,
        <MenuItem key="loyaltyNumeric" value="loyaltyNumeric">
          Loyalty
        </MenuItem>,
        <MenuItem key="convertedManaCost" value="convertedManaCost">
          Mana Value
        </MenuItem>,
        <MenuItem key="market" value="market">
          Price (Market)
          {isPriceMismatched('market') && <WarningTooltip priceType="Market" />}
        </MenuItem>,
        <MenuItem key="low" value="low">
          Price (Low)
          {isPriceMismatched('low') && <WarningTooltip priceType="Low" />}
        </MenuItem>,
        <MenuItem key="average" value="average">
          Price (Average)
          {isPriceMismatched('average') && <WarningTooltip priceType="Average" />}
        </MenuItem>,
        <MenuItem key="high" value="high">
          Price (High)
          {isPriceMismatched('high') && <WarningTooltip priceType="High" />}
        </MenuItem>,
        <MenuItem key="foil" value="foil">
          Price (Foil)
        </MenuItem>,
      ];

      // Add collection-specific sort options when viewing a collection
      if (isCollectionPage) {
        const collectionCardOptions = [
          <MenuItem key="quantityReg" value="quantityReg">
            Quantity (Regular)
          </MenuItem>,
          <MenuItem key="quantityFoil" value="quantityFoil">
            Quantity (Foil)
          </MenuItem>,
          <MenuItem key="quantityAll" value="quantityAll">
            Quantity (Total)
          </MenuItem>,
        ];
        return [...baseCardOptions, ...collectionCardOptions];
      }

      return baseCardOptions;
    } else {
      // Base set sort options
      const baseOptions = [
        <MenuItem key="name" value="name">
          Name
        </MenuItem>,
        <MenuItem key="code" value="code">
          Code
        </MenuItem>,
        <MenuItem key="releasedAt" value="releasedAt">
          Release Date
        </MenuItem>,
        <MenuItem key="cardCount" value="cardCount">
          Cards In Set
        </MenuItem>,
        <MenuItem key="setType" value="setType">
          Set Type
        </MenuItem>,
      ];

      // Add collection-specific sort options when viewing a collection
      if (isCollectionPage) {
        const collectionOptions = [
          <MenuItem key="percentageCollected" value="percentageCollected">
            Completion %
          </MenuItem>,
          <MenuItem key="totalValue" value="totalValue">
            Current Set Value
          </MenuItem>,
          <MenuItem key="costToComplete.oneOfEachCard" value="costToComplete.oneOfEachCard">
            Cost to Complete
          </MenuItem>,
        ];
        return [...baseOptions, ...collectionOptions];
      }

      return baseOptions;
    }
  };

  return (
    <FormWrapper>
      <Form sx={{ paddingTop: 0.5 }}>
        <Stack spacing={1.5}>
          {/* Only show the See Results button on mobile */}
          {isMobile && (
            <Box sx={{ mt: 3, mb: 2 }}>
              <Button variant="contained" fullWidth color="primary" onClick={handleSeeResults} size="large">
                View Search Results
              </Button>
            </Box>
          )}

          {/* Content Type Toggle - Hide on set pages since we're always viewing cards */}
          {!isSetPage && (
            <Box sx={{ mb: 1 }}>
              {/* Simple button-based toggle for maximum reliability */}
              <Stack direction="row" spacing={1}>
                <Button
                  variant={contentType === 'cards' ? 'contained' : 'outlined'}
                  size="small"
                  onClick={handleCardsClick}
                  startIcon={<StyleIcon sx={{ transform: 'scaleY(-1)' }} />}
                  fullWidth
                >
                  View Cards
                </Button>
                <Button
                  variant={contentType === 'sets' ? 'contained' : 'outlined'}
                  size="small"
                  onClick={handleSetsClick}
                  startIcon={<ViewModuleIcon />}
                  fullWidth
                >
                  View Sets
                </Button>
              </Stack>
            </Box>
          )}

          <Divider />

          {/* Render different form fields based on content type */}
          {contentType === 'cards' ? renderCardSearchFields() : renderSetSearchFields()}

          {/* Sort options - different for cards vs sets */}
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <FormControl size="small" sx={{ width: '65%' }}>
              <InputLabel id="sort-by-label">Sort By</InputLabel>
              <Select
                labelId="sort-by-label"
                value={reduxSortBy}
                label="Sort By"
                onChange={handleSortByChange}
                startAdornment={
                  <InputAdornment position="start">
                    <SortIcon color="disabled" />
                  </InputAdornment>
                }
              >
                {getSortOptions()}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ width: '35%' }}>
              <InputLabel id="sort-order-label">Order</InputLabel>
              <Select labelId="sort-order-label" value={reduxSortOrder} label="Order" onChange={handleSortOrderChange}>
                <MenuItem value="asc">ASC</MenuItem>
                <MenuItem value="desc">DESC</MenuItem>
              </Select>
            </FormControl>
          </Stack>
          <Button variant="outlined" startIcon={<RestartAltIcon />} onClick={handleResetSearch} sx={{ mt: 1 }}>
            Reset Search
          </Button>
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

const OracleTextTooltip = () => (
  <>
    <div>The following special symbols are supported:</div>
    <ul style={{ margin: '8px 0', paddingInlineStart: '20px' }}>
      <li>{`{T} – tap symbol`}</li>
      <li>{`{Q} – untap symbol`}</li>
      <li>{`{W} – white mana`}</li>
      <li>{`{U} – blue mana`}</li>
      <li>{`{B} – black mana`}</li>
      <li>{`{R} – red mana`}</li>
      <li>{`{G} – green mana`}</li>
      <li>{`{C} – colorless mana`}</li>
      <li>{`{X} – X generic mana`}</li>
      <li>{`{0} – zero mana`}</li>
      <li>{`{1} – one generic mana`}</li>
      <li>{`{2} – two generic mana`}</li>
      <li>{`{S} – snow mana`}</li>
      <li>{`{E} – energy symbol`}</li>
    </ul>
  </>
);

export default BrowseSearchForm;
