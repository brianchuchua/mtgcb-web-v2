'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useSearchCardsMutation } from '@/api/browse/browseApi';
import { ColorMatchType } from '@/types/browse';

export const useSearchFromUrl = () => {
  const [searchCards, { data: searchResult, isLoading, error }] = useSearchCardsMutation();
  const searchParams = useSearchParams();

  useEffect(() => {
    const apiParams: any = {
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
    const colorMatchType = searchParams.get('colorMatchType') as ColorMatchType;

    if (colorless) {
      apiParams.colors_array = {
        exactly: []
      };
    } else if (colors) {
      const colorArray = colors.split(',');
      switch (colorMatchType) {
        case 'exactly':
          apiParams.colors_array = {
            exactly: colorArray
          };
          break;
        case 'atLeast':
          apiParams.colors_array = {
            atLeast: colorArray
          };
          break;
        case 'atMost':
          apiParams.colors_array = {
            atMost: colorArray
          };
          break;
      }
    }

    searchCards(apiParams);
  }, [searchCards, searchParams]);

  return { searchResult, isLoading, error };
};
