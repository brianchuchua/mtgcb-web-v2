import { CardApiParams, SetApiParams } from '@/api/browse/types';
import { BrowseSearchParams, ColorMatchType, SortByOption, SortOrderOption } from '@/types/browse';

/**
 * Converts browser/Redux search parameters to API parameters
 * This utility extracts the logic for converting the search params format to API format
 */
export const buildApiParamsFromSearchParams = (
  searchParams: BrowseSearchParams,
  contentType: 'cards' | 'sets' = 'cards',
): Partial<CardApiParams | SetApiParams> => {
  const apiParams: Partial<CardApiParams & SetApiParams> = {};

  // Add common parameters for both cards and sets
  if (searchParams.name) {
    apiParams.name = searchParams.name;
  }

  // Add set code for sets
  if (contentType === 'sets' && searchParams.code) {
    apiParams.code = searchParams.code;
  }

  // Add sorting parameters
  if (searchParams.sortBy) {
    apiParams.sortBy = searchParams.sortBy;
  }

  if (searchParams.sortOrder) {
    apiParams.sortDirection = searchParams.sortOrder;
  }

  // Add card-specific parameters
  if (contentType === 'cards') {
    // Add oracle text filter
    if (searchParams.oracleText) {
      apiParams.oracleText = searchParams.oracleText;
    }

    // Add artist filter
    if (searchParams.artist) {
      apiParams.artist = searchParams.artist;
    }

    // Add oneResultPerCardName parameter
    if (searchParams.oneResultPerCardName) {
      apiParams.oneResultPerCardName = searchParams.oneResultPerCardName;
    }

    // Add includeBadDataOnly parameter
    if (searchParams.includeBadDataOnly) {
      apiParams.includeBadDataOnly = searchParams.includeBadDataOnly;
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

    // Add rarity filtering - using OR for includes (since a card can only have one rarity)
    if (searchParams.rarities) {
      const includeRarities = searchParams.rarities.include;
      const excludeRarities = searchParams.rarities.exclude;

      if (includeRarities.length > 0 || excludeRarities.length > 0) {
        // Handle includes with OR logic (card has any of the selected rarities)
        if (includeRarities.length > 0) {
          apiParams.rarityNumeric = {
            OR: includeRarities.map((value) => `=${value}`),
          };
        }

        // Handle excludes with AND logic (card has none of the excluded rarities)
        if (excludeRarities.length > 0) {
          if (!apiParams.rarityNumeric) {
            apiParams.rarityNumeric = {};
          }

          apiParams.rarityNumeric.AND = excludeRarities.map((value) => `!=${value}`);
        }
      }
    }

    // Add set filtering - using OR for includes (since a card can only belong to one set)
    if (searchParams.sets) {
      const includeSets = searchParams.sets.include;
      const excludeSets = searchParams.sets.exclude;

      if (includeSets.length > 0 || excludeSets.length > 0) {
        if (includeSets.length > 0) {
          // For numeric IDs, use direct values in an OR array
          apiParams.setId = {
            OR: includeSets,
          };
        }

        if (excludeSets.length > 0) {
          if (!apiParams.setId) {
            apiParams.setId = {};
          }

          // For exclusions, use direct values in an AND array with != operator
          apiParams.setId.AND = excludeSets.map((value) => `!=${value}`);
        }
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

          // Filter out empty values and transform the valid ones
          const transformedConditions = conditions
            .filter((cond) => {
              // Check if condition has a value
              for (const urlOp of Object.keys(OPERATOR_MAP)) {
                if (cond.startsWith(urlOp)) {
                  const value = cond.slice(urlOp.length);
                  return value.trim() !== ''; // Skip empty values
                }
              }
              return false;
            })
            .map((cond) => {
              // Extract operator and value
              for (const [urlOp, apiOp] of Object.entries(OPERATOR_MAP)) {
                if (cond.startsWith(urlOp)) {
                  const value = cond.slice(urlOp.length);
                  return `${apiOp}${value}`;
                }
              }
              return cond;
            });

          // Only add field if there are actual conditions after filtering
          if (transformedConditions.length > 0) {
            apiParams[attribute] = {
              AND: transformedConditions,
            };
          }
        }
      });
    }
  }

  // Add set-specific parameters
  if (contentType === 'sets') {
    // Add set category filtering
    if (searchParams.setCategories) {
      const includeCategories = searchParams.setCategories.include;
      const excludeCategories = searchParams.setCategories.exclude;

      // Build the filter object
      const categoryFilter: any = {};

      // Handle inclusions with OR
      if (includeCategories.length > 0) {
        categoryFilter.OR = includeCategories.map((value) => `"${value}"`);
      }

      // Handle exclusions with NOT
      if (excludeCategories.length > 0) {
        categoryFilter.NOT = excludeCategories.map((value) => `"${value}"`);
      }

      // Only set the filter if we have either inclusions or exclusions
      if (Object.keys(categoryFilter).length > 0) {
        apiParams.category = categoryFilter;
      }
    }

    // Add set type filtering
    if (searchParams.setTypes) {
      const includeTypes = searchParams.setTypes.include;
      const excludeTypes = searchParams.setTypes.exclude;

      // Build the filter object
      const typeFilter: any = {};

      // Handle inclusions with OR
      if (includeTypes.length > 0) {
        typeFilter.OR = includeTypes.map((value) => `"${value}"`);
      }

      // Handle exclusions with NOT
      if (excludeTypes.length > 0) {
        typeFilter.NOT = excludeTypes.map((value) => `"${value}"`);
      }

      // Only set the filter if we have either inclusions or exclusions
      if (Object.keys(typeFilter).length > 0) {
        apiParams.setType = typeFilter;
      }
    }

    if (searchParams.showSubsets === false) {
      apiParams.parentSetId = null;
    }

    // Add completion status for collections
    if (searchParams.completionStatus) {
      const includeStatuses = searchParams.completionStatus.include;
      const excludeStatuses = searchParams.completionStatus.exclude;
      
      if (includeStatuses.length > 0 || excludeStatuses.length > 0) {
        const statusFilter: any = {};
        
        if (includeStatuses.length > 0) {
          statusFilter.OR = includeStatuses;
        }
        
        if (excludeStatuses.length > 0) {
          statusFilter.NOT = excludeStatuses;
        }
        
        apiParams.completionStatus = statusFilter;
      }
    }
  }

  return apiParams;
};
