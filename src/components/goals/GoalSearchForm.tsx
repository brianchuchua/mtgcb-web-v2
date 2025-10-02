import {
  Add as AddIcon,
  FilterList as FilterListIcon,
  InfoOutlined as InfoOutlinedIcon,
  Remove as RemoveIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
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
import { useGetSetTypesQuery } from '@/api/browse/browseApi';
import { CardApiParams } from '@/api/browse/types';
import { useGetCardTypesQuery } from '@/api/cards/cardsApi';
import { useGetAllSetsQuery } from '@/api/sets/setsApi';
import CardSelector, { CardFilter } from '@/components/goals/CardSelector';
import AutocompleteWithNegation from '@/components/ui/AutocompleteWithNegation';
import OutlinedBox from '@/components/ui/OutlinedBox';
import { ColorMatchType, MTG_COLORS } from '@/types/browse';

interface GoalSearchFormProps {
  searchConditions: Omit<CardApiParams, 'limit' | 'offset' | 'sortBy' | 'sortDirection'>;
  onChange: (conditions: Omit<CardApiParams, 'limit' | 'offset' | 'sortBy' | 'sortDirection'>) => void;
  onePrintingPerPureName: boolean;
  onOnePrintingPerPureNameChange: (value: boolean) => void;
  includeSetsOutsideGoal?: boolean;
  onIncludeSetsOutsideGoalChange?: (value: boolean) => void;
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
  { value: '2', label: 'Common' },
  { value: '3', label: 'Uncommon' },
  { value: '4', label: 'Rare' },
  { value: '5', label: 'Mythic' },
  { value: '6', label: 'Special' },
];

const SET_CATEGORY_OPTIONS: SimpleOption[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'sealed', label: 'Sealed' },
  { value: 'special', label: 'Special' },
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
  { value: '!=', label: '≠' },
];

export function GoalSearchForm({
  searchConditions,
  onChange,
  onePrintingPerPureName,
  onOnePrintingPerPureNameChange,
  includeSetsOutsideGoal,
  onIncludeSetsOutsideGoalChange,
}: GoalSearchFormProps) {
  // Initialize state from searchConditions
  const [isInitialized, setIsInitialized] = useState(false);
  const [isColorInitialized, setIsColorInitialized] = useState(false);
  const [previousSelectedSetsLength, setPreviousSelectedSetsLength] = useState(0);

  // Local states for all search fields
  const [name, setName] = useState(searchConditions.name || '');
  const [oracleText, setOracleText] = useState(searchConditions.oracleText || '');
  const [artist, setArtist] = useState(searchConditions.artist || '');

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
  const [cardTypeOptions, setCardTypeOptions] = useState<AutocompleteOption[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<AutocompleteOption[]>([]);

  // Rarity state
  const [selectedRarities, setSelectedRarities] = useState<AutocompleteOption[]>([]);

  // Set state
  const [setOptions, setSetOptions] = useState<AutocompleteOption[]>([]);
  const [selectedSets, setSelectedSets] = useState<AutocompleteOption[]>([]);

  // Set type and category state
  const [setTypeOptions, setSetTypeOptions] = useState<AutocompleteOption[]>([]);
  const [selectedSetTypes, setSelectedSetTypes] = useState<AutocompleteOption[]>([]);
  const [selectedSetCategories, setSelectedSetCategories] = useState<AutocompleteOption[]>([]);

  // Stat conditions
  const [statConditions, setStatConditions] = useState<StatCondition[]>([]);

  // Card filter state
  const [cardFilter, setCardFilter] = useState<CardFilter>({ include: [], exclude: [] });

  // Reserved list state
  const [isReserved, setIsReserved] = useState<boolean | undefined>(searchConditions.isReserved);

  // Fetch data for dropdowns
  const { data: cardTypesData } = useGetCardTypesQuery();
  const { data: setTypesData } = useGetSetTypesQuery();

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

  // Use RTK Query hook for sets data
  const { data: setsResponse } = useGetAllSetsQuery();

  // Process sets data when it arrives
  useEffect(() => {
    if (setsResponse?.data?.sets) {
      // Sort sets by releasedAt in descending order (newest first)
      const sortedSets = [...setsResponse.data.sets].sort((a: any, b: any) => {
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
  }, [setsResponse]);

  // Process set types data when it arrives
  useEffect(() => {
    if (setTypesData?.data) {
      const options = setTypesData.data.map((type) => ({
        category: 'Set Types',
        label: type.label,
        value: type.value,
        exclude: false,
      }));
      setSetTypeOptions(options);
    }
  }, [setTypesData]);

  // Initialize selected types when cardTypeOptions are loaded
  useEffect(() => {
    if (!isInitialized && searchConditions.type && cardTypeOptions.length > 0) {
      const selected: AutocompleteOption[] = [];

      searchConditions.type.AND?.forEach((type: string) => {
        const option = cardTypeOptions.find((opt) => opt.value === type);
        if (option) {
          selected.push({ ...option, exclude: false });
        }
      });

      searchConditions.type.NOT?.forEach((type: string) => {
        const option = cardTypeOptions.find((opt) => opt.value === type);
        if (option) {
          selected.push({ ...option, exclude: true });
        }
      });

      setSelectedTypes(selected);
    }
  }, [isInitialized, searchConditions.type, cardTypeOptions]);

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

  // Parse initial set type conditions (only once when set types are loaded)
  useEffect(() => {
    if (!isInitialized && searchConditions.setType && setTypeOptions.length > 0) {
      const selected: AutocompleteOption[] = [];

      // Handle string, array, or complex conditions
      if (typeof searchConditions.setType === 'string') {
        const option = setTypeOptions.find((opt) => opt.value === searchConditions.setType);
        if (option) {
          selected.push({ ...option, exclude: false });
        }
      } else if (Array.isArray(searchConditions.setType)) {
        searchConditions.setType.forEach((type: string) => {
          const option = setTypeOptions.find((opt) => opt.value === type);
          if (option) {
            selected.push({ ...option, exclude: false });
          }
        });
      } else if (searchConditions.setType?.OR) {
        searchConditions.setType.OR.forEach((type: string) => {
          const option = setTypeOptions.find((opt) => opt.value === type);
          if (option) {
            selected.push({ ...option, exclude: false });
          }
        });
      } else if (searchConditions.setType?.NOT) {
        searchConditions.setType.NOT.forEach((type: string) => {
          const option = setTypeOptions.find((opt) => opt.value === type);
          if (option) {
            selected.push({ ...option, exclude: true });
          }
        });
      }

      setSelectedSetTypes(selected);
    }
  }, [isInitialized, searchConditions.setType, setTypeOptions]);

  // Parse initial set category conditions (only once)
  useEffect(() => {
    if (!isInitialized && searchConditions.setCategory) {
      const selected: AutocompleteOption[] = [];
      const categoryAutocompleteOptions = toAutocompleteOptions(SET_CATEGORY_OPTIONS, 'Set Categories');

      // Handle string, array, or complex conditions
      if (typeof searchConditions.setCategory === 'string') {
        const option = categoryAutocompleteOptions.find((opt) => opt.value === searchConditions.setCategory);
        if (option) {
          selected.push({ ...option, exclude: false });
        }
      } else if (Array.isArray(searchConditions.setCategory)) {
        searchConditions.setCategory.forEach((category: string) => {
          const option = categoryAutocompleteOptions.find((opt) => opt.value === category);
          if (option) {
            selected.push({ ...option, exclude: false });
          }
        });
      } else if (searchConditions.setCategory?.OR) {
        searchConditions.setCategory.OR.forEach((category: string) => {
          const option = categoryAutocompleteOptions.find((opt) => opt.value === category);
          if (option) {
            selected.push({ ...option, exclude: false });
          }
        });
      } else if (searchConditions.setCategory?.NOT) {
        searchConditions.setCategory.NOT.forEach((category: string) => {
          const option = categoryAutocompleteOptions.find((opt) => opt.value === category);
          if (option) {
            selected.push({ ...option, exclude: true });
          }
        });
      }

      setSelectedSetCategories(selected);
    }
  }, [isInitialized, searchConditions.setCategory]);

  // Update isReserved when searchConditions changes
  useEffect(() => {
    setIsReserved(searchConditions.isReserved);
  }, [searchConditions.isReserved]);

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

    // Set Types
    const setTypeInclude = selectedSetTypes.filter((t) => !t.exclude);
    const setTypeExclude = selectedSetTypes.filter((t) => t.exclude);
    if (setTypeInclude.length > 0 || setTypeExclude.length > 0) {
      if (setTypeInclude.length > 0 && setTypeExclude.length === 0) {
        // Simple case: only includes
        if (setTypeInclude.length === 1) {
          conditions.setType = setTypeInclude[0].value;
        } else {
          conditions.setType = { OR: setTypeInclude.map((t) => t.value) };
        }
      } else if (setTypeExclude.length > 0 && setTypeInclude.length === 0) {
        // Only excludes
        conditions.setType = { NOT: setTypeExclude.map((t) => t.value) };
      } else {
        // Both includes and excludes
        conditions.setType = {};
        if (setTypeInclude.length > 0) {
          conditions.setType.OR = setTypeInclude.map((t) => t.value);
        }
        if (setTypeExclude.length > 0) {
          conditions.setType.NOT = setTypeExclude.map((t) => t.value);
        }
      }
    }

    // Set Categories
    const setCategoryInclude = selectedSetCategories.filter((c) => !c.exclude);
    const setCategoryExclude = selectedSetCategories.filter((c) => c.exclude);
    if (setCategoryInclude.length > 0 || setCategoryExclude.length > 0) {
      if (setCategoryInclude.length > 0 && setCategoryExclude.length === 0) {
        // Simple case: only includes
        if (setCategoryInclude.length === 1) {
          conditions.setCategory = setCategoryInclude[0].value;
        } else {
          conditions.setCategory = { OR: setCategoryInclude.map((c) => c.value) };
        }
      } else if (setCategoryExclude.length > 0 && setCategoryInclude.length === 0) {
        // Only excludes
        conditions.setCategory = { NOT: setCategoryExclude.map((c) => c.value) };
      } else {
        // Both includes and excludes
        conditions.setCategory = {};
        if (setCategoryInclude.length > 0) {
          conditions.setCategory.OR = setCategoryInclude.map((c) => c.value);
        }
        if (setCategoryExclude.length > 0) {
          conditions.setCategory.NOT = setCategoryExclude.map((c) => c.value);
        }
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

    // Add isReserved filter if specified
    if (isReserved !== undefined) {
      conditions.isReserved = isReserved;
    }

    return conditions;
  }, [
    name,
    oracleText,
    artist,
    colorState,
    selectedTypes,
    selectedRarities,
    selectedSets,
    selectedSetTypes,
    selectedSetCategories,
    statConditions,
    cardFilter,
    isReserved,
  ]);

  // Initialize color state when searchConditions change (only once)
  useEffect(() => {
    if (!isColorInitialized && searchConditions.colors_array) {
      if (searchConditions.colors_array?.exactly?.length === 0) {
        setColorState({ colors: [], matchType: 'exactly', includeColorless: true });
      } else if (searchConditions.colors_array?.exactly) {
        setColorState({ colors: searchConditions.colors_array.exactly, matchType: 'exactly', includeColorless: false });
      } else if (searchConditions.colors_array?.atLeast) {
        setColorState({ colors: searchConditions.colors_array.atLeast, matchType: 'atLeast', includeColorless: false });
      } else if (searchConditions.colors_array?.atMost) {
        setColorState({ colors: searchConditions.colors_array.atMost, matchType: 'atMost', includeColorless: false });
      }
      setIsColorInitialized(true);
    }
  }, [searchConditions.colors_array, isColorInitialized]);

  // Update basic text fields when searchConditions changes
  useEffect(() => {
    if (searchConditions.name !== undefined) {
      setName(searchConditions.name || '');
    }
    if (searchConditions.oracleText !== undefined) {
      setOracleText(searchConditions.oracleText || '');
    }
    if (searchConditions.artist !== undefined) {
      setArtist(searchConditions.artist || '');
    }
  }, [searchConditions.name, searchConditions.oracleText, searchConditions.artist]);

  // Mark as initialized once all data is loaded
  useEffect(() => {
    if (cardTypeOptions.length > 0 && setOptions.length > 0 && setTypeOptions.length > 0 && !isInitialized) {
      setIsInitialized(true);
    }
  }, [cardTypeOptions.length, setOptions.length, setTypeOptions.length, isInitialized]);

  // Update parent whenever conditions change (but skip during initialization)
  useEffect(() => {
    if (isInitialized) {
      const conditions = buildConditions();
      onChange(conditions);
    }
  }, [isInitialized, buildConditions, onChange]); // Include onChange in dependencies

  // Reset includeSetsOutsideGoal when sets are removed
  useEffect(() => {
    if (isInitialized && onIncludeSetsOutsideGoalChange) {
      if (selectedSets.length === 0 && previousSelectedSetsLength > 0 && includeSetsOutsideGoal) {
        // Sets were removed, reset the option
        onIncludeSetsOutsideGoalChange(false);
      }
      setPreviousSelectedSetsLength(selectedSets.length);
    }
  }, [
    selectedSets.length,
    isInitialized,
    onIncludeSetsOutsideGoalChange,
    includeSetsOutsideGoal,
    previousSelectedSetsLength,
  ]);

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
      setCardTypeOptions(options);
    }
  }, [cardTypesData]);

  const handleColorToggle = (color: string) => {
    if (color === 'C') {
      setColorState((prev) => {
        const newState = {
          ...prev,
          includeColorless: !prev.includeColorless,
          colors: !prev.includeColorless ? [] : prev.colors,
        };
        return newState;
      });
    } else {
      setColorState((prev) => {
        const newState = {
          ...prev,
          colors: prev.colors.includes(color) ? prev.colors.filter((c) => c !== color) : [...prev.colors, color],
          includeColorless: false,
        };
        return newState;
      });
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
        options={cardTypeOptions}
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

      {/* Set Category Selector */}
      <AutocompleteWithNegation
        label="Set Categories"
        options={toAutocompleteOptions(SET_CATEGORY_OPTIONS, 'Set Categories')}
        selectedOptions={selectedSetCategories}
        setSelectedOptionsRemotely={setSelectedSetCategories}
      />

      {/* Set Type Selector */}
      <AutocompleteWithNegation
        label="Set Types"
        options={setTypeOptions}
        selectedOptions={selectedSetTypes}
        setSelectedOptionsRemotely={setSelectedSetTypes}
      />

      {/* Card Selector */}
      <CardSelector
        value={cardFilter}
        onChange={setCardFilter}
        label="Specific Cards (to include or exclude)"
        placeholder="Search for cards to include or exclude"
      />

      {/* Reserved List Filter */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle2">Reserved List</Typography>
          <Tooltip
            title={
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  The Reserved List is a set of cards that will never be reprinted by Wizards of the Coast.
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  • <strong>Include all cards:</strong> No filter applied, show all cards regardless of Reserved List
                  status
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  • <strong>Reserved List only:</strong> Show only cards that are on the Reserved List
                </Typography>
                <Typography variant="body2">
                  • <strong>Exclude Reserved List:</strong> Hide all Reserved List cards from results
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
          value={isReserved === undefined ? 'all' : isReserved ? 'reserved' : 'exclude'}
          exclusive
          onChange={(_, value) => {
            if (value !== null) {
              setIsReserved(value === 'all' ? undefined : value === 'reserved' ? true : false);
            }
          }}
          fullWidth
          size="small"
        >
          <ToggleButton value="all">Include all cards</ToggleButton>
          <ToggleButton value="reserved">Reserved List only</ToggleButton>
          <ToggleButton value="exclude">Exclude Reserved List</ToggleButton>
        </ToggleButtonGroup>
      </Paper>

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
                  • <strong>Any printing:</strong> Having any version of Giant Spider counts as 1 towards your goal --
                  you only need one copy of any Giant Spider for that card to be considered collected across all sets.
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  • <strong>Every printing:</strong> Each different set's Giant Spider counts separately -- you'll need
                  a copy of each printing of Giant Spider, one for each set it was printed in.
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
          value={onePrintingPerPureName ? 'one' : 'every'}
          exclusive
          onChange={(_, value) => {
            if (value !== null) {
              const newValue = value === 'one';
              onOnePrintingPerPureNameChange(newValue);
              if (!newValue && includeSetsOutsideGoal && onIncludeSetsOutsideGoalChange) {
                onIncludeSetsOutsideGoalChange(false);
              }
            }
          }}
          fullWidth
          size="small"
        >
          <ToggleButton value="one">Any printing of each card</ToggleButton>
          <ToggleButton value="every">Every printing of each card</ToggleButton>
        </ToggleButtonGroup>

        {onePrintingPerPureName && onIncludeSetsOutsideGoalChange && selectedSets.length > 0 && (
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={includeSetsOutsideGoal || false}
                  onChange={(e) => onIncludeSetsOutsideGoalChange(e.target.checked)}
                />
              }
              label={
                <Box>
                  <Typography variant="body2">Count cards from all sets</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Count cards from any set in your collection toward this goal, not just sets that are part of the
                    goal.
                  </Typography>
                </Box>
              }
            />
          </Box>
        )}
      </Paper>

      {/* Stat Conditions */}
      {statConditions.length === 0 ? (
        <Button
          variant="outlined"
          startIcon={<FilterListIcon />}
          onClick={handleAddStatCondition}
          fullWidth
          sx={{ mt: 1 }}
        >
          Add Stat Filters
        </Button>
      ) : (
        <Stack spacing={1.5}>
          {statConditions.map((condition, index) => (
            <Box key={index} sx={{ display: 'flex', gap: '7px', width: '100%' }}>
              <Select
                size="small"
                value={condition.attribute}
                onChange={(e) => handleStatConditionChange(index, 'attribute', e.target.value)}
                sx={{ width: '45%', minWidth: '45%' }}
              >
                {STAT_ATTRIBUTES.map((attr) => (
                  <MenuItem key={attr.value} value={attr.value}>
                    {attr.label}
                  </MenuItem>
                ))}
              </Select>

              <Select
                size="small"
                value={condition.operator}
                onChange={(e) => handleStatConditionChange(index, 'operator', e.target.value)}
                sx={{ width: '25%', minWidth: '25%' }}
              >
                {STAT_OPERATORS.map((op) => (
                  <MenuItem key={op.value} value={op.value}>
                    {op.label}
                  </MenuItem>
                ))}
              </Select>

              <TextField
                size="small"
                type="number"
                inputProps={{
                  min: '0',
                  step:
                    condition.attribute.includes('Price') ||
                    condition.attribute === 'market' ||
                    condition.attribute === 'low' ||
                    condition.attribute === 'average' ||
                    condition.attribute === 'high' ||
                    condition.attribute === 'foil'
                      ? 'any'
                      : '1',
                }}
                placeholder={
                  condition.attribute.includes('Price') ||
                  condition.attribute === 'market' ||
                  condition.attribute === 'low' ||
                  condition.attribute === 'average' ||
                  condition.attribute === 'high' ||
                  condition.attribute === 'foil'
                    ? '0.00'
                    : '0'
                }
                value={condition.value}
                onChange={(e) => handleStatConditionChange(index, 'value', e.target.value)}
                sx={{ width: '25%', minWidth: '25%' }}
              />
            </Box>
          ))}

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontStyle: 'italic',
                marginRight: 'auto',
                fontSize: '0.875rem',
              }}
            >
              Add or remove stat filters:
            </Typography>
            <IconButton size="small" onClick={() => handleRemoveStatCondition(statConditions.length - 1)}>
              <RemoveIcon />
            </IconButton>
            <IconButton size="small" onClick={handleAddStatCondition}>
              <AddIcon />
            </IconButton>
          </Box>
        </Stack>
      )}
    </Box>
  );
}
