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
  cardsPage: {
    type: 'number',
    mode: 'cards',
    urlParam: 'cardsPage',
    defaultValue: 1,
  },
  cardsPageSize: {
    type: 'number',
    mode: 'cards',
    urlParam: 'cardsPageSize',
    defaultValue: 24,
  },
  setsPage: {
    type: 'number',
    mode: 'sets',
    urlParam: 'setsPage',
    defaultValue: 1,
  },
  setsPageSize: {
    type: 'number',
    mode: 'sets',
    urlParam: 'setsPageSize',
    defaultValue: 24,
  },

  sortBy: {
    type: 'enum',
    mode: 'both',
    urlParam: 'sortBy',
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
      'code',
      'cardCount',
      'setType',
    ],
    defaultValue: 'releasedAt',
  },
  sortOrder: {
    type: 'enum',
    mode: 'both',
    urlParam: 'sortOrder',
    options: ['asc', 'desc'],
    defaultValue: 'asc',
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
