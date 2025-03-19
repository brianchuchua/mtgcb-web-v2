import { CardApiParams } from '@/api/browse/types';
import { BrowseSearchParams, ColorMatchType } from '@/types/browse';

/**
 * Converts browser/Redux search parameters to API parameters
 * This utility extracts the logic for converting the search params format to API format
 */
export const buildApiParamsFromSearchParams = (searchParams: BrowseSearchParams): Partial<CardApiParams> => {
  const apiParams: Partial<CardApiParams> = {};

  // Add name filter
  if (searchParams.name) {
    apiParams.name = searchParams.name;
  }

  // Add oracle text filter
  if (searchParams.oracleText) {
    apiParams.oracleText = searchParams.oracleText;
  }

  // Add color filtering
  if (searchParams.colors) {
    if (searchParams.colors.includeColorless) {
      apiParams.colors_array = {
        exactly: [],
      };
    } else if (searchParams.colors.colors.length > 0) {
      const colorArray = searchParams.colors.colors;
      const matchType = searchParams.colors.matchType as ColorMatchType;
      
      switch (matchType) {
        case 'exactly':
          apiParams.colors_array = {
            exactly: colorArray,
          };
          break;
        case 'atLeast':
          apiParams.colors_array = {
            atLeast: colorArray,
          };
          break;
        case 'atMost':
          apiParams.colors_array = {
            atMost: colorArray,
          };
          break;
      }
    }
  }

  // Add type filtering
  if (searchParams.types) {
    const includeTypes = searchParams.types.include;
    const excludeTypes = searchParams.types.exclude;

    if (includeTypes.length > 0 || excludeTypes.length > 0) {
      apiParams.type = {
        ...(includeTypes.length > 0 && { AND: includeTypes }),
        ...(excludeTypes.length > 0 && { NOT: excludeTypes }),
      };
    }
  }

  // Add stat filtering - apply directly to the numeric fields
  if (searchParams.stats) {
    Object.entries(searchParams.stats).forEach(([attribute, conditions]) => {
      if (conditions.length > 0) {
        // Map URL operators to API operators
        const OPERATOR_MAP = {
          gte: '>=',
          gt: '>',
          lte: '<=',
          lt: '<',
          eq: '=',
          not: '!=',
        };

        const transformedConditions = conditions.map((cond) => {
          // Extract operator and value
          for (const [urlOp, apiOp] of Object.entries(OPERATOR_MAP)) {
            if (cond.startsWith(urlOp)) {
              const value = cond.slice(urlOp.length);
              return `${apiOp}${value}`;
            }
          }
          return cond;
        });

        // Add conditions directly to the field
        apiParams[attribute] = {
          AND: transformedConditions,
        };
      }
    });
  }

  return apiParams;
};