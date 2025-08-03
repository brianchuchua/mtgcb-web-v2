'use client';

import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import RemoveIcon from '@mui/icons-material/Remove';
import {
  Autocomplete,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  Typography,
  debounce,
  styled,
} from '@mui/material';
import React, { useCallback, useMemo, useState } from 'react';
import { useLazyGetCardsQuery } from '@/api/browse/browseApi';
import { CardModel } from '@/api/browse/types';
import { useAuth } from '@/hooks/useAuth';
import { usePriceType } from '@/hooks/usePriceType';
import { getCardImageUrl } from '@/utils/cards/getCardImageUrl';

interface CardSelectorProps {
  value: CardFilter;
  onChange: (value: CardFilter) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

export interface CardFilter {
  include: string[];
  exclude: string[];
}

interface CardOption {
  id: string;
  name: string;
  setName: string;
  label: string;
  card: CardModel;
}

const CardSelector: React.FC<CardSelectorProps> = ({
  value,
  onChange,
  label = 'Specific Cards (to include or exclude)',
  placeholder = 'Search for cards to include or exclude',
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedCard, setSelectedCard] = useState<CardOption | null>(null);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const { user } = useAuth();
  const priceType = usePriceType();
  const [triggerGetCards, { data: searchResponse, isFetching: isSearching }] = useLazyGetCardsQuery();

  const debouncedSetSearchInput = useMemo(() => debounce((value: string) => setSearchInput(value), 300), []);

  const handleSearchInputChange = (_event: any, value: string, reason: string) => {
    setInputValue(value);
    if (reason === 'input' && value.length >= 2) {
      debouncedSetSearchInput(value);
    }
  };

  React.useEffect(() => {
    if (searchInput.length >= 2) {
      triggerGetCards({
        name: searchInput,
        limit: 20,
        offset: 0,
        sortBy: 'releasedAt',
        sortDirection: 'desc',
        userId: user?.userId,
        priceType: priceType,
      });
    }
  }, [searchInput, user?.userId, priceType, triggerGetCards]);

  const cardOptions: CardOption[] = useMemo(() => {
    if (!searchResponse?.data?.cards) return [];
    return searchResponse.data.cards.map((card: CardModel) => ({
      id: card.id.toString(),
      name: card.name,
      setName: card.setName,
      label: `${card.name}${card.flavorName ? ` (${card.flavorName})` : ''} [${card.setName}]`,
      card,
    }));
  }, [searchResponse]);

  const allSelectedCards = useMemo(() => {
    const cardMap = new Map<string, { type: 'include' | 'exclude'; card?: CardModel }>();

    value.include.forEach((id) => {
      cardMap.set(id, { type: 'include' });
    });

    value.exclude.forEach((id) => {
      cardMap.set(id, { type: 'exclude' });
    });

    return cardMap;
  }, [value]);

  const handleCardSelect = (_event: any, option: CardOption | null) => {
    if (option && !allSelectedCards.has(option.id)) {
      onChange({
        ...value,
        include: [...value.include, option.id],
      });
      setSelectedCard(null);
      setInputValue('');
    }
  };

  const handleChipClick = (cardId: string) => {
    const currentType = allSelectedCards.get(cardId)?.type;

    if (currentType === 'include') {
      // Include -> Exclude
      onChange({
        include: value.include.filter((id) => id !== cardId),
        exclude: [...value.exclude, cardId],
      });
    } else if (currentType === 'exclude') {
      // Exclude -> Include
      onChange({
        include: [...value.include, cardId],
        exclude: value.exclude.filter((id) => id !== cardId),
      });
    }
  };

  const handleChipDelete = (cardId: string) => {
    onChange({
      include: value.include.filter((id) => id !== cardId),
      exclude: value.exclude.filter((id) => id !== cardId),
    });
  };

  const getCardInfo = useCallback(
    async (cardId: string) => {
      try {
        const response = await triggerGetCards({
          id: { OR: [cardId] },
          limit: 1,
          offset: 0,
          userId: user?.userId,
          priceType: priceType,
        }).unwrap();

        if (response?.data?.cards && response.data.cards.length > 0) {
          return response.data.cards[0];
        }
      } catch (error) {
        console.error('Error fetching card info:', error);
      }
      return null;
    },
    [triggerGetCards, user?.userId, priceType],
  );

  const [cardInfoCache, setCardInfoCache] = useState<Map<string, CardModel>>(new Map());

  React.useEffect(() => {
    const fetchMissingCardInfo = async () => {
      const missingIds = Array.from(allSelectedCards.keys()).filter((id) => !cardInfoCache.has(id));

      if (missingIds.length > 0) {
        const promises = missingIds.map(async (id) => {
          const card = await getCardInfo(id);
          if (card) {
            return { id, card };
          }
          return null;
        });

        const results = await Promise.all(promises);
        const newCache = new Map(cardInfoCache);
        results.forEach((result) => {
          if (result) {
            newCache.set(result.id, result.card);
          }
        });
        setCardInfoCache(newCache);
      }
    };

    fetchMissingCardInfo();
  }, [allSelectedCards, cardInfoCache, getCardInfo]);

  return (
    <Box>
      <Autocomplete
        options={cardOptions}
        getOptionKey={(option) => option.id}
        getOptionLabel={(option) => option.label}
        value={selectedCard}
        onChange={handleCardSelect}
        inputValue={inputValue}
        onInputChange={handleSearchInputChange}
        loading={isSearching}
        fullWidth
        disabled={disabled}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        filterOptions={(options) => options.filter((option) => !allSelectedCards.has(option.id))}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            placeholder={allSelectedCards.size === 0 ? placeholder : ''}
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <Tooltip title="After adding cards, tap on them to toggle between including or excluding them from your goal">
                    <InfoOutlinedIcon color="disabled" sx={{ cursor: 'help', ml: '5px' }} />
                  </Tooltip>
                </InputAdornment>
              ),
              endAdornment: (
                <>
                  {isSearching ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
              sx: {
                '& .MuiAutocomplete-input': {
                  paddingLeft: '1px !important',
                },
              },
            }}
          />
        )}
        noOptionsText={
          inputValue.length < 2 ? 'Start typing to search for cards' : isSearching ? 'Searching...' : 'No cards found'
        }
        renderOption={(props, option) => {
          const { key, ...otherProps } = props as any;
          return (
            <Box component="li" key={key} {...otherProps} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CardThumbnail src={getCardImageUrl(option.card.id)} alt={option.name} loading="lazy" />
              <Box>
                <Typography variant="body2">
                  {option.name}
                  {option.card.flavorName && (
                    <Typography component="span" variant="body2" color="text.secondary">
                      {' '}({option.card.flavorName})
                    </Typography>
                  )}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {option.setName}
                </Typography>
              </Box>
            </Box>
          );
        }}
      />

      {Array.from(allSelectedCards.entries()).length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
          {Array.from(allSelectedCards.entries()).map(([cardId, { type }]) => {
            const cardInfo = cardInfoCache.get(cardId);
            const isExclude = type === 'exclude';

            return (
              <Box
                key={cardId}
                position="relative"
                onMouseEnter={() => setHoveredCardId(cardId)}
                onMouseLeave={() => setHoveredCardId(null)}
              >
                <CardChip
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {isExclude && <Typography variant="inherit">NOT</Typography>}
                      <Typography variant="inherit">
                        {cardInfo ? cardInfo.name : `Card ${cardId}`}
                        {cardInfo?.flavorName && ` (${cardInfo.flavorName})`}
                      </Typography>
                      {cardInfo && (
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                          [{cardInfo.setName}]
                        </Typography>
                      )}
                    </Box>
                  }
                  onClick={() => handleChipClick(cardId)}
                  onDelete={() => handleChipDelete(cardId)}
                  deleteIcon={
                    <Tooltip title="Remove card">
                      <IconButton size="small">
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  }
                  color={isExclude ? 'error' : 'default'}
                  variant={isExclude ? 'filled' : 'outlined'}
                  sx={{
                    ...(isExclude && {
                      backgroundColor: (theme) => theme.palette.error.main,
                      color: 'white',
                      '& .MuiChip-deleteIcon': {
                        color: 'rgba(255, 255, 255, 0.7)',
                        '&:hover': {
                          color: 'white',
                        },
                      },
                    }),
                  }}
                  icon={
                    <Tooltip title={isExclude ? 'Click to include' : 'Click to exclude'}>
                      <Box component="span" sx={{ display: 'flex', cursor: 'pointer' }}>
                        {isExclude ? <RemoveIcon fontSize="small" /> : <AddIcon fontSize="small" />}
                      </Box>
                    </Tooltip>
                  }
                />

                {hoveredCardId === cardId && cardInfo && (
                  <CardPreview>
                    <img
                      src={getCardImageUrl(cardInfo.id)}
                      alt={cardInfo.name}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </CardPreview>
                )}
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

const CardThumbnail = styled('img')(({ theme }) => ({
  width: 40,
  height: 56,
  objectFit: 'cover',
  borderRadius: '4%',
  boxShadow: theme.shadows[1],
}));

const CardChip = styled(Chip)(({ theme }) => ({
  '& .MuiChip-label': {
    paddingLeft: theme.spacing(0.5),
    paddingRight: theme.spacing(1),
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  '& .MuiChip-icon': {
    marginLeft: theme.spacing(0.5),
    marginRight: 0,
  },
  maxWidth: '100%',
  [theme.breakpoints.down('sm')]: {
    maxWidth: 'calc(100vw - 80px)', // Account for padding/margins on mobile
  },
}));

const CardPreview = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: '100%',
  left: '50%',
  transform: 'translateX(-50%) translateY(-8px)',
  width: 299,
  height: 'calc(299px * 1.393)',
  zIndex: theme.zIndex.tooltip,
  backgroundColor: theme.palette.background.paper,
  borderRadius: '5%',
  boxShadow: theme.shadows[8],
  overflow: 'hidden',
  pointerEvents: 'none',
}));

export default CardSelector;
