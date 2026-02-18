'use client';

import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
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
import { useGetLocationHierarchyQuery } from '@/api/locations/locationsApi';
import { LocationHierarchy } from '@/api/locations/types';
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
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
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
      ...(selectedSet && selectedSet.value !== 'all' && { setId: { OR: [selectedSet.value] } }),
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
          setId: { OR: [selectedSet.value] },
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
              setId: { OR: [selectedSet.value] },
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

  const { data: locationsResponse } = useGetLocationHierarchyQuery(undefined, {
    refetchOnMountOrArgChange: false,
    refetchOnFocus: false,
    refetchOnReconnect: false,
  });
  const locations = locationsResponse?.data || [];

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
        label: `${card.name}${card.flavorName ? ` (${card.flavorName})` : ''} [${card.setName}]`,
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
      label: `${card.name}${card.flavorName ? ` (${card.flavorName})` : ''} [${card.setName}]`,
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
        // Smart defaults based on what the card can be
        if (!selectedCard.card.canBeNonFoil && selectedCard.card.canBeFoil) {
          // Foil-only card: default to 0 regular, 1 foil
          setQuantityRegular(0);
          setQuantityFoil(1);
        } else {
          // Most common case: can be non-foil, default to 1 regular, 0 foil
          setQuantityRegular(1);
          setQuantityFoil(0);
        }
      } else {
        // Set mode: use actual quantities
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
            ...(selectedLocation && editMode !== 'decrement' && { locationId: selectedLocation }),
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
      // Don't reset the selected set or location, keep them for convenience

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
                canBeNonFoil={selectedCard.card.canBeNonFoil}
                canBeFoil={selectedCard.card.canBeFoil}
                locations={locations}
                selectedLocation={selectedLocation}
                setSelectedLocation={setSelectedLocation}
              />
            </QuantityEditorSection>

            <CardDisplaySection>
              <CardDisplay selectedCard={selectedCard} handleCardClick={handleCardClick} priceType={priceType} />
            </CardDisplaySection>
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
        filterOptions={(x) => x}
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
        cardId={selectedCard.card.id}
        cardName={selectedCard.card.name}
        tcgplayerId={selectedCard.card.tcgplayerId || undefined}
      />
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
  canBeNonFoil?: boolean;
  canBeFoil?: boolean;
  locations: LocationHierarchy[];
  selectedLocation: number | null;
  setSelectedLocation: (locationId: number | null) => void;
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
  canBeNonFoil = true,
  canBeFoil = true,
  locations,
  selectedLocation,
  setSelectedLocation,
}) => {
  // Override state
  const [overrideNonFoil, setOverrideNonFoil] = useState(false);
  const [overrideFoil, setOverrideFoil] = useState(false);
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [overrideDialogType, setOverrideDialogType] = useState<'regular' | 'foil'>('regular');

  // Determine error states based on edit mode and override state
  const regularHasError = !canBeNonFoil && !overrideNonFoil && (
    (editMode === 'set' && quantityRegular > 0) ||
    (editMode === 'increment' && quantityRegular > 0) ||
    (editMode === 'decrement' && currentQuantities.regular > 0)
  );

  const foilHasError = !canBeFoil && !overrideFoil && (
    (editMode === 'set' && quantityFoil > 0) ||
    (editMode === 'increment' && quantityFoil > 0) ||
    (editMode === 'decrement' && currentQuantities.foil > 0)
  );

  // Determine disabled states - check override
  const isRegularDisabled = !canBeNonFoil && !overrideNonFoil && editMode !== 'decrement';
  const isFoilDisabled = !canBeFoil && !overrideFoil && editMode !== 'decrement';

  // Get contextual tooltip messages
  const getTooltipMessage = (type: 'regular' | 'foil', hasError: boolean, isDisabled: boolean) => {
    const cardType = type === 'regular' ? 'non-foil' : 'foil';
    const canEdit = type === 'regular' ? (canBeNonFoil || overrideNonFoil) : (canBeFoil || overrideFoil);

    if (!canEdit) {
      if (!hasError) {
        return `This card doesn't come in ${cardType}. (Click to override.)`;
      }

      switch (editMode) {
        case 'set':
          return `This card doesn't come in ${cardType}. You can only set to 0. (Click to override.)`;
        case 'increment':
          return `This card doesn't come in ${cardType}. You cannot add any. (Click to override.)`;
        case 'decrement':
          return `This card doesn't come in ${cardType}. You can only remove existing cards.`;
      }
    }

    return '';
  };

  const handleDisabledFieldClick = (type: 'regular' | 'foil') => {
    setOverrideDialogType(type);
    setShowOverrideDialog(true);
  };

  const handleOverrideConfirm = () => {
    if (overrideDialogType === 'regular') {
      setOverrideNonFoil(true);
    } else {
      setOverrideFoil(true);
    }
    setShowOverrideDialog(false);
  };

  const handleOverrideCancel = () => {
    setShowOverrideDialog(false);
  };

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

  // Helper function to render location options with indentation
  const renderLocationOptions = (locs: LocationHierarchy[], depth = 0): React.ReactNode[] => {
    const options: React.ReactNode[] = [];

    for (const loc of locs) {
      const indent = '\u00A0\u00A0'.repeat(depth * 2); // Non-breaking spaces
      const prefix = depth > 0 ? '└ ' : '';

      options.push(
        <MenuItem key={loc.id} value={loc.id}>
          <Box sx={{ width: '100%' }}>
            <Typography variant="body2">
              {indent}{prefix}{loc.name}
            </Typography>
            {loc.description && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', pl: depth * 2 }}>
                {loc.description}
              </Typography>
            )}
          </Box>
        </MenuItem>
      );

      if (loc.children.length > 0) {
        options.push(...renderLocationOptions(loc.children, depth + 1));
      }
    }

    return options;
  };

  // Show location picker only if:
  // 1. User has at least one location
  // 2. Mode is 'set' or 'increment' (not 'decrement')
  const showLocationPicker = locations.length > 0 && editMode !== 'decrement';

  return (
    <Grid container spacing={2}>
      <Grid item xs={6}>
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, textAlign: 'center' }}>
            {getQuantityLabel('Regular', currentQuantities.regular, quantityRegular)}
          </Typography>
          <Tooltip
            title={getTooltipMessage('regular', regularHasError, isRegularDisabled)}
            placement="top"
            disableHoverListener={!getTooltipMessage('regular', regularHasError, isRegularDisabled)}
            disableFocusListener={!getTooltipMessage('regular', regularHasError, isRegularDisabled)}
            disableTouchListener={!getTooltipMessage('regular', regularHasError, isRegularDisabled)}
          >
            <QuantityContainer
              onClick={(e) => {
                if (isRegularDisabled) {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDisabledFieldClick('regular');
                }
              }}
              sx={{
                cursor: isRegularDisabled ? 'pointer' : undefined,
              }}
            >
              <QuantityLeftButton
                size="small"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.currentTarget.blur();
                  if (isRegularDisabled) {
                    handleDisabledFieldClick('regular');
                  } else {
                    setQuantityRegular(Math.max(0, quantityRegular - 1));
                  }
                }}
                disabled={quantityRegular === 0 || isRegularDisabled}
                tabIndex={-1}
                disableFocusRipple
                $error={regularHasError}
              >
                <RemoveIcon />
              </QuantityLeftButton>
              <QuantityInput
                type="number"
                value={quantityRegular}
                onChange={(e) => setQuantityRegular(Math.max(0, parseInt(e.target.value) || 0))}
                inputProps={{ min: 0 }}
                autoFocus={canBeNonFoil}
                onFocus={(e) => e.target.select()}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSave();
                  }
                }}
                onClick={(e) => {
                  if (isRegularDisabled) {
                    e.preventDefault();
                    handleDisabledFieldClick('regular');
                  }
                }}
                variant="outlined"
                size="small"
                disabled={isRegularDisabled}
                error={regularHasError}
              />
              <QuantityRightButton
                size="small"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.currentTarget.blur();
                  if (isRegularDisabled) {
                    handleDisabledFieldClick('regular');
                  } else {
                    setQuantityRegular(quantityRegular + 1);
                  }
                }}
                tabIndex={-1}
                disableFocusRipple
                disabled={isRegularDisabled}
                $error={regularHasError}
                sx={{
                  cursor: isRegularDisabled ? 'pointer' : undefined,
                }}
              >
                <AddIcon />
              </QuantityRightButton>
            </QuantityContainer>
          </Tooltip>
        </Box>
      </Grid>
      <Grid item xs={6}>
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, textAlign: 'center' }}>
            {getQuantityLabel('Foils', currentQuantities.foil, quantityFoil)}
          </Typography>
          <Tooltip
            title={getTooltipMessage('foil', foilHasError, isFoilDisabled)}
            placement="top"
            disableHoverListener={!getTooltipMessage('foil', foilHasError, isFoilDisabled)}
            disableFocusListener={!getTooltipMessage('foil', foilHasError, isFoilDisabled)}
            disableTouchListener={!getTooltipMessage('foil', foilHasError, isFoilDisabled)}
          >
            <QuantityContainer
              onClick={(e) => {
                if (isFoilDisabled) {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDisabledFieldClick('foil');
                }
              }}
              sx={{
                cursor: isFoilDisabled ? 'pointer' : undefined,
              }}
            >
              <QuantityLeftButton
                size="small"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.currentTarget.blur();
                  if (isFoilDisabled) {
                    handleDisabledFieldClick('foil');
                  } else {
                    setQuantityFoil(Math.max(0, quantityFoil - 1));
                  }
                }}
                disabled={quantityFoil === 0 || isFoilDisabled}
                tabIndex={-1}
                disableFocusRipple
                $error={foilHasError}
              >
                <RemoveIcon />
              </QuantityLeftButton>
              <QuantityInput
                type="number"
                value={quantityFoil}
                onChange={(e) => setQuantityFoil(Math.max(0, parseInt(e.target.value) || 0))}
                inputProps={{ min: 0 }}
                autoFocus={!canBeNonFoil && canBeFoil}
                onFocus={(e) => e.target.select()}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSave();
                  }
                }}
                onClick={(e) => {
                  if (isFoilDisabled) {
                    e.preventDefault();
                    handleDisabledFieldClick('foil');
                  }
                }}
                variant="outlined"
                size="small"
                disabled={isFoilDisabled}
                error={foilHasError}
              />
              <QuantityRightButton
                size="small"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.currentTarget.blur();
                  if (isFoilDisabled) {
                    handleDisabledFieldClick('foil');
                  } else {
                    setQuantityFoil(quantityFoil + 1);
                  }
                }}
                tabIndex={-1}
                disableFocusRipple
                disabled={isFoilDisabled}
                $error={foilHasError}
                sx={{
                  cursor: isFoilDisabled ? 'pointer' : undefined,
                }}
              >
                <AddIcon />
              </QuantityRightButton>
            </QuantityContainer>
          </Tooltip>
        </Box>
      </Grid>
      {showLocationPicker && (
        <Grid item xs={12}>
          <FormControl fullWidth size="small">
            <InputLabel id="location-selector-label">Assign to Location (optional)</InputLabel>
            <Select
              labelId="location-selector-label"
              value={selectedLocation || ''}
              onChange={(e) => setSelectedLocation(e.target.value === '' ? null : Number(e.target.value))}
              label="Assign to Location (optional)"
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {renderLocationOptions(locations)}
            </Select>
          </FormControl>
        </Grid>
      )}
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

      <Dialog
        open={showOverrideDialog}
        onClose={handleOverrideCancel}
        aria-labelledby="override-dialog-title"
        aria-describedby="override-dialog-description"
      >
        <DialogTitle id="override-dialog-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningAmberIcon color="warning" />
          Enable {overrideDialogType === 'regular' ? 'Non-Foil' : 'Foil'} Quantity?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="override-dialog-description" component="div">
            <Typography variant="body2" gutterBottom>
              According to our data, this card doesn&apos;t come in{' '}
              {overrideDialogType === 'regular' ? 'non-foil' : 'foil'} finish.
            </Typography>
            <Typography variant="body2" gutterBottom>
              However, this data can sometimes be incorrect or incomplete. If you have this card in{' '}
              {overrideDialogType === 'regular' ? 'non-foil' : 'foil'} finish, you can override this restriction.
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500, mt: 2 }}>
              Would you like to enable this field anyway?
            </Typography>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleOverrideCancel} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleOverrideConfirm} variant="contained" color="primary" autoFocus>
            Enable Field
          </Button>
        </DialogActions>
      </Dialog>
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
  marginTop: theme.spacing(2),
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
    '&.Mui-disabled fieldset': {
      borderColor: theme.palette.divider,
    },
    '&.Mui-error fieldset': {
      borderColor: theme.palette.error.main,
    },
    '&.Mui-error:hover fieldset': {
      borderColor: theme.palette.error.main,
    },
    '&.Mui-error.Mui-focused fieldset': {
      borderColor: theme.palette.error.main,
    },
    '&.Mui-error.Mui-disabled fieldset': {
      borderColor: theme.palette.error.main,
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

const QuantityButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== '$error',
})<{ $error?: boolean }>(({ theme, $error }) => ({
  padding: '8px',
  height: '40px',
  width: '40px',
  borderRadius: 0,
  border: `1px solid ${$error ? theme.palette.error.main : theme.palette.divider}`,
  transition: 'all 0.2s',
  backgroundColor: theme.palette.background.paper,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    borderColor: $error ? theme.palette.error.main : theme.palette.divider,
  },
  '&.Mui-disabled': {
    borderColor: $error ? theme.palette.error.main : theme.palette.divider,
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
