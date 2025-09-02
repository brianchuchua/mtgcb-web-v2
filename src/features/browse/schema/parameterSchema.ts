export type ParameterType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'inclusionExclusion'
  | 'colorFilter'
  | 'statFilter'
  | 'enum';

export type BrowseMode = 'cards' | 'sets' | 'both';

export interface BaseParameterConfig {
  type: ParameterType;
  mode: BrowseMode;
  urlParam?: string;
  defaultValue?: any;
  isRequired?: boolean;
}

export interface StringParameterConfig extends BaseParameterConfig {
  type: 'string';
  defaultValue?: string;
}

export interface NumberParameterConfig extends BaseParameterConfig {
  type: 'number';
  defaultValue?: number;
}

export interface BooleanParameterConfig extends BaseParameterConfig {
  type: 'boolean';
  defaultValue?: boolean;
}

export interface InclusionExclusionParameterConfig extends BaseParameterConfig {
  type: 'inclusionExclusion';
  urlParams: {
    include: string;
    exclude: string;
  };
  separator: string;
  defaultValue?: { include: string[]; exclude: string[] };
}

export interface ColorFilterParameterConfig extends BaseParameterConfig {
  type: 'colorFilter';
  urlParams: {
    colors: string;
    matchType: string;
    colorless: string;
  };
  defaultValue?: {
    colors: string[];
    matchType: 'exactly' | 'atLeast' | 'atMost';
    includeColorless: boolean;
  };
}

export interface StatFilterParameterConfig extends BaseParameterConfig {
  type: 'statFilter';
  urlParam: string;
  separator: string;
  defaultValue?: { [key: string]: string[] };
}

export interface EnumParameterConfig extends BaseParameterConfig {
  type: 'enum';
  options: string[];
  defaultValue?: string;
}

export type ParameterConfig =
  | StringParameterConfig
  | NumberParameterConfig
  | BooleanParameterConfig
  | InclusionExclusionParameterConfig
  | ColorFilterParameterConfig
  | StatFilterParameterConfig
  | EnumParameterConfig;

export const browseParameterSchema: Record<string, ParameterConfig> = {
  viewContentType: {
    type: 'enum',
    mode: 'both',
    urlParam: 'contentType',
    options: ['cards', 'sets'],
    defaultValue: 'cards',
  },
  cardsPageSize: {
    type: 'number',
    mode: 'cards',
    urlParam: 'cardsPageSize',
    defaultValue: 20,
  },
  setsPageSize: {
    type: 'number',
    mode: 'sets',
    urlParam: 'setsPageSize',
    defaultValue: 20,
  },

  cardsSortBy: {
    type: 'enum',
    mode: 'cards',
    urlParam: 'cardsSortBy',
    options: [
      'name',
      'releasedAt',
      'collectorNumber',
      'mtgcbCollectorNumber',
      'rarityNumeric',
      'powerNumeric',
      'toughnessNumeric',
      'loyaltyNumeric',
      'convertedManaCost',
      'market',
      'low',
      'average',
      'high',
      'foil',
      'quantityReg',
      'quantityFoil',
      'quantityAll',
    ],
    defaultValue: 'releasedAt',
  },
  cardsSortOrder: {
    type: 'enum',
    mode: 'cards',
    urlParam: 'cardsSortOrder',
    options: ['asc', 'desc'],
    defaultValue: 'asc',
  },
  setsSortBy: {
    type: 'enum',
    mode: 'sets',
    urlParam: 'setsSortBy',
    options: [
      'name',
      'releasedAt',
      'code',
      'cardCount',
      'setType',
      'totalValue',
      'costToComplete.oneOfEachCard',
      'percentageCollected',
    ],
    defaultValue: 'releasedAt',
  },
  setsSortOrder: {
    type: 'enum',
    mode: 'sets',
    urlParam: 'setsSortOrder',
    options: ['asc', 'desc'],
    defaultValue: 'desc',
  },
  cardName: {
    type: 'string',
    mode: 'cards',
    urlParam: 'name',
    defaultValue: '',
  },
  oracleText: {
    type: 'string',
    mode: 'cards',
    urlParam: 'oracleText',
    defaultValue: '',
  },
  artist: {
    type: 'string',
    mode: 'cards',
    urlParam: 'artist',
    defaultValue: '',
  },
  oneResultPerCardName: {
    type: 'boolean',
    mode: 'cards',
    urlParam: 'oneResultPerCardName',
    defaultValue: false,
  },
  setName: {
    type: 'string',
    mode: 'sets',
    urlParam: 'setName',
    defaultValue: '',
  },
  code: {
    type: 'string',
    mode: 'sets',
    urlParam: 'code',
    defaultValue: '',
  },
  setCategories: {
    type: 'inclusionExclusion',
    mode: 'sets',
    urlParams: {
      include: 'includeCategories',
      exclude: 'excludeCategories',
    },
    separator: '|',
    defaultValue: {
      include: [],
      exclude: [],
    },
  },
  setTypes: {
    type: 'inclusionExclusion',
    mode: 'sets',
    urlParams: {
      include: 'includeSetTypes',
      exclude: 'excludeSetTypes',
    },
    separator: '|',
    defaultValue: {
      include: [],
      exclude: [],
    },
  },
  showSubsets: {
    type: 'boolean',
    mode: 'sets',
    urlParam: 'showSubsets',
    defaultValue: true,
  },
  includeSubsetsInSets: {
    type: 'boolean',
    mode: 'sets',
    urlParam: 'includeSubsetsInSets',
    defaultValue: false,
  },
  completionStatus: {
    type: 'inclusionExclusion',
    mode: 'sets',
    urlParams: {
      include: 'includeCompletionStatus',
      exclude: 'excludeCompletionStatus',
    },
    separator: '|',
    defaultValue: {
      include: [],
      exclude: [],
    },
  },
  colors: {
    type: 'colorFilter',
    mode: 'cards',
    urlParams: {
      colors: 'colors',
      matchType: 'colorMatchType',
      colorless: 'colorless',
    },
    defaultValue: {
      colors: [],
      matchType: 'exactly',
      includeColorless: false,
    },
  },
  types: {
    type: 'inclusionExclusion',
    mode: 'cards',
    urlParams: {
      include: 'includeTypes',
      exclude: 'excludeTypes',
    },
    separator: '|',
    defaultValue: {
      include: [],
      exclude: [],
    },
  },
  rarities: {
    type: 'inclusionExclusion',
    mode: 'cards',
    urlParams: {
      include: 'includeRarities',
      exclude: 'excludeRarities',
    },
    separator: '|',
    defaultValue: {
      include: [],
      exclude: [],
    },
  },
  sets: {
    type: 'inclusionExclusion',
    mode: 'cards',
    urlParams: {
      include: 'includeSets',
      exclude: 'excludeSets',
    },
    separator: '|',
    defaultValue: {
      include: [],
      exclude: [],
    },
  },
  stats: {
    type: 'statFilter',
    mode: 'cards',
    urlParam: 'stats',
    separator: ',',
    defaultValue: {},
  },
  selectedGoalId: {
    type: 'number',
    mode: 'both',
    urlParam: 'goalId',
    defaultValue: undefined,
  },
  showGoals: {
    type: 'enum',
    mode: 'both',
    urlParam: 'showGoals',
    options: ['all', 'complete', 'incomplete'],
    defaultValue: 'all',
  },
  selectedLocationId: {
    type: 'number',
    mode: 'cards',
    urlParam: 'locationId',
    defaultValue: undefined,
  },
  includeChildLocations: {
    type: 'boolean',
    mode: 'cards',
    urlParam: 'includeChildLocations',
    defaultValue: false,
  },
};

export function getParametersForMode(mode: 'cards' | 'sets'): Record<string, ParameterConfig> {
  return Object.entries(browseParameterSchema).reduce(
    (acc, [key, config]) => {
      if (config.mode === mode || config.mode === 'both') {
        acc[key] = config;
      }
      return acc;
    },
    {} as Record<string, ParameterConfig>,
  );
}
