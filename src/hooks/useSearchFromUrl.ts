'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useSearchCardsMutation } from '@/api/browse/browseApi';
import { ColorMatchType } from '@/types/browse';

// Map our URL operators to API operators
const OPERATOR_MAP = {
  'gte': '>=',
  'gt': '>',
  'lte': '<=',
  'lt': '<',
  'eq': '=',
  'not': '!='
};

export const useSearchFromUrl = () => {
  const [searchCards, { data: searchResult, isLoading, error }] = useSearchCardsMutation();
  const searchParams = useSearchParams();

  useEffect(() => {
    const apiParams: any = {
      select: ['*'],
      limit: 24,
      offset: 0,
      sortBy: 'name',
      sortDirection: 'asc',
    };

    // Add name filter
    const name = searchParams.get('name');
    if (name) {
      apiParams.name = name;
    }

    // Add oracle text filter
    const oracleText = searchParams.get('oracleText');
    if (oracleText) {
      apiParams.oracleText = oracleText;
    }

    // Add color filtering
    const colorless = searchParams.get('colorless') === 'true';
    const colors = searchParams.get('colors');
    const colorMatchType = (searchParams.get('colorMatchType') || 'exactly') as ColorMatchType;

    if (colorless) {
      apiParams.colors_array = {
        exactly: [],
      };
    } else if (colors) {
      const colorArray = colors.split(',');
      switch (colorMatchType) {
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

    // Add type filtering
    const includeTypes = searchParams.get('includeTypes');
    const excludeTypes = searchParams.get('excludeTypes');

    if (includeTypes || excludeTypes) {
      apiParams.type = {
        ...(includeTypes && { AND: includeTypes.split('|') }),
        ...(excludeTypes && { NOT: excludeTypes.split('|') }),
      };
    }

    // Add stat filtering - apply directly to the numeric fields
    const stats = searchParams.get('stats');
    if (stats) {
      // Parse stats parameter: convertedManaCost=gte4|gte3,power=gte2
      stats.split(',').forEach(group => {
        const [attribute, conditions] = group.split('=');
        if (attribute && conditions) {
          const transformedConditions = conditions.split('|').map(cond => {
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
            AND: transformedConditions
          };
        }
      });
    }

    searchCards(apiParams);
  }, [searchCards, searchParams]);

  return { searchResult, isLoading, error };
};