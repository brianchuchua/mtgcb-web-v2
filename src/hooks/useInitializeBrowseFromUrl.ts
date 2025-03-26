'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { setSearchParams } from '@/redux/slices/browseSlice';
import { BrowseSearchParams, ColorMatchType, SortByOption, SortOrderOption, StatFilters } from '@/types/browse';

export const useInitializeBrowseFromUrl = () => {
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const params: BrowseSearchParams = {};

    // Handle name
    const name = searchParams.get('name');
    if (name) {
      params.name = name;
    }

    // Handle oracle text
    const oracleText = searchParams.get('oracleText');
    if (oracleText) {
      params.oracleText = oracleText;
    }

    // Handle artist
    const artist = searchParams.get('artist');
    if (artist) {
      params.artist = artist;
    }

    // Handle oneResultPerCardName
    const oneResultPerCardName = searchParams.get('oneResultPerCardName') === 'true';
    if (oneResultPerCardName) {
      params.oneResultPerCardName = true;
    }

    // Handle color params
    const colorless = searchParams.get('colorless') === 'true';
    const colors = searchParams.get('colors');
    const colorMatchType = (searchParams.get('colorMatchType') || 'exactly') as ColorMatchType;

    if (colorless) {
      params.colors = {
        colors: [],
        matchType: 'exactly',
        includeColorless: true,
      };
    } else if (colors) {
      params.colors = {
        colors: colors.split(','),
        matchType: colorMatchType,
        includeColorless: false,
      };
    }

    // Handle type params
    const includeTypes = searchParams.get('includeTypes');
    const excludeTypes = searchParams.get('excludeTypes');

    if (includeTypes || excludeTypes) {
      params.types = {
        include: includeTypes ? includeTypes.split('|') : [],
        exclude: excludeTypes ? excludeTypes.split('|') : [],
      };
    }

    // Handle rarity params
    const includeRarities = searchParams.get('includeRarities');
    const excludeRarities = searchParams.get('excludeRarities');

    if (includeRarities || excludeRarities) {
      params.rarities = {
        include: includeRarities ? includeRarities.split('|') : [],
        exclude: excludeRarities ? excludeRarities.split('|') : [],
      };
    }

    const stats = searchParams.get('stats');
    if (stats) {
      const statFilters: StatFilters = {};

      // Format: convertedManaCost=gte2|lt5,power=gte2
      stats.split(',').forEach((group) => {
        const [attribute, conditions] = group.split('=');
        if (attribute && conditions) {
          statFilters[attribute] = conditions.split('|');
        }
      });

      if (Object.keys(statFilters).length > 0) {
        params.stats = statFilters;
      }
    }

    // Handle sorting parameters
    const sortBy = searchParams.get('sortBy') as SortByOption | null;
    if (sortBy) {
      params.sortBy = sortBy;
    }

    const sortOrder = searchParams.get('sortOrder') as SortOrderOption | null;
    if (sortOrder) {
      params.sortOrder = sortOrder;
    }

    dispatch(setSearchParams(params));
  }, [dispatch, searchParams]);
};
