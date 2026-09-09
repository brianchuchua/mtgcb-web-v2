'use client';

import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import RemoveIcon from '@mui/icons-material/Remove';
import {
  Alert,
  Autocomplete,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  Link,
  Popover,
  Stack,
  TextField,
  Tooltip,
  Typography,
  debounce,
  styled,
} from '@mui/material';
import NextLink from 'next/link';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLazyGetCardsQuery } from '@/api/browse/browseApi';
import { CardModel } from '@/api/browse/types';
import { useLazyGetCardsByIdsQuery } from '@/api/cards/cardsApi';
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

const CARD_LOOKUP_BATCH_SIZE = 500;

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
  const [infoAnchorEl, setInfoAnchorEl] = useState<HTMLElement | null>(null);
  const [cardInfoCache, setCardInfoCache] = useState<Map<string, CardModel>>(new Map());
  const [unresolvedCardIds, setUnresolvedCardIds] = useState<Set<string>>(new Set());
  const requestedCardIdsRef = useRef<Set<string>>(new Set());
  const { user } = useAuth();
  const priceType = usePriceType();
  const [triggerGetCards, { data: searchResponse, isFetching: isSearching }] = useLazyGetCardsQuery();
  const [lookupCardsByIds] = useLazyGetCardsByIdsQuery();

  const debouncedSetSearchInput = useMemo(() => debounce((value: string) => setSearchInput(value), 300), []);

  const handleSearchInputChange = (_event: any, value: string, reason: string) => {
    setInputValue(value);
    if (reason === 'input' && value.length >= 2) {
      debouncedSetSearchInput(value);
    }
  };

  useEffect(() => {
    if (searchInput.length >= 2) {
      triggerGetCards({
        name: searchInput,
        limit: 200,
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
      // Add the card to cache immediately when selected
      requestedCardIdsRef.current.add(option.id);
      setCardInfoCache((prev) => {
        const newCache = new Map(prev);
        newCache.set(option.id, option.card);
        return newCache;
      });

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

  // Saved ids may point at printings that were deprecated after the goal was created, and
  // the search endpoint hides those. The by-ids lookup returns them with `deprecated` set
  // so the chips can name them and the notice below can explain what to do.
  useEffect(() => {
    const missingIds = Array.from(allSelectedCards.keys()).filter((id) => !requestedCardIdsRef.current.has(id));
    if (missingIds.length === 0) return;
    missingIds.forEach((id) => requestedCardIdsRef.current.add(id));

    const hydrateCardInfo = async () => {
      const foundCards = new Map<string, CardModel>();
      const numericIds = missingIds.map(Number).filter((id) => Number.isInteger(id) && id > 0);

      for (let start = 0; start < numericIds.length; start += CARD_LOOKUP_BATCH_SIZE) {
        const batch = numericIds.slice(start, start + CARD_LOOKUP_BATCH_SIZE);
        try {
          const cards = await lookupCardsByIds({ ids: batch }).unwrap();
          cards.forEach((card) => foundCards.set(card.id.toString(), card));
        } catch (error) {
          console.error('Error fetching card info:', error);
        }
      }

      setCardInfoCache((prev) => {
        const next = new Map(prev);
        foundCards.forEach((card, id) => next.set(id, card));
        return next;
      });
      setUnresolvedCardIds((prev) => {
        const next = new Set(prev);
        missingIds.forEach((id) => {
          if (!foundCards.has(id)) next.add(id);
        });
        return next;
      });
    };

    hydrateCardInfo();
  }, [allSelectedCards, lookupCardsByIds]);

  const deprecatedSelectedCount = Array.from(allSelectedCards.keys()).filter(
    (id) => cardInfoCache.get(id)?.deprecated === true,
  ).length;

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
                  <IconButton
                    size="small"
                    onClick={(e) => setInfoAnchorEl(e.currentTarget)}
                    sx={{
                      padding: 0,
                      ml: '5px',
                      color: 'action.disabled',
                      '&:hover': {
                        backgroundColor: 'transparent',
                        color: 'primary.main',
                      },
                    }}
                  >
                    <InfoOutlinedIcon />
                  </IconButton>
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
                      {' '}
                      ({option.card.flavorName})
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
            const isUnresolved = !cardInfo && unresolvedCardIds.has(cardId);
            const isDeprecated = cardInfo?.deprecated === true;
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
                        {cardInfo ? cardInfo.name : isUnresolved ? `Card #${cardId}` : 'Loading...'}
                        {cardInfo?.flavorName && ` (${cardInfo.flavorName})`}
                      </Typography>
                      {cardInfo && (
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                          [{cardInfo.setName}]
                        </Typography>
                      )}
                      {isUnresolved && (
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                          [not found]
                        </Typography>
                      )}
                      {isDeprecated && (
                        <Typography
                          variant="caption"
                          sx={{ fontWeight: 700, color: isExclude ? 'inherit' : 'warning.main' }}
                        >
                          [replaced]
                        </Typography>
                      )}
                    </Box>
                  }
                  data-testid={`card-selector-chip-${cardId}`}
                  data-deprecated={isDeprecated ? 'true' : undefined}
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
                    ...(isDeprecated &&
                      !isExclude && {
                        borderColor: 'warning.main',
                        borderStyle: 'dashed',
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

      {deprecatedSelectedCount > 0 && (
        <Alert severity="warning" sx={{ mt: 1.5 }} data-testid="card-selector-deprecated-notice">
          <Typography variant="body2" component="div">
            {deprecatedSelectedCount === 1
              ? '1 of these cards has been replaced by an updated entry and no longer counts toward goals. Remove it here, and if you own copies, move them to the updated printing on the '
              : `${deprecatedSelectedCount} of these cards have been replaced by updated entries and no longer count toward goals. Remove them here, and if you own copies, move them to their updated printings on the `}
            {user?.userId ? (
              <Link component={NextLink} href={`/collections/${user.userId}/migrate`}>
                Update Cards
              </Link>
            ) : (
              'Update Cards'
            )}
            {' page.'}
          </Typography>
        </Alert>
      )}

      <Popover
        open={Boolean(infoAnchorEl)}
        anchorEl={infoAnchorEl}
        onClose={() => setInfoAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <Box sx={{ p: 2, maxWidth: 300 }}>
          <Typography variant="body2" component="div">
            After adding cards, tap on them to toggle between including or excluding them from your goal
          </Typography>
        </Box>
      </Popover>
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
