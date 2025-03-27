'use client';

import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SearchIcon from '@mui/icons-material/Search';
import SortIcon from '@mui/icons-material/Sort';
import VisibilityIcon from '@mui/icons-material/Visibility';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
  Box,
  Button,
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
import { useSnackbar } from 'notistack';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useDashboardContext } from '@/components/layout/Dashboard/context/DashboardContext';
import ColorSelector from '@/features/browse/ColorSelector';
import RaritySelector from '@/features/browse/RaritySelector';
import SetSelector from '@/features/browse/SetSelector';
import StatSearch from '@/features/browse/StatSearch';
import TypeSelector from '@/features/browse/TypeSelector';
import { useCardSettingGroups } from '@/hooks/useCardSettingGroups';
import { usePriceType } from '@/hooks/usePriceType';
import {
  resetSearch,
  selectArtist,
  selectOneResultPerCardName,
  selectOracleText,
  selectSearchName,
  selectSortBy,
  selectSortOrder,
  setArtist,
  setOneResultPerCardName,
  setOracleText,
  setSearchName,
  setSortBy,
  setSortOrder,
} from '@/redux/slices/browseSlice';
import { SortByOption, SortOrderOption } from '@/types/browse';
import { PriceType } from '@/types/pricing';

const BrowseSearchForm = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { setMobileOpen } = useDashboardContext();
  const { enqueueSnackbar } = useSnackbar();
  const initialCheckDone = useRef(false);

  const reduxName = useSelector(selectSearchName) || '';
  const reduxOracleText = useSelector(selectOracleText) || '';
  const reduxArtist = useSelector(selectArtist) || '';
  const reduxOneResultPerCardName = useSelector(selectOneResultPerCardName) || false;
  const reduxSortBy = useSelector(selectSortBy) || 'releasedAt';
  const reduxSortOrder = useSelector(selectSortOrder) || 'asc';

  const [localName, setLocalName] = useState(reduxName);
  const [localOracleText, setLocalOracleText] = useState(reduxOracleText);
  const [localArtist, setLocalArtist] = useState(reduxArtist);

  // Get the current display price type
  const displayPriceType = usePriceType();

  useEffect(() => {
    setLocalName(reduxName);
  }, [reduxName]);

  useEffect(() => {
    setLocalOracleText(reduxOracleText);
  }, [reduxOracleText]);

  useEffect(() => {
    setLocalArtist(reduxArtist);
  }, [reduxArtist]);

  // Reset the sort option if display price type changes and current sort option is now invalid
  useEffect(() => {
    // If current sort is a price type that doesn't match display price
    if (isPriceMismatched(reduxSortBy)) {
      // Set the sort to the current display price type if it's a price sort
      if (isPriceSort(reduxSortBy)) {
        dispatch(setSortBy(displayPriceType as SortByOption));
        enqueueSnackbar(
          `Changed sort to ${displayPriceType} prices to match your display settings`,
          {
            variant: 'info',
            autoHideDuration: 5000,
          },
        );
      }
    }
  }, [displayPriceType, reduxSortBy, dispatch, enqueueSnackbar]);

  // Check for price mismatch only on initial load
  useEffect(() => {
    if (initialCheckDone.current) return;

    const isPriceSort =
      reduxSortBy === 'market' ||
      reduxSortBy === 'low' ||
      reduxSortBy === 'average' ||
      reduxSortBy === 'high' ||
      reduxSortBy === 'foil';

    if (isPriceSort && reduxSortBy !== displayPriceType && reduxSortBy !== 'foil') {
      // Change the sort option to match the display price type
      dispatch(setSortBy(displayPriceType as SortByOption));
      enqueueSnackbar(`Changed sort to ${displayPriceType} prices to match your display settings`, {
        variant: 'info',
        autoHideDuration: 5000,
      });
    }

    initialCheckDone.current = true;
  }, [reduxSortBy, displayPriceType, enqueueSnackbar, dispatch]);

  const debouncedNameDispatch = useCallback(
    debounce((value: string) => {
      dispatch(setSearchName(value));
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

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalName(newValue);
    debouncedNameDispatch(newValue);
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

  const handleSortByChange = (e: SelectChangeEvent<SortByOption>) => {
    const newSortBy = e.target.value as SortByOption;
    dispatch(setSortBy(newSortBy));
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

  // Function to check if a sort option is price-related
  const isPriceSort = (option: string): boolean => {
    return (
      option === 'market' ||
      option === 'low' ||
      option === 'average' ||
      option === 'high' ||
      option === 'foil'
    );
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
      <Tooltip
        title={`To sort by ${priceType} price, change your display price setting to ${priceType} in the gear icon menu on the top-right`}
      >
        <WarningAmberIcon color="disabled" fontSize="small" />
      </Tooltip>
    </Box>
  );

  return (
    <FormWrapper>
      <Form sx={{ paddingTop: 0.5 }}>
        <Stack spacing={1.5}>
          {/* Only show the See Results button on mobile */}
          {isMobile && (
            <Box sx={{ mt: 3, mb: 2 }}>
              <Button
                variant="contained"
                fullWidth
                color="primary"
                onClick={handleSeeResults}
                size="large"
              >
                View Search Results
              </Button>
            </Box>
          )}
          <TextField
            fullWidth
            label="Card Name"
            value={localName}
            onChange={handleNameChange}
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
          <SetSelector />
          <FormControlLabel
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
            label="Hide duplicate printings"
            sx={
              {
                // TODO: Debating these styles, leaving them here for now
                // border: '1px solid #616161',
                // borderRadius: '4px',
                // padding: '8px',
              }
            }
          />
          <StatSearch />
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
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="releasedAt">Release Date</MenuItem>
                <MenuItem value="collectorNumber">Collector Number</MenuItem>
                <MenuItem value="mtgcbCollectorNumber">MTG CB Collector Number</MenuItem>
                <MenuItem value="rarityNumeric">Rarity</MenuItem>
                <MenuItem value="powerNumeric">Power</MenuItem>
                <MenuItem value="toughnessNumeric">Toughness</MenuItem>
                <MenuItem value="loyaltyNumeric">Loyalty</MenuItem>
                <MenuItem value="market" disabled={isPriceMismatched('market')}>
                  Price (Market)
                  {isPriceMismatched('market') && <WarningTooltip priceType="Market" />}
                </MenuItem>
                <MenuItem value="low" disabled={isPriceMismatched('low')}>
                  Price (Low)
                  {isPriceMismatched('low') && <WarningTooltip priceType="Low" />}
                </MenuItem>
                <MenuItem value="average" disabled={isPriceMismatched('average')}>
                  Price (Average)
                  {isPriceMismatched('average') && <WarningTooltip priceType="Average" />}
                </MenuItem>
                <MenuItem value="high" disabled={isPriceMismatched('high')}>
                  Price (High)
                  {isPriceMismatched('high') && <WarningTooltip priceType="High" />}
                </MenuItem>
                <MenuItem value="foil">Price (Foil)</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ width: '35%' }}>
              <InputLabel id="sort-order-label">Order</InputLabel>
              <Select
                labelId="sort-order-label"
                value={reduxSortOrder}
                label="Order"
                onChange={handleSortOrderChange}
              >
                <MenuItem value="asc">ASC</MenuItem>
                <MenuItem value="desc">DESC</MenuItem>
              </Select>
            </FormControl>
          </Stack>
          <Button
            variant="outlined"
            startIcon={<RestartAltIcon />}
            onClick={handleResetSearch}
            sx={{ mt: 1 }}
          >
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
