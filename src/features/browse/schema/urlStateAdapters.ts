import { ParameterConfig, browseParameterSchema } from './parameterSchema';
import { BrowseSearchParams, ColorFilter, StatFilters } from '@/types/browse';

const schemaToReduxKeyMap: Record<string, string> = {
  cardName: 'name',
  oracleText: 'oracleText',
  artist: 'artist',
  oneResultPerCardName: 'oneResultPerCardName',
  setName: 'name',
  code: 'code',
  colors: 'colors',
  types: 'types',
  rarities: 'rarities',
  sets: 'sets',
  stats: 'stats',
  sortBy: 'sortBy',
  sortOrder: 'sortOrder',
  cardsPage: 'currentPage',
  cardsPageSize: 'pageSize',
  setsPage: 'currentPage',
  setsPageSize: 'pageSize',
  viewContentType: 'viewContentType',
};

export function parseUrlToState(
  searchParams: URLSearchParams,
  currentMode: 'cards' | 'sets',
): Partial<BrowseSearchParams> {
  const state: Partial<BrowseSearchParams> = {};

  Object.entries(browseParameterSchema).forEach(([schemaKey, config]) => {
    if (config.mode !== currentMode && config.mode !== 'both') return;

    const reduxKey = schemaToReduxKeyMap[schemaKey] || schemaKey;

    switch (config.type) {
      case 'string':
        parseStringParameter(state, reduxKey, searchParams, config);
        break;
      case 'number':
        parseNumberParameter(state, reduxKey, searchParams, config);
        break;
      case 'boolean':
        parseBooleanParameter(state, reduxKey, searchParams, config);
        break;
      case 'enum':
        parseEnumParameter(state, reduxKey, searchParams, config);
        break;
      case 'inclusionExclusion':
        parseInclusionExclusionParameter(state, reduxKey, searchParams, config);
        break;
      case 'colorFilter':
        parseColorFilterParameter(state, reduxKey, searchParams, config);
        break;
      case 'statFilter':
        parseStatFilterParameter(state, reduxKey, searchParams, config);
        break;
    }
  });

  return state;
}

const reduxToSchemaKeyMap: Record<string, string | [string, string]> = {
  name: ['cardName', 'setName'],
  oracleText: 'oracleText',
  artist: 'artist',
  oneResultPerCardName: 'oneResultPerCardName',
  code: 'code',
  colors: 'colors',
  types: 'types',
  rarities: 'rarities',
  sets: 'sets',
  stats: 'stats',
  sortBy: 'sortBy',
  sortOrder: 'sortOrder',
  currentPage: ['cardsPage', 'setsPage'],
  pageSize: ['cardsPageSize', 'setsPageSize'],
  viewContentType: 'viewContentType',
};

export function convertStateToUrlParams(
  state: Partial<BrowseSearchParams>,
  currentMode: 'cards' | 'sets',
): URLSearchParams {
  const params = new URLSearchParams();

  params.set('contentType', currentMode);
  Object.entries(state).forEach(([reduxKey, value]) => {
    if (value === undefined || value === null) return;
    if (reduxKey === 'viewMode') return;

    const mappedKey = reduxToSchemaKeyMap[reduxKey] || reduxKey;

    let schemaKey: string;
    if (Array.isArray(mappedKey)) {
      schemaKey = currentMode === 'cards' ? mappedKey[0] : mappedKey[1];
    } else {
      schemaKey = mappedKey;
    }

    const config = browseParameterSchema[schemaKey];

    if (!config || (config.mode !== currentMode && config.mode !== 'both')) return;

    if (value === config.defaultValue) return;

    switch (config.type) {
      case 'string':
        addStringParameter(params, value, config, schemaKey);
        break;
      case 'number':
        addNumberParameter(params, value, config, schemaKey);
        break;
      case 'boolean':
        addBooleanParameter(params, value, config, schemaKey);
        break;
      case 'enum':
        addEnumParameter(params, value, config, schemaKey);
        break;
      case 'inclusionExclusion':
        addInclusionExclusionParameter(params, value, config);
        break;
      case 'colorFilter':
        addColorFilterParameter(params, value, config);
        break;
      case 'statFilter':
        addStatFilterParameter(params, value, config);
        break;
    }
  });

  return params;
}

function parseStringParameter(state: any, key: string, searchParams: URLSearchParams, config: ParameterConfig) {
  if (config.type !== 'string') return;

  const value = searchParams.get(config.urlParam || key);
  if (value) {
    state[key] = value;
  }
}

function parseNumberParameter(state: any, key: string, searchParams: URLSearchParams, config: ParameterConfig) {
  if (config.type !== 'number') return;

  const value = searchParams.get(config.urlParam || key);
  if (value) {
    state[key] = parseInt(value, 10);
  }
}

function parseBooleanParameter(state: any, key: string, searchParams: URLSearchParams, config: ParameterConfig) {
  if (config.type !== 'boolean') return;

  const value = searchParams.get(config.urlParam || key);
  if (value) {
    state[key] = value === 'true';
  }
}

function parseEnumParameter(state: any, key: string, searchParams: URLSearchParams, config: ParameterConfig) {
  if (config.type !== 'enum') return;

  const value = searchParams.get(config.urlParam || key);
  if (value && config.options.includes(value)) {
    state[key] = value;
  }
}

function parseInclusionExclusionParameter(
  state: any,
  key: string,
  searchParams: URLSearchParams,
  config: ParameterConfig,
) {
  if (config.type !== 'inclusionExclusion') return;

  const includeValue = searchParams.get(config.urlParams.include);
  const excludeValue = searchParams.get(config.urlParams.exclude);

  if (includeValue || excludeValue) {
    state[key] = {
      include: includeValue ? includeValue.split(config.separator) : [],
      exclude: excludeValue ? excludeValue.split(config.separator) : [],
    };
  }
}

function parseColorFilterParameter(state: any, key: string, searchParams: URLSearchParams, config: ParameterConfig) {
  if (config.type !== 'colorFilter') return;

  const colorsValue = searchParams.get(config.urlParams.colors);
  const matchTypeValue = searchParams.get(config.urlParams.matchType);
  const colorlessValue = searchParams.get(config.urlParams.colorless);

  if (colorsValue || colorlessValue === 'true') {
    state[key] = {
      colors: colorsValue ? colorsValue.split(',') : [],
      matchType: (matchTypeValue as 'exactly' | 'atLeast' | 'atMost') || 'exactly',
      includeColorless: colorlessValue === 'true',
    };
  }
}

function parseStatFilterParameter(state: any, key: string, searchParams: URLSearchParams, config: ParameterConfig) {
  if (config.type !== 'statFilter') return;

  const statsValue = searchParams.get(config.urlParam || key);

  if (statsValue) {
    const statFilters: StatFilters = {};

    // Format: "power=gte1|lte3,toughness=gte2"
    const statGroups = statsValue.split(config.separator);
    statGroups.forEach((group) => {
      const [attribute, conditions] = group.split('=');
      if (attribute && conditions) {
        statFilters[attribute] = conditions.split('|');
      }
    });

    if (Object.keys(statFilters).length > 0) {
      state[key] = statFilters;
    }
  }
}

function addStringParameter(params: URLSearchParams, value: string, config: ParameterConfig, key: string) {
  if (config.type !== 'string') return;

  if (value && value !== '') {
    const paramName = config.urlParam || key;
    params.set(paramName, value);
  }
}

function addNumberParameter(params: URLSearchParams, value: number, config: ParameterConfig, key: string) {
  if (config.type !== 'number') return;

  if (value !== undefined && value !== null) {
    // Only add if not default value
    if (value !== config.defaultValue) {
      params.set(config.urlParam || key, value.toString());
    }
  }
}

function addBooleanParameter(params: URLSearchParams, value: boolean, config: ParameterConfig, key: string) {
  if (config.type !== 'boolean') return;

  if (value !== undefined && value !== null) {
    params.set(config.urlParam || key, value.toString());
  }
}

function addEnumParameter(params: URLSearchParams, value: string, config: ParameterConfig, key: string) {
  if (config.type !== 'enum') return;

  if (value && value !== config.defaultValue) {
    params.set(config.urlParam || key, value);
  }
}

function addInclusionExclusionParameter(
  params: URLSearchParams,
  value: { include: string[]; exclude: string[] },
  config: ParameterConfig,
) {
  if (config.type !== 'inclusionExclusion') return;

  if (value.include && value.include.length > 0) {
    params.set(config.urlParams.include, value.include.join(config.separator));
  }

  if (value.exclude && value.exclude.length > 0) {
    params.set(config.urlParams.exclude, value.exclude.join(config.separator));
  }
}

function addColorFilterParameter(params: URLSearchParams, value: ColorFilter, config: ParameterConfig) {
  if (config.type !== 'colorFilter') return;

  if (value.colors && value.colors.length > 0) {
    params.set(config.urlParams.colors, value.colors.join(','));
    params.set(config.urlParams.matchType, value.matchType);
  }

  if (value.includeColorless) {
    params.set(config.urlParams.colorless, 'true');
  }
}

function addStatFilterParameter(params: URLSearchParams, value: StatFilters, config: ParameterConfig) {
  if (config.type !== 'statFilter') return;

  const hasConditions = Object.values(value).some((conditions) => conditions && conditions.length > 0);

  if (hasConditions) {
    // Format each stat group as: attribute=condition1|condition2
    const statParams = Object.entries(value)
      .filter(([_, conditions]) => conditions && conditions.length > 0)
      .map(([attribute, conditions]) => `${attribute}=${conditions.join('|')}`);

    if (statParams.length > 0) {
      params.set(config.urlParam || '', statParams.join(config.separator));
    }
  }
}
