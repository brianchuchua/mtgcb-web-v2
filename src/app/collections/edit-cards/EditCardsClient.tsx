'use client';

import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Grid,
  IconButton,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  debounce,
  styled,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGetCardsQuery, useLazyGetCardsQuery } from '@/api/browse/browseApi';
import { CardModel } from '@/api/browse/types';
import { useGetAllSetsQuery } from '@/api/sets/setsApi';
import { useUpdateCollectionMutation } from '@/api/collections/collectionsApi';
import CardPrice from '@/components/cards/CardPrice';
import { useAuth } from '@/hooks/useAuth';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { usePriceType } from '@/hooks/usePriceType';
import { generateTCGPlayerLink } from '@/utils/affiliateLinkBuilder';
import { generateCardUrl } from '@/utils/cards/generateCardSlug';
import { getCardImageUrl } from '@/utils/cards/getCardImageUrl';

const EditCardsClient: React.FC = () => {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [searchInput, setSearchInput] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [selectedCard, setSelectedCard] = useState<CardOption | null>(null);
  const [selectedSet, setSelectedSet] = useState<SetOption | null>(null);
  const [quantityRegular, setQuantityRegular] = useState(1);
  const [quantityFoil, setQuantityFoil] = useState(0);
  const [editMode, setEditMode] = useLocalStorage<EditMode>('editCardsMode', 'increment');
  const [currentQuantities, setCurrentQuantities] = useState({ regular: 0, foil: 0 });
  const priceType = usePriceType();
  const { user } = useAuth();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [allCards, setAllCards] = useState<CardModel[]>([]);
  const [isLoadingAllCards, setIsLoadingAllCards] = useState(false);
  const [triggerGetCards] = useLazyGetCardsQuery();

  const { data: searchResponse, isFetching: isSearching } = useGetCardsQuery(
    {
      name: searchInput,
      limit: 500,
      offset: 0,
      sortBy: 'releasedAt',
      sortDirection: 'desc',
      userId: user?.userId,
      priceType: priceType,
      ...(selectedSet && selectedSet.value !== 'all' && { setId: parseInt(selectedSet.value) }),
    },
    {
      skip: searchInput.length < 2 && (!selectedSet || selectedSet.value === 'all'),
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    },
  );

  // Fetch all cards when a set is selected and no search input
  useEffect(() => {
    const fetchAllCardsForSet = async () => {
      if (!selectedSet || selectedSet.value === 'all' || searchInput.length >= 2) {
        setAllCards([]);
        return;
      }

      setIsLoadingAllCards(true);
      const allCardsList: CardModel[] = [];
      let offset = 0;
      const limit = 500;

      try {
        // First call to get total count
        const firstResponse = await triggerGetCards({
          limit,
          offset,
          sortBy: 'releasedAt',
          sortDirection: 'desc',
          userId: user?.userId,
          priceType: priceType,
          setId: parseInt(selectedSet.value),
        }).unwrap();

        if (firstResponse.data) {
          allCardsList.push(...firstResponse.data.cards);
          const totalCount = firstResponse.data.totalCount;

          // Make additional calls if needed
          while (allCardsList.length < totalCount) {
            offset += limit;
            const response = await triggerGetCards({
              limit,
              offset,
              sortBy: 'releasedAt',
              sortDirection: 'desc',
              userId: user?.userId,
              priceType: priceType,
              setId: parseInt(selectedSet.value),
            }).unwrap();

            if (response.data) {
              allCardsList.push(...response.data.cards);
            }
          }
        }

        setAllCards(allCardsList);
      } catch (error) {
        console.error('Error fetching all cards for set:', error);
      } finally {
        setIsLoadingAllCards(false);
      }
    };

    fetchAllCardsForSet();
  }, [selectedSet, searchInput.length, user?.userId, priceType, triggerGetCards]);

  const { data: setsResponse, isFetching: isLoadingSets } = useGetAllSetsQuery(undefined, {
    refetchOnMountOrArgChange: false,
    refetchOnFocus: false,
    refetchOnReconnect: false,
  });

  const [updateCollection, { isLoading: isUpdating }] = useUpdateCollectionMutation();

  const debouncedSetSearchInput = useMemo(() => debounce((value: string) => setSearchInput(value), 300), []);

  const handleSearchInputChange = (_event: any, value: string, reason: string) => {
    setInputValue(value);
    // Only trigger search if the user is typing, not when selecting from dropdown
    if (reason === 'input') {
      debouncedSetSearchInput(value);
    }
  };

  const setOptions: SetOption[] = useMemo(() => {
    const allOption: SetOption = { value: 'all', label: 'All Sets', name: 'All Sets', code: '' };
    
    if (!setsResponse?.data?.sets) return [allOption];

    const setOptions = setsResponse.data.sets.map((set: any) => ({
      value: set.id.toString(),
      label: `${set.name} (${set.code})`,
      name: set.name,
      code: set.code,
    }));

    return [allOption, ...setOptions];
  }, [setsResponse]);

  const cardOptions: CardOption[] = useMemo(() => {
    // When a set is selected and no search input, use allCards
    if (selectedSet && selectedSet.value !== 'all' && searchInput.length < 2) {
      return allCards.map((card: CardModel) => ({
        id: card.id,
        name: card.name,
        setName: card.setName,
        label: `${card.name} [${card.setName}]`,
        card,
      }));
    }
    
    // Otherwise use search response
    if (!searchResponse?.data?.cards) return [];
    
    // Require at least 2 characters of search input when not filtering by set
    if (searchInput.length < 2) return [];

    return searchResponse.data.cards.map((card: CardModel) => ({
      id: card.id,
      name: card.name,
      setName: card.setName,
      label: `${card.name} [${card.setName}]`,
      card,
    }));
  }, [searchResponse, searchInput, selectedSet, allCards]);

  useEffect(() => {
    if (selectedCard?.card.quantityReg !== undefined) {
      setCurrentQuantities({
        regular: selectedCard.card.quantityReg || 0,
        foil: selectedCard.card.quantityFoil || 0,
      });

      if (editMode === 'increment' || editMode === 'decrement') {
        setQuantityRegular(1);
        setQuantityFoil(0);
      } else {
        setQuantityRegular(selectedCard.card.quantityReg || 0);
        setQuantityFoil(selectedCard.card.quantityFoil || 0);
      }
    }
  }, [selectedCard, editMode]);

  const handleCardSelect = (_event: any, value: CardOption | null) => {
    setSelectedCard(value);
  };

  const handleSetSelect = (_event: any, value: SetOption | null) => {
    setSelectedSet(value);
    // Clear the search when changing sets
    setSearchInput('');
    setInputValue('');
    setSelectedCard(null);
  };

  const handleCardClick = useCallback(() => {
    if (selectedCard) {
      const cardUrl = generateCardUrl(selectedCard.name, selectedCard.id);
      router.push(cardUrl);
    }
  }, [selectedCard, router]);

  const handleSave = async () => {
    if (!selectedCard) return;

    try {
      const updateData = {
        mode: editMode === 'decrement' ? 'increment' : editMode,
        cards: [
          {
            cardId: parseInt(selectedCard.id),
            quantityReg: editMode === 'decrement' ? -quantityRegular : quantityRegular,
            quantityFoil: editMode === 'decrement' ? -quantityFoil : quantityFoil,
          },
        ],
      };

      await updateCollection(updateData).unwrap();

      let finalRegular: number;
      let finalFoil: number;

      if (editMode === 'increment') {
        finalRegular = currentQuantities.regular + quantityRegular;
        finalFoil = currentQuantities.foil + quantityFoil;
      } else if (editMode === 'decrement') {
        finalRegular = Math.max(0, currentQuantities.regular - quantityRegular);
        finalFoil = Math.max(0, currentQuantities.foil - quantityFoil);
      } else {
        finalRegular = quantityRegular;
        finalFoil = quantityFoil;
      }

      // Create message in consistent format
      let message = `${selectedCard.name} has been set to ${finalRegular}`;
      if (finalFoil > 0) {
        message += ` and ${finalFoil} foil${finalFoil !== 1 ? 's' : ''}`;
      }

      enqueueSnackbar(message, {
        variant: 'success',
        autoHideDuration: 3000,
      });

      // Reset form and clear search
      setSelectedCard(null);
      setQuantityRegular(editMode === 'increment' || editMode === 'decrement' ? 1 : 0);
      setQuantityFoil(0);
      setCurrentQuantities({ regular: 0, foil: 0 });
      setInputValue('');
      setSearchInput('');
      // Don't reset the selected set, keep it for convenience

      // Focus back on search input
      searchInputRef.current?.focus();
    } catch (error) {
      enqueueSnackbar(`Failed to update ${selectedCard.name}`, { variant: 'error' });
    }
  };

  return (
    <PageContainer>
      <ContentWrapper>
        <HeaderSection>
          <Typography variant="h4" sx={{ color: 'primary.main', textAlign: 'center', flexGrow: 1 }}>
            Add or Remove Cards
          </Typography>
        </HeaderSection>

        <SearchSection>
          <CardSearchAutocomplete
            cardOptions={cardOptions}
            selectedCard={selectedCard}
            handleCardSelect={handleCardSelect}
            inputValue={inputValue}
            handleSearchInputChange={handleSearchInputChange}
            isSearching={isSearching || isLoadingAllCards}
            searchInputRef={searchInputRef}
            searchInput={searchInput}
            setOptions={setOptions}
            selectedSet={selectedSet}
            handleSetSelect={handleSetSelect}
            isLoadingSets={isLoadingSets}
            searchResponse={searchResponse}
          />
        </SearchSection>

        {selectedCard && (
          <>
            <CardDisplaySection>
              <CardDisplay selectedCard={selectedCard} handleCardClick={handleCardClick} priceType={priceType} />
            </CardDisplaySection>

            <QuantityEditorSection>
              <QuantityEditor
                quantityRegular={quantityRegular}
                setQuantityRegular={setQuantityRegular}
                quantityFoil={quantityFoil}
                setQuantityFoil={setQuantityFoil}
                currentQuantities={currentQuantities}
                editMode={editMode}
                setEditMode={setEditMode}
                handleSave={handleSave}
                isUpdating={isUpdating}
              />
            </QuantityEditorSection>
          </>
        )}
      </ContentWrapper>
    </PageContainer>
  );
};

type EditMode = 'increment' | 'decrement' | 'set';

interface CardOption {
  id: string;
  name: string;
  setName: string;
  label: string;
  card: CardModel;
}

interface SetOption {
  value: string;
  label: string;
  name: string;
  code: string;
}

interface CardSearchAutocompleteProps {
  cardOptions: CardOption[];
  selectedCard: CardOption | null;
  handleCardSelect: (event: any, value: CardOption | null) => void;
  inputValue: string;
  handleSearchInputChange: (event: any, value: string, reason: string) => void;
  isSearching: boolean;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  searchInput: string;
  setOptions: SetOption[];
  selectedSet: SetOption | null;
  handleSetSelect: (event: any, value: SetOption | null) => void;
  isLoadingSets: boolean;
  searchResponse: any;
}

const CardSearchAutocomplete: React.FC<CardSearchAutocompleteProps> = ({
  cardOptions,
  selectedCard,
  handleCardSelect,
  inputValue,
  handleSearchInputChange,
  isSearching,
  searchInputRef,
  searchInput,
  setOptions,
  selectedSet,
  handleSetSelect,
  isLoadingSets,
  searchResponse,
}) => {
  return (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'center' }}>
      <Autocomplete
        options={setOptions}
        getOptionLabel={(option) => option.code || 'All'}
        getOptionKey={(option) => option.value}
        renderOption={(props, option) => {
          const { key, ...otherProps } = props as any;
          return (
            <Box component="li" key={key} {...otherProps}>
              {option.label}
            </Box>
          );
        }}
        value={selectedSet || setOptions[0]}
        onChange={handleSetSelect}
        loading={isLoadingSets}
        fullWidth
        isOptionEqualToValue={(option, value) => option.value === value.value}
        filterOptions={(options, params) => {
          const filtered = options.filter((option) => {
            const searchTerm = params.inputValue.toLowerCase();
            return option.name.toLowerCase().includes(searchTerm) || 
                   option.code.toLowerCase().includes(searchTerm);
          });
          return filtered;
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Set"
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {isLoadingSets ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        sx={{
          maxWidth: 120,
          '& .MuiAutocomplete-input': {
            minWidth: '40px !important',
          },
        }}
        slotProps={{
          paper: {
            sx: {
              width: 'auto',
              minWidth: 350,
            },
          },
        }}
      />
      <Autocomplete
        options={cardOptions}
        getOptionKey={(option) => option.id}
        getOptionLabel={(option) => option.label}
        value={selectedCard}
        onChange={handleCardSelect}
        inputValue={inputValue}
        onInputChange={handleSearchInputChange}
        loading={isSearching}
        autoFocus
        fullWidth
        isOptionEqualToValue={(option, value) => option.id === value.id}
        renderInput={(params) => (
          <TextField
            {...params}
            label={selectedSet && selectedSet.value !== 'all' ? `Search in ${selectedSet.name}` : "Search cards to add or remove!"}
            placeholder="Ex. Giant Spider"
            autoFocus
            inputRef={searchInputRef}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {isSearching ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        noOptionsText={
          selectedSet && selectedSet.value !== 'all' && searchInput.length < 1
            ? `Showing all cards from ${selectedSet.name}`
            : searchInput.length < 2
            ? 'Start typing to search for a card'
            : 'No cards found -- try another search'
        }
        ListboxProps={{
          onScroll: (event: React.UIEvent<HTMLUListElement>) => {
            const listbox = event.currentTarget;
            if (listbox.scrollTop + listbox.clientHeight >= listbox.scrollHeight - 10) {
              // User has scrolled to bottom
            }
          },
        }}
        renderOption={(props, option, { index }) => {
          const { key, ...otherProps } = props as any;
          const isLastItem = index === cardOptions.length - 1;
          const totalCount = searchResponse?.data?.totalCount || 0;
          const showLimitMessage = (!selectedSet || selectedSet.value === 'all') && totalCount > 500 && isLastItem && cardOptions.length === 500;
          
          return (
            <React.Fragment key={key}>
              <Box component="li" {...otherProps}>
                {option.label}
              </Box>
              {showLimitMessage && (
                <Box
                  component="li"
                  sx={{
                    padding: 2,
                    textAlign: 'center',
                    color: 'text.secondary',
                    fontStyle: 'italic',
                    borderTop: 1,
                    borderColor: 'divider',
                  }}
                >
                  Showing first 500 results of {totalCount.toLocaleString()}. Please refine your search for more specific results.
                </Box>
              )}
            </React.Fragment>
          );
        }}
        sx={{
          flex: 1,
          maxWidth: { xs: '100%', sm: '100%', md: '500px' },
        }}
      />
    </Box>
  );
};

interface CardDisplayProps {
  selectedCard: CardOption;
  handleCardClick: () => void;
  priceType: string;
}

const CardDisplay: React.FC<CardDisplayProps> = ({ selectedCard, handleCardClick, priceType }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <CardWrapper>
        <SimpleCardImage
          src={getCardImageUrl(selectedCard.card.id)}
          alt={selectedCard.card.name}
          onClick={handleCardClick}
          loading="lazy"
          setName={selectedCard.card.setName}
        />
      </CardWrapper>
      <CardMetadata selectedCard={selectedCard} handleCardClick={handleCardClick} priceType={priceType} />
    </Box>
  );
};

interface CardMetadataProps {
  selectedCard: CardOption;
  handleCardClick: () => void;
  priceType: string;
}

const CardMetadata: React.FC<CardMetadataProps> = ({ selectedCard, handleCardClick, priceType }) => {
  return (
    <Box sx={{ mt: 1, flexShrink: 0, textAlign: 'center' }}>
      <Box
        component="a"
        href={generateTCGPlayerLink(selectedCard.card.tcgplayerId, selectedCard.card.name)}
        target="_blank"
        rel="noreferrer"
        sx={{
          display: 'block',
          textDecoration: 'none',
          '&:hover': {
            textDecoration: 'underline',
          },
          cursor: 'pointer',
          color: (theme) => theme.palette.primary.main,
        }}
      >
        <CardPrice
          prices={{
            normal: {
              market: selectedCard.card.market ? parseFloat(selectedCard.card.market) : null,
              low: selectedCard.card.low ? parseFloat(selectedCard.card.low) : null,
              average: selectedCard.card.average ? parseFloat(selectedCard.card.average) : null,
              high: selectedCard.card.high ? parseFloat(selectedCard.card.high) : null,
            },
            foil: selectedCard.card.foil
              ? {
                  market: parseFloat(selectedCard.card.foil) || null,
                  low: null,
                  average: null,
                  high: null,
                }
              : null,
          }}
          priceType={priceType as any}
          centered={true}
        />
      </Box>
    </Box>
  );
};

interface QuantityEditorProps {
  quantityRegular: number;
  setQuantityRegular: (value: number) => void;
  quantityFoil: number;
  setQuantityFoil: (value: number) => void;
  currentQuantities: { regular: number; foil: number };
  editMode: EditMode;
  setEditMode: (mode: EditMode) => void;
  handleSave: () => void;
  isUpdating: boolean;
}

const QuantityEditor: React.FC<QuantityEditorProps> = ({
  quantityRegular,
  setQuantityRegular,
  quantityFoil,
  setQuantityFoil,
  currentQuantities,
  editMode,
  setEditMode,
  handleSave,
  isUpdating,
}) => {
  const getQuantityLabel = (type: 'Regular' | 'Foils', current: number, input: number) => {
    if (editMode === 'increment') {
      const newValue = current + input;
      // Only show arrow if there's a change
      if (input === 0) {
        return `${type} (${current})`;
      }
      return `${type} (${current} → ${newValue})`;
    } else if (editMode === 'decrement') {
      const newValue = Math.max(0, current - input);
      // Only show arrow if there's a change
      if (input === 0 || current === 0) {
        return `${type} (${current})`;
      }
      return `${type} (${current} → ${newValue})`;
    } else {
      // Set mode - only show arrow if values differ
      if (input === current) {
        return `${type} (${current})`;
      }
      return `${type} (${current} → ${input})`;
    }
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={6}>
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, textAlign: 'center' }}>
            {getQuantityLabel('Regular', currentQuantities.regular, quantityRegular)}
          </Typography>
          <QuantityContainer>
            <QuantityLeftButton
              size="small"
              onMouseDown={(e) => {
                e.preventDefault();
                e.currentTarget.blur();
                setQuantityRegular(Math.max(0, quantityRegular - 1));
              }}
              disabled={quantityRegular === 0}
              tabIndex={-1}
              disableFocusRipple
            >
              <RemoveIcon />
            </QuantityLeftButton>
            <QuantityInput
              type="number"
              value={quantityRegular}
              onChange={(e) => setQuantityRegular(Math.max(0, parseInt(e.target.value) || 0))}
              inputProps={{ min: 0 }}
              autoFocus
              onFocus={(e) => e.target.select()}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSave();
                }
              }}
              variant="outlined"
              size="small"
            />
            <QuantityRightButton
              size="small"
              onMouseDown={(e) => {
                e.preventDefault();
                e.currentTarget.blur();
                setQuantityRegular(quantityRegular + 1);
              }}
              tabIndex={-1}
              disableFocusRipple
            >
              <AddIcon />
            </QuantityRightButton>
          </QuantityContainer>
        </Box>
      </Grid>
      <Grid item xs={6}>
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, textAlign: 'center' }}>
            {getQuantityLabel('Foils', currentQuantities.foil, quantityFoil)}
          </Typography>
          <QuantityContainer>
            <QuantityLeftButton
              size="small"
              onMouseDown={(e) => {
                e.preventDefault();
                e.currentTarget.blur();
                setQuantityFoil(Math.max(0, quantityFoil - 1));
              }}
              disabled={quantityFoil === 0}
              tabIndex={-1}
              disableFocusRipple
            >
              <RemoveIcon />
            </QuantityLeftButton>
            <QuantityInput
              type="number"
              value={quantityFoil}
              onChange={(e) => setQuantityFoil(Math.max(0, parseInt(e.target.value) || 0))}
              inputProps={{ min: 0 }}
              onFocus={(e) => e.target.select()}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSave();
                }
              }}
              variant="outlined"
              size="small"
            />
            <QuantityRightButton
              size="small"
              onMouseDown={(e) => {
                e.preventDefault();
                e.currentTarget.blur();
                setQuantityFoil(quantityFoil + 1);
              }}
              tabIndex={-1}
              disableFocusRipple
            >
              <AddIcon />
            </QuantityRightButton>
          </QuantityContainer>
        </Box>
      </Grid>
      <Grid item xs={12}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <ToggleButtonGroup
              value={editMode}
              exclusive
              onChange={(event, newMode) => {
                if (newMode !== null) {
                  setEditMode(newMode);
                }
              }}
              aria-label="edit mode"
              size="small"
            >
              <ToggleButton value="increment" aria-label="increment mode" sx={{ px: 1, py: 0.5 }}>
                Add
              </ToggleButton>
              <ToggleButton value="decrement" aria-label="decrement mode" sx={{ px: 1, py: 0.5 }}>
                Remove
              </ToggleButton>
              <ToggleButton value="set" aria-label="set mode" sx={{ px: 1, py: 0.5 }}>
                Set
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
          <Button fullWidth variant="contained" onClick={handleSave} disabled={isUpdating} sx={{ flexGrow: 1 }}>
            {isUpdating ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </Stack>
      </Grid>
    </Grid>
  );
};

const PageContainer = styled(Box)(({ theme }) => ({
  height: 'calc(100vh - 64px - 24px)', // 100vh - header (64px) - wrapper paddings
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  padding: theme.spacing(0),
}));

const ContentWrapper = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  maxWidth: 1200,
  width: '100%',
  margin: '0 auto',
  minHeight: 0, // Important for Firefox
}));

const HeaderSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(2),
  flexShrink: 0,
}));

const SearchSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  flexShrink: 0,
}));

const CardDisplaySection = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 0, // Allow shrinking
  overflow: 'hidden', // Prevent overflow
  padding: theme.spacing(0),
}));

const CardWrapper = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  minHeight: 0, // Important for flex children
  width: '100%',
}));

interface SimpleCardImageProps {
  setName?: string;
}

const SimpleCardImage = styled('img')<SimpleCardImageProps>(({ theme, setName }) => ({
  maxWidth: '100%',
  maxHeight: '100%',
  width: 'auto',
  height: 'auto',
  objectFit: 'contain',
  borderRadius: setName === 'Limited Edition Alpha' ? '7%' : '5%',
  boxShadow: theme.shadows[4],
  cursor: 'pointer',
}));

const QuantityEditorSection = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  maxWidth: 600,
  width: '100%',
  margin: '0 auto',
  flexShrink: 0,
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(3),
  },
}));

const QuantityContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  '&:focus-within': {
    '& button': {
      borderColor: theme.palette.primary.main,
    },
  },
}));

const QuantityInput = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-input': {
    padding: '6px 12px',
    textAlign: 'center',
    fontSize: '1rem',
    height: '28px',
    boxSizing: 'border-box',
  },
  '& .MuiOutlinedInput-root': {
    height: '40px',
    borderRadius: 0,
    '& fieldset': {
      borderLeft: 'none',
      borderRight: 'none',
      borderColor: theme.palette.divider,
      transition: 'border-color 0.2s',
    },
    '&:hover fieldset': {
      borderColor: theme.palette.divider,
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main,
      borderWidth: 1,
    },
  },
  '& input[type="number"]::-webkit-inner-spin-button, & input[type="number"]::-webkit-outer-spin-button': {
    WebkitAppearance: 'none',
    margin: 0,
  },
  '& input[type="number"]': {
    MozAppearance: 'textfield',
  },
  width: '100px',
}));

const QuantityButton = styled(IconButton)(({ theme }) => ({
  padding: '8px',
  height: '40px',
  width: '40px',
  borderRadius: 0,
  border: `1px solid ${theme.palette.divider}`,
  transition: 'all 0.2s',
  backgroundColor: theme.palette.background.paper,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    borderColor: theme.palette.divider,
  },
  '&.Mui-disabled': {
    borderColor: theme.palette.divider,
  },
  '& .MuiSvgIcon-root': {
    fontSize: '1.25rem',
  },
}));

const QuantityLeftButton = styled(QuantityButton)(({ theme }) => ({
  borderTopLeftRadius: theme.shape.borderRadius,
  borderBottomLeftRadius: theme.shape.borderRadius,
  borderRight: 'none',
}));

const QuantityRightButton = styled(QuantityButton)(({ theme }) => ({
  borderTopRightRadius: theme.shape.borderRadius,
  borderBottomRightRadius: theme.shape.borderRadius,
  borderLeft: 'none',
}));

export default EditCardsClient;
