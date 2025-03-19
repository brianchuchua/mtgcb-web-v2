'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useSearchCardsMutation } from '@/api/browse/browseApi';
import { CardApiParams } from '@/api/browse/types';
import { useAppSelector } from '@/redux/hooks';
import { ColorMatchType } from '@/types/browse';

const OPERATOR_MAP = {
  gte: '>=',
  gt: '>',
  lte: '<=',
  lt: '<',
  eq: '=',
  not: '!=',
};

export const useSearchFromUrl = () => {
  const [searchCards, { data: searchResult, isLoading, error }] = useSearchCardsMutation();
  const searchParams = useSearchParams();
  
  // Get pagination state from URL
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '24', 10);

  useEffect(() => {
    const apiParams: CardApiParams = {
      select: [
        'name',
        'setId',
        'setName',
        'tcgplayerId',
        'market',
        'low',
        'average',
        'high',
        'foil',
        'collectorNumber',
        'mtgcbCollectorNumber',
        'rarity',
      ],
      limit: pageSize,
      offset: (currentPage - 1) * pageSize,
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

    const stats = searchParams.get('stats');
    if (stats) {
      // Parse stats parameter: convertedManaCost=gte4|gte3,power=gte2
      stats.split(',').forEach((group) => {
        const [attribute, conditions] = group.split('=');
        if (attribute && conditions) {
          const transformedConditions = conditions.split('|').map((cond) => {
            for (const [urlOp, apiOp] of Object.entries(OPERATOR_MAP)) {
              if (cond.startsWith(urlOp)) {
                const value = cond.slice(urlOp.length);
                return `${apiOp}${value}`;
              }
            }
            return cond;
          });

          apiParams[attribute] = {
            AND: transformedConditions,
          };
        }
      });
    }

    // Add sort parameters from URL if specified
    const sortBy = searchParams.get('sortBy');
    const sortDirection = searchParams.get('sortDirection');
    
    if (sortBy) {
      apiParams.sortBy = sortBy;
    }
    
    if (sortDirection && (sortDirection === 'asc' || sortDirection === 'desc')) {
      apiParams.sortDirection = sortDirection;
    }

    searchCards(apiParams);
  }, [searchCards, searchParams, currentPage, pageSize]);

  return { searchResult, isLoading, error };
};