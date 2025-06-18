import { InfoOutlined as InfoOutlinedIcon, Search as SearchIcon } from '@mui/icons-material';
import {
  Box,
  Chip,
  FormControlLabel,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CardApiParams } from '@/api/browse/types';
import { useGetCardTypesQuery } from '@/api/cards/cardsApi';
import CardSelector, { CardFilter } from '@/components/goals/CardSelector';
import OutlinedBox from '@/components/ui/OutlinedBox';
import AutocompleteWithNegation from '@/components/ui/AutocompleteWithNegation';
import { ColorMatchType, MTG_COLORS } from '@/types/browse';

interface GoalSearchFormProps {
  searchConditions: Omit<CardApiParams, 'limit' | 'offset' | 'sortBy' | 'sortDirection'>;
  onChange: (conditions: Omit<CardApiParams, 'limit' | 'offset' | 'sortBy' | 'sortDirection'>) => void;
}

interface SimpleOption {
  value: string;
  label: string;
}

interface AutocompleteOption {
  category: string;
  label: string;
  value: string;
  exclude: boolean;
}

interface ColorState {
  colors: string[];
  matchType: ColorMatchType;
  includeColorless: boolean;
}

interface StatCondition {
  attribute: string;
  operator: string;
  value: string;
}

const RARITY_OPTIONS: SimpleOption[] = [
  { value: '1', label: 'Common' },
  { value: '2', label: 'Uncommon' },
  { value: '3', label: 'Rare' },
  { value: '4', label: 'Mythic' },
  { value: '5', label: 'Special' },
];

const STAT_ATTRIBUTES = [
  { value: 'convertedManaCost', label: 'Mana Value' },
  { value: 'powerNumeric', label: 'Power' },
  { value: 'toughnessNumeric', label: 'Toughness' },
  { value: 'loyaltyNumeric', label: 'Loyalty' },
  { value: 'market', label: 'Market Price' },
  { value: 'low', label: 'Low Price' },
  { value: 'average', label: 'Average Price' },
  { value: 'high', label: 'High Price' },
  { value: 'foil', label: 'Foil Price' },
];

const STAT_OPERATORS = [
  { value: '>=', label: '>=' },
  { value: '>', label: '>' },
  { value: '=', label: '=' },
  { value: '<=', label: '<=' },
  { value: '<', label: '<' },
  { value: '!=', label: '!=' },
];

export function GoalSearchForm({ searchConditions, onChange }: GoalSearchFormProps) {
  
  // Initialize state from searchConditions
  const [isInitialized, setIsInitialized] = useState(false);

  // Local states for all search fields
  const [name, setName] = useState(searchConditions.name || '');
  const [oracleText, setOracleText] = useState(searchConditions.oracleText || '');
  const [artist, setArtist] = useState(searchConditions.artist || '');
  const [oneResultPerCardName, setOneResultPerCardName] = useState(searchConditions.oneResultPerCardName ?? true);

  // Color state
  const [colorState, setColorState] = useState<ColorState>(() => {
    if (searchConditions.colors_array?.exactly?.length === 0) {
      return { colors: [], matchType: 'exactly', includeColorless: true };
    } else if (searchConditions.colors_array?.exactly) {
      return { colors: searchConditions.colors_array.exactly, matchType: 'exactly', includeColorless: false };
    } else if (searchConditions.colors_array?.atLeast) {
      return { colors: searchConditions.colors_array.atLeast, matchType: 'atLeast', includeColorless: false };
    } else if (searchConditions.colors_array?.atMost) {
      return { colors: searchConditions.colors_array.atMost, matchType: 'atMost', includeColorless: false };
    }
    return { colors: [], matchType: 'exactly', includeColorless: false };
  });

  // Type state - using AutocompleteOption for AutocompleteWithNegation
  const [typeOptions, setTypeOptions] = useState<AutocompleteOption[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<AutocompleteOption[]>([]);

  // Rarity state
  const [selectedRarities, setSelectedRarities] = useState<AutocompleteOption[]>([]);

  // Set state
  const [setOptions, setSetOptions] = useState<AutocompleteOption[]>([]);
  const [selectedSets, setSelectedSets] = useState<AutocompleteOption[]>([]);

  // Stat conditions
  const [statConditions, setStatConditions] = useState<StatCondition[]>([]);

  // Card filter state
  const [cardFilter, setCardFilter] = useState<CardFilter>({ include: [], exclude: [] });

  // Fetch data for dropdowns
  const { data: cardTypesData } = useGetCardTypesQuery();

  // Helper to convert simple options to autocomplete options
  const toAutocompleteOptions = (
    options: SimpleOption[],
    category: string,
    excludeList: string[] = [],
  ): AutocompleteOption[] => {
    return options.map((opt) => ({
      category,
      label: opt.label,
      value: opt.value,
      exclude: excludeList.includes(opt.value),
    }));
  };

  // Fetch sets data
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_MTGCB_API_BASE_URL}/sets/all`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data && data.data.sets) {
          // Sort sets by releasedAt in descending order (newest first)
          const sortedSets = [...data.data.sets].sort((a: any, b: any) => {
            return new Date(b.releasedAt).getTime() - new Date(a.releasedAt).getTime();
          });
          const options = sortedSets.map((set: any) => ({
            category: 'Sets',
            label: `${set.name} (${set.code})`,
            value: set.id.toString(),
            exclude: false,
          }));
          setSetOptions(options);
        }
      })
      .catch((error) => {
        console.error('Error fetching sets:', error);
      });
  }, []);

  // Initialize selected types when typeOptions are loaded
  useEffect(() => {
    if (!isInitialized && searchConditions.type && typeOptions.length > 0) {
      const selected: AutocompleteOption[] = [];

      searchConditions.type.AND?.forEach((type: string) => {
        const option = typeOptions.find((opt) => opt.value === type);
        if (option) {
          selected.push({ ...option, exclude: false });
        }
      });

      searchConditions.type.NOT?.forEach((type: string) => {
        const option = typeOptions.find((opt) => opt.value === type);
        if (option) {
          selected.push({ ...option, exclude: true });
        }
      });

      setSelectedTypes(selected);
    }
  }, [isInitialized, searchConditions.type, typeOptions]);

  // Parse initial rarity conditions (only once)
  useEffect(() => {
    if (!isInitialized && searchConditions.rarityNumeric) {
      const selected: AutocompleteOption[] = [];
      const rarityAutocompleteOptions = toAutocompleteOptions(RARITY_OPTIONS, 'Rarities');

      searchConditions.rarityNumeric.OR?.forEach((r: string) => {
        if (r.startsWith('=')) {
          const value = r.substring(1);
          const option = rarityAutocompleteOptions.find((opt) => opt.value === value);
          if (option) {
            selected.push({ ...option, exclude: false });
          }
        }
      });

      searchConditions.rarityNumeric.AND?.forEach((r: string) => {
        if (r.startsWith('!=')) {
          const value = r.substring(2);
          const option = rarityAutocompleteOptions.find((opt) => opt.value === value);
          if (option) {
            selected.push({ ...option, exclude: true });
          }
        }
      });

      setSelectedRarities(selected);
    }
  }, [isInitialized, searchConditions.rarityNumeric]);

  // Parse initial set conditions (only once when sets are loaded)
  useEffect(() => {
    if (!isInitialized && searchConditions.setId && setOptions.length > 0) {
      const selected: AutocompleteOption[] = [];

      searchConditions.setId.OR?.forEach((id: string) => {
        const option = setOptions.find((opt) => opt.value === id);
        if (option) {
          selected.push({ ...option, exclude: false });
        }
      });

      searchConditions.setId.AND?.forEach((id: string) => {
        if (id.startsWith('!=')) {
          const value = id.substring(2);
          const option = setOptions.find((opt) => opt.value === value);
          if (option) {
            selected.push({ ...option, exclude: true });
          }
        }
      });

      setSelectedSets(selected);
    }
  }, [isInitialized, searchConditions.setId, setOptions]);

  // Parse initial stat conditions (only once)
  useEffect(() => {
    if (!isInitialized) {
      const conditions: StatCondition[] = [];
      Object.entries(searchConditions).forEach(([key, value]) => {
        const statAttr = STAT_ATTRIBUTES.find((attr) => attr.value === key);
        if (statAttr && value && typeof value === 'object' && 'AND' in value) {
          value.AND?.forEach((condition: string) => {
            const operatorMatch = condition.match(/^(>=|>|=|<=|<|!=)(.+)$/);
            if (operatorMatch) {
              conditions.push({
                attribute: key,
                operator: operatorMatch[1],
                value: operatorMatch[2],
              });
            }
          });
        }
      });
      setStatConditions(conditions);
    }
  }, [isInitialized, searchConditions]);

  // Parse initial card ID conditions (only once)
  useEffect(() => {
    if (!isInitialized && searchConditions.id) {
      const include: string[] = [];
      const exclude: string[] = [];

      searchConditions.id.OR?.forEach((id: string) => {
        include.push(id);
      });

      searchConditions.id.AND?.forEach((id: string) => {
        if (id.startsWith('!=')) {
          exclude.push(id.substring(2));
        }
      });

      setCardFilter({ include, exclude });
    }
  }, [isInitialized, searchConditions.id]);

  // Build conditions object
  const buildConditions = useCallback(() => {
    const conditions: any = {};

    // Basic fields
    if (name) conditions.name = name;
    if (oracleText) conditions.oracleText = oracleText;
    if (artist) conditions.artist = artist;
    if (oneResultPerCardName) conditions.oneResultPerCardName = oneResultPerCardName;

    // Colors
    if (colorState.includeColorless) {
      conditions.colors_array = { exactly: [] };
    } else if (colorState.colors.length > 0) {
      conditions.colors_array = {
        [colorState.matchType]: colorState.colors,
      };
    }

    // Types
    const typeInclude = selectedTypes.filter((t) => !t.exclude);
    const typeExclude = selectedTypes.filter((t) => t.exclude);
    if (typeInclude.length > 0 || typeExclude.length > 0) {
      conditions.type = {};
      if (typeInclude.length > 0) {
        conditions.type.AND = typeInclude.map((t) => t.value);
      }
      if (typeExclude.length > 0) {
        conditions.type.NOT = typeExclude.map((t) => t.value);
      }
    }

    // Rarities
    const rarityInclude = selectedRarities.filter((r) => !r.exclude);
    const rarityExclude = selectedRarities.filter((r) => r.exclude);
    if (rarityInclude.length > 0 || rarityExclude.length > 0) {
      conditions.rarityNumeric = {};
      if (rarityInclude.length > 0) {
        conditions.rarityNumeric.OR = rarityInclude.map((r) => `=${r.value}`);
      }
      if (rarityExclude.length > 0) {
        conditions.rarityNumeric.AND = rarityExclude.map((r) => `!=${r.value}`);
      }
    }

    // Sets
    const setInclude = selectedSets.filter((s) => !s.exclude);
    const setExclude = selectedSets.filter((s) => s.exclude);
    if (setInclude.length > 0 || setExclude.length > 0) {
      conditions.setId = {};
      if (setInclude.length > 0) {
        conditions.setId.OR = setInclude.map((s) => s.value);
      }
      if (setExclude.length > 0) {
        conditions.setId.AND = setExclude.map((s) => `!=${s.value}`);
      }
    }

    // Stats
    const statsByAttribute: Record<string, string[]> = {};
    statConditions.forEach((stat) => {
      if (stat.value) {
        // Only include if value is not empty
        if (!statsByAttribute[stat.attribute]) {
          statsByAttribute[stat.attribute] = [];
        }
        statsByAttribute[stat.attribute].push(`${stat.operator}${stat.value}`);
      }
    });

    Object.entries(statsByAttribute).forEach(([attribute, conditionValues]) => {
      conditions[attribute] = { AND: conditionValues };
    });

    // Card IDs
    if (cardFilter.include.length > 0 || cardFilter.exclude.length > 0) {
      conditions.id = {};
      if (cardFilter.include.length > 0) {
        conditions.id.OR = cardFilter.include;
      }
      if (cardFilter.exclude.length > 0) {
        conditions.id.AND = cardFilter.exclude.map((id) => `!=${id}`);
      }
    }

    return conditions;
  }, [
    name,
    oracleText,
    artist,
    oneResultPerCardName,
    colorState,
    selectedTypes,
    selectedRarities,
    selectedSets,
    statConditions,
    cardFilter,
  ]);

  // Update oneResultPerCardName when searchConditions changes
  useEffect(() => {
    if (searchConditions.oneResultPerCardName !== undefined) {
      setOneResultPerCardName(searchConditions.oneResultPerCardName);
    }
  }, [searchConditions.oneResultPerCardName]);

  // Mark as initialized once all data is loaded
  useEffect(() => {
    if (typeOptions.length > 0 && setOptions.length > 0 && !isInitialized) {
      setIsInitialized(true);
    }
  }, [typeOptions.length, setOptions.length, isInitialized]);

  // Update parent whenever conditions change (but skip during initialization)
  useEffect(() => {
    if (isInitialized) {
      const conditions = buildConditions();
      onChange(conditions);
    }
  }, [isInitialized, buildConditions, onChange]); // Include onChange in dependencies

  // Build type options from API data
  useEffect(() => {
    if (cardTypesData) {
      // Combine all type arrays
      const allTypes = [
        ...(cardTypesData.cardTypes || []),
        ...(cardTypesData.superTypes || []),
        ...(cardTypesData.artifactTypes || []),
        ...(cardTypesData.enchantmentTypes || []),
        ...(cardTypesData.landTypes || []),
        ...(cardTypesData.planeswalkerTypes || []),
        ...(cardTypesData.spellTypes || []),
        ...(cardTypesData.creatureTypes || []),
        ...(cardTypesData.planarTypes || []),
      ];
      // Remove duplicates and create options
      const uniqueTypes = [...new Set(allTypes)];
      const options = uniqueTypes.map((type) => ({
        category: 'Types',
        label: type,
        value: `"${type}"`,
        exclude: false,
      }));
      setTypeOptions(options);
    }
  }, [cardTypesData]);

  const handleColorToggle = (color: string) => {
    if (color === 'C') {
      setColorState((prev) => ({
        ...prev,
        includeColorless: !prev.includeColorless,
        colors: !prev.includeColorless ? [] : prev.colors,
      }));
    } else {
      setColorState((prev) => ({
        ...prev,
        colors: prev.colors.includes(color) ? prev.colors.filter((c) => c !== color) : [...prev.colors, color],
        includeColorless: false,
      }));
    }
  };

  const handleAddStatCondition = () => {
    setStatConditions([...statConditions, { attribute: 'convertedManaCost', operator: '=', value: '' }]);
  };

  const handleRemoveStatCondition = (index: number) => {
    setStatConditions(statConditions.filter((_, i) => i !== index));
  };

  const handleStatConditionChange = (index: number, field: keyof StatCondition, value: string) => {
    const updated = [...statConditions];
    updated[index] = { ...updated[index], [field]: value };
    setStatConditions(updated);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Basic Fields */}
      <TextField
        fullWidth
        label="Card Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Search by card name"
        margin="dense"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="disabled" />
            </InputAdornment>
          ),
        }}
      />

      <TextField
        fullWidth
        label="Oracle Text"
        value={oracleText}
        onChange={(e) => setOracleText(e.target.value)}
        placeholder="Search card text"
        margin="dense"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Tooltip title="Search for text that appears in the card's rules box" placement="right">
                <InfoOutlinedIcon color="disabled" sx={{ cursor: 'help' }} />
              </Tooltip>
            </InputAdornment>
          ),
        }}
      />

      <TextField
        fullWidth
        label="Artist"
        value={artist}
        onChange={(e) => setArtist(e.target.value)}
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

      {/* Color Selector */}
      <OutlinedBox label="Colors">
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: '6px', pb: 1 }}>
          {MTG_COLORS.map((color) => (
            <IconButton
              key={color}
              size="small"
              onClick={() => handleColorToggle(color)}
              disabled={colorState.includeColorless}
              sx={{
                padding: 0,
                borderRadius: '50%',
                opacity: colorState.colors.includes(color) ? 1 : 0.3,
                '&:hover': {
                  borderRadius: '50%',
                  opacity: colorState.colors.includes(color) ? 1 : 0.5,
                  margin: 0,
                },
                '&.Mui-disabled': {
                  opacity: 0.2,
                },
                '& .ms': {
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                },
              }}
            >
              <i className={`ms ms-${color.toLowerCase()} ms-cost ms-2x`} />
            </IconButton>
          ))}
          <IconButton
            size="small"
            onClick={() => handleColorToggle('C')}
            sx={{
              padding: 0,
              borderRadius: '50%',
              opacity: colorState.includeColorless ? 1 : 0.3,
              '&:hover': {
                borderRadius: '50%',
                opacity: colorState.includeColorless ? 1 : 0.5,
                margin: 0,
              },
              '& .ms': {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              },
            }}
          >
            <i className="ms ms-c ms-cost ms-2x" />
          </IconButton>
        </Box>

        <Box sx={{ pt: 1 }}>
          <Select
            fullWidth
            size="small"
            value={colorState.matchType}
            onChange={(e) => setColorState({ ...colorState, matchType: e.target.value as ColorMatchType })}
            sx={{
              '& .MuiSelect-select': {
                py: 1,
              },
            }}
          >
            <MenuItem value="exactly">Only These Colors</MenuItem>
            <MenuItem value="atLeast">At Least These Colors</MenuItem>
            <MenuItem value="atMost">At Most These Colors</MenuItem>
          </Select>
        </Box>
      </OutlinedBox>

      {/* Type Selector */}
      <AutocompleteWithNegation
        label="Card Types"
        options={typeOptions}
        selectedOptions={selectedTypes}
        setSelectedOptionsRemotely={setSelectedTypes}
      />

      {/* Rarity Selector */}
      <AutocompleteWithNegation
        label="Rarities"
        options={toAutocompleteOptions(RARITY_OPTIONS, 'Rarities')}
        selectedOptions={selectedRarities}
        setSelectedOptionsRemotely={setSelectedRarities}
      />

      {/* Set Selector */}
      <AutocompleteWithNegation
        label="Sets"
        options={setOptions}
        selectedOptions={selectedSets}
        setSelectedOptionsRemotely={setSelectedSets}
      />

      {/* Card Selector */}
      <CardSelector
        value={cardFilter}
        onChange={setCardFilter}
        label="Specific Cards (to include or exclude)"
        placeholder="Search for cards to include or exclude"
      />

      {/* Printing Options */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle2">Card Printings</Typography>
          <Tooltip
            title={
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  This setting controls how multiple printings of the same card are counted.
                </Typography>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Example: Giant Spider
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Giant Spider has been printed in over 20 different sets (Alpha, Beta, 4th Edition, etc.).
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  • <strong>One printing:</strong> Having any version of Giant Spider counts as 1 towards your goal --
                  you only need one copy of any Giant Spider.
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  • <strong>Every printing:</strong> Each different set's Giant Spider counts separately -- you'll need
                  a copy of each printing of Giant Spider.
                </Typography>
                <Typography variant="body2">
                  <em>(Note: Specific cards you include or exclude will always override this setting.)</em>
                </Typography>
              </Box>
            }
            placement="left"
            arrow
          >
            <IconButton size="small" sx={{ padding: 0.5 }}>
              <InfoOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <ToggleButtonGroup
          value={oneResultPerCardName ? 'one' : 'every'}
          exclusive
          onChange={(_, value) => {
            if (value !== null) {
              setOneResultPerCardName(value === 'one');
            }
          }}
          fullWidth
          size="small"
        >
          <ToggleButton value="one">One printing of each unique card</ToggleButton>
          <ToggleButton value="every">Every printing of each unique card</ToggleButton>
        </ToggleButtonGroup>
      </Paper>

      {/* Stat Conditions */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle2">Stat Filters</Typography>
          <Chip label="Add Filter" size="small" onClick={handleAddStatCondition} color="primary" />
        </Box>

        {statConditions.map((condition, index) => (
          <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
            <TextField
              select
              size="small"
              value={condition.attribute}
              onChange={(e) => handleStatConditionChange(index, 'attribute', e.target.value)}
              sx={{ minWidth: 150 }}
            >
              {STAT_ATTRIBUTES.map((attr) => (
                <MenuItem key={attr.value} value={attr.value}>
                  {attr.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              value={condition.operator}
              onChange={(e) => handleStatConditionChange(index, 'operator', e.target.value)}
              sx={{ minWidth: 70 }}
            >
              {STAT_OPERATORS.map((op) => (
                <MenuItem key={op.value} value={op.value}>
                  {op.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              size="small"
              value={condition.value}
              onChange={(e) => handleStatConditionChange(index, 'value', e.target.value)}
              placeholder="Value"
              sx={{ flex: 1 }}
            />

            <Chip label="Remove" size="small" onDelete={() => handleRemoveStatCondition(index)} color="error" />
          </Box>
        ))}

        {statConditions.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No stat filters applied
          </Typography>
        )}
      </Paper>
    </Box>
  );
}
